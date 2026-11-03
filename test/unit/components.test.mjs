import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, zod, mount, input, flush, sleep, endTransition, within } from './harness.mjs';

void test('Button renders text/icon slots and forwards a click event', () => {
  let event;
  mount(ui.Button, {
    type: 'primary',
    size: 'lg',
    'slot:default': ui.BodySlot,
    'slot:icon': ui.IconSlot,
    'on:click': (value) => {
      event = value;
    },
  });
  const button = document.querySelector('button');
  assert.ok(button.classList.contains('primary'));
  assert.ok(button.classList.contains('lg'));
  assert.equal(button.querySelector('strong').textContent, 'slot body');
  assert.ok(button.querySelector('[data-testid="icon-slot"]'));
  button.click();
  assert.equal(event.target, button);
});

void test('Button loading disables clicks and replaces its icon with a spinner', () => {
  let count = 0;
  mount(ui.Button, { loading: true, 'slot:icon': ui.IconSlot, 'on:click': () => count++ });
  const button = document.querySelector('button');
  button.click();
  assert.equal(button.disabled, true);
  assert.ok(button.querySelector('.ja-loading svg'));
  assert.equal(button.querySelector('[data-testid="icon-slot"]'), null);
  assert.equal(count, 0);
});

void test('ButtonGroup renders its child buttons', () => {
  mount(ui.ButtonGroup, { size: 'sm', 'slot:default': ui.NestedButtons });
  assert.ok(document.querySelector('div > button.ja-button'));
});

void test('Avatar forwards and updates its container class', async () => {
  const props = rt.vm({ className: 'user-avatar' });
  mount(ui.Avatar, props);
  assert.ok(document.querySelector('.user-avatar'));
  props.className = 'changed-avatar';
  await flush();
  assert.ok(document.querySelector('.changed-avatar'));
});

void test('Input keeps uncontrolled input text and forwards focus/blur', async () => {
  const changes = [];
  const events = [];
  mount(ui.Input, {
    placeholder: 'Name',
    'on:change': (value) => changes.push(value),
    'on:focus': () => events.push('focus'),
    'on:blur': () => events.push('blur'),
  });
  const el = document.querySelector('input');
  el.dispatchEvent(new FocusEvent('focus'));
  input('Ada');
  await flush();
  el.dispatchEvent(new FocusEvent('blur'));
  assert.equal(el.value, 'Ada');
  assert.equal(el.placeholder, 'Name');
  assert.deepEqual(changes, ['Ada']);
  assert.deepEqual(events, ['focus', 'blur']);
});

void test('Input responds to controlled value/disabled updates', async () => {
  const props = rt.vm({ value: 'before', disabled: false, size: 'sm', noRoundedL: true });
  mount(ui.Input, props);
  props.value = 'after';
  props.disabled = true;
  await flush();
  const el = document.querySelector('input');
  assert.equal(el.value, 'after');
  assert.equal(el.disabled, true);
  assert.ok(el.classList.contains('no-rounded-l'));
});

void test('InputInner forwards its native input event and attributes', () => {
  let event;
  mount(ui.InputInner, {
    className: 'inner',
    value: 'value',
    placeholder: 'hint',
    'on:input': (value) => {
      event = value;
    },
  });
  input('next');
  assert.equal(event.target.value, 'next');
  assert.equal(document.querySelector('input').className, 'inner');
});

void test('InputWrapper and InputAddon render their children and classes', () => {
  mount(ui.InputWrapper, { className: 'wrapper', 'slot:default': ui.BodySlot });
  mount(ui.InputAddon, { className: 'addon', size: 'lg', 'slot:default': ui.BodySlot });
  assert.equal(document.querySelector('.ja-input-wrapper.wrapper strong').textContent, 'slot body');
  assert.equal(document.querySelector('.ja-input-addon.addon.lg strong').textContent, 'slot body');
});

void test('InputNumber emits numeric edits and synchronizes external values', async () => {
  const changes = [];
  const props = rt.vm({
    value: 2,
    min: 0,
    max: 10,
    step: 0.5,
    'on:change': (value) => changes.push(value),
  });
  mount(ui.InputNumber, props);
  input('3.5');
  assert.deepEqual(changes, [3.5]);
  props.value = 7;
  await flush();
  const el = document.querySelector('input');
  assert.equal(el.value, '7');
  assert.equal(el.min, '0');
  assert.equal(el.max, '10');
  assert.equal(el.step, '0.5');
});

void test('Form validates fields, clears errors, and returns transformed submit data', async () => {
  const form = ui.useForm(
    zod.z.object({
      name: zod.z
        .string()
        .min(2, 'Too short')
        .transform((v) => v.toUpperCase()),
    }),
    { defaultValues: { name: 'a' } },
  );
  assert.equal(await form.validateField('name'), 'Too short');
  await form.setField('name', 'ada', true);
  assert.equal(form.formErrors.name, undefined);
  assert.deepEqual(await form.validate(), [undefined, { name: 'ADA' }]);
  assert.equal(form.control.validated, true);
});

void test('Form watchers deliver defaults and edits and stop after unsubscribe', async () => {
  const form = ui.useForm(zod.z.object({ name: zod.z.string() }), {
    defaultValues: { name: 'first' },
  });
  const values = [];
  const stop = form.control.watchField('name', (value) => values.push(value));
  await form.setField('name', 'second');
  await flush();
  stop();
  await form.setField('name', 'third');
  await flush();
  assert.deepEqual(values, ['first', 'second']);
});

void test('Controller binds defaults, external edits, user edits, and blur validation', async () => {
  const form = ui.useForm(
    zod.z.object({ first: zod.z.string().min(2, 'Too short'), second: zod.z.string() }),
    { defaultValues: { first: 'Ada', second: 'Bob' } },
  );
  const view = mount(ui.ControllerField, { name: 'first', control: form.control });
  assert.equal(document.querySelector('input').value, 'Ada');
  await form.setField('first', 'Grace');
  await flush();
  assert.equal(document.querySelector('input').value, 'Grace');
  input('x');
  document.querySelector('input').dispatchEvent(new FocusEvent('blur'));
  await flush();
  assert.equal(form.formState.first, 'x');
  assert.equal(form.formErrors.first, 'Too short');
  view.dispose();
  await form.setField('first', 'after unmount');
  await flush();
  assert.equal(document.querySelector('input'), null);
});

void test('Menu renders label/icon slots, selection changes, and external selection', async () => {
  const changes = [];
  const props = rt.vm({
    value: 'a',
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', 'slot:label': ui.ContentSlot, 'slot:icon': ui.IconSlot },
    ],
    'on:change': (value) => {
      changes.push(value);
      props.value = value;
    },
  });
  mount(ui.Menu, props);
  assert.equal(document.querySelector('.ja-active').textContent.trim(), 'A');
  document.querySelectorAll('button')[1].click();
  await flush();
  assert.deepEqual(changes, ['b']);
  assert.ok(document.querySelector('.ja-active [data-testid="content-slot"]'));
  props.value = 'b';
  await flush();
  props.value = 'a';
  await flush();
  assert.equal(document.querySelector('.ja-active').textContent.trim(), 'A');
});

void test('Select selects an uncontrolled option and shows the new label', async () => {
  const changes = [];
  mount(ui.Select, {
    placeholder: 'Choose',
    options: [{ value: 'a', label: 'A' }],
    'on:change': (value) => changes.push(value),
  });
  document.querySelector('.ja-select').click();
  await flush();
  await flush();
  document.querySelector('.ja-menu-item').click();
  await flush();
  assert.equal(document.querySelector('.ja-select').textContent, 'A');
  assert.deepEqual(changes, ['a']);
});

void test('Dropdown opens, forwards a selected value, and closes', async () => {
  const changes = [];
  const opens = [];
  mount(ui.Dropdown, {
    options: [{ value: 'a', label: 'A' }],
    'slot:default': ui.TriggerSlot,
    'on:change': (value) => changes.push(value),
    'on:openChange': (value) => opens.push(value),
  });
  document.querySelector('button').click();
  await flush();
  await flush();
  document.querySelector('.ja-menu-item').click();
  await flush();
  endTransition('.ja-floating');
  assert.deepEqual(changes, ['a']);
  assert.deepEqual(opens, [true, false]);
  assert.equal(document.querySelector('.ja-floating'), null);
});

void test('Floating controlled mode emits requests and waits for the parent to open', async () => {
  const changes = [];
  const props = rt.vm({
    open: false,
    zIndex: 50,
    'slot:trigger': ui.TriggerSlot,
    'slot:default': ui.BodySlot,
    'on:openChange': (value) => changes.push(value),
  });
  mount(ui.Floating, props);
  document.querySelector('button').click();
  await flush();
  assert.deepEqual(changes, [true]);
  assert.equal(document.querySelector('.ja-floating'), null);
  props.open = true;
  await flush();
  await flush();
  assert.equal(document.querySelector('.ja-floating strong').textContent, 'slot body');
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  assert.deepEqual(changes, [true, false]);
});

void test('Popover renders its named content slot after a click', async () => {
  mount(ui.Popover, { 'slot:default': ui.TriggerSlot, 'slot:content': ui.ContentSlot });
  document.querySelector('button').click();
  await flush();
  await flush();
  assert.equal(
    document.querySelector('.ja-popover [data-testid="content-slot"]').textContent,
    'custom content',
  );
});

void test('Tooltip opens after its hover delay and renders text content', async () => {
  mount(ui.Tooltip, { content: 'Helpful', 'slot:default': ui.TriggerSlot });
  document.querySelector('button').dispatchEvent(new MouseEvent('mouseenter'));
  assert.equal(document.querySelector('.ja-tooltip'), null);
  await sleep(380);
  assert.equal(document.querySelector('.ja-tooltip').textContent, 'Helpful');
});

void test('Popconfirm forwards cancel and removes its content after leaving', async () => {
  let cancelled = 0;
  mount(ui.Popconfirm, {
    title: 'Proceed?',
    content: 'Details',
    'slot:default': ui.TriggerSlot,
    'on:cancel': () => cancelled++,
  });
  document.querySelector('button').click();
  await flush();
  await flush();
  assert.ok(document.querySelector('.ja-popconfirm').textContent.includes('Proceed?'));
  document.querySelector('.ja-popconfirm-footer button').click();
  await flush();
  endTransition('.ja-floating');
  assert.equal(cancelled, 1);
  assert.equal(document.querySelector('.ja-popconfirm'), null);
});

void test('Modal renders title/body and returns its confirm value', async () => {
  const results = [];
  mount(ui.Modal, {
    title: 'Dialog',
    confirmValue: 'yes',
    'slot:default': ui.BodySlot,
    'on:afterClose': (value) => results.push(value),
  });
  await flush();
  assert.equal(document.querySelector('.ja-modal-title').textContent, 'Dialog');
  assert.ok(document.querySelector('.ja-modal-content strong'));
  document.querySelector('.ja-modal-footer button.primary').click();
  await flush();
  endTransition('.ja-modal');
  assert.deepEqual(results, ['yes']);
});

void test('modal.show exposes close and resolves a waiting caller with the result', async () => {
  const instance = ui.modal.show({ title: 'Dialog', content: 'Body' });
  const waiting = instance.waitForClose();
  await flush();
  instance.close('closed');
  await flush();
  endTransition('.ja-modal');
  assert.equal(await within(waiting), 'closed');
  assert.equal(document.querySelector('.ja-modal'), null);
});

void test('Message shows, updates content/type, closes and resolves a waiter', async () => {
  let closed = 0;
  const instance = ui.message.info({ content: 'Before', duration: 0, 'on:close': () => closed++ });
  await flush();
  assert.equal(document.querySelector('.ja-message .content').textContent, 'Before');
  instance.update({ type: 'success', content: 'After' });
  await flush();
  assert.equal(document.querySelector('.ja-message .content').textContent, 'After');
  assert.ok(document.querySelector('.ja-message .icon.success'));
  const waiting = instance.waitClose();
  instance.close();
  await within(waiting);
  assert.equal(closed, 1);
});

void test('Message duration closes automatically and container configuration applies at creation', async () => {
  ui.message.configContainer({ paddingTop: 24 });
  const instance = ui.message.warning({ content: 'Timed', duration: 40 });
  assert.equal(document.querySelector('.ja-message-container').style.paddingTop, '24px');
  await within(instance.waitClose());
});

void test('Tabs tracks controlled activeKey and emits click changes', async () => {
  const changes = [];
  const props = rt.vm({
    activeKey: 'a',
    options: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Tabs, props);
  document.querySelectorAll('.ja-tab-item')[1].click();
  assert.deepEqual(changes, ['b']);
  props.activeKey = 'b';
  await flush();
  assert.equal(document.querySelector('.ja-tab-item.active').textContent, 'B');
});

void test('Table renders data/scoped slots and preserves keyed row identity after reordering', async () => {
  const props = rt.vm({
    rowKey: 'id',
    data: [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ],
    columns: [
      { key: 'name', title: 'Name', dataIndex: 'name', width: 100 },
      { key: 'custom', 'slot:title': ui.TitleSlot, 'slot:render': ui.CellSlot },
    ],
  });
  mount(ui.Table, props);
  const rows = [...document.querySelectorAll('tbody tr')];
  assert.equal(document.querySelector('th').style.width, '100px');
  assert.equal(document.querySelectorAll('th')[1].textContent, 'column 1');
  assert.equal(rows[0].querySelector('em').textContent, '0:Ada');
  props.data.reverse();
  await flush();
  assert.equal(document.querySelector('tbody tr'), rows[1]);
  assert.equal(document.querySelector('tbody em').textContent, '0:Grace');
});

void test('Tag renders its semantic color and child slot', () => {
  mount(ui.Tag, { color: 'success', className: 'status', 'slot:default': ui.BodySlot });
  assert.equal(document.querySelector('.ja-tag.success.status strong').textContent, 'slot body');
});

void test('Spin forwards size/class and renders four animated dots', () => {
  mount(ui.Spin, { size: 'lg', className: 'busy' });
  assert.equal(document.querySelectorAll('.ja-spin.lg.busy .ja-spin-dots > i').length, 4);
});

void test('LoadingOutlined forwards style/class and renders an SVG', () => {
  mount(ui.LoadingOutlined, { className: 'busy', style: 'color:red' });
  assert.equal(document.querySelector('.ja-loading.busy').style.color, 'red');
  assert.equal(document.querySelector('svg').getAttribute('viewBox'), '0 0 1024 1024');
});

for (const name of [
  'AntDesignLoadingOutlined',
  'AntDesignInfoCircleFilled',
  'AntDesignCheckCircleFilled',
  'AntDesignCloseCircleFilled',
  'AntDesignExclamationCircleFilled',
  'AntDesignCloseCircleOutlined',
  'AntDesignCloseOutlined',
])
  void test(`${name} renders its SVG path and custom class`, () => {
    mount(ui[name], { className: 'test-icon' });
    assert.equal(document.querySelector('svg.test-icon').getAttribute('viewBox'), '0 0 1024 1024');
    assert.ok(document.querySelector('svg path').getAttribute('d').length > 0);
  });

void test('Floating positioning flips above when there is no room below', () => {
  const trigger = { left: 100, right: 200, top: 160, bottom: 180, width: 100, height: 20 };
  const result = ui.calcPosition(
    trigger,
    { width: 80, height: 60 },
    { width: 400, height: 200 },
    ui.getPlacementOpt('bottom'),
    10,
  );
  assert.deepEqual(
    { x: result.x, y: result.y, placement: result.placement },
    { x: 110, y: 90, placement: 'top' },
  );
  assert.deepEqual(ui.getDelayOpt(40), { open: 40, close: 40 });
});

void test('Safe polygon helpers distinguish interior and exterior points', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(ui.isPointInPolygon(5, 5, points), true);
  assert.equal(ui.isPointInPolygon(15, 5, points), false);
  assert.equal(ui.isPointInPolygon2(5, 5, [points[0], points[2]]), true);
  assert.equal(ui.isPointInPolygon2(-1, 5, [points[0], points[2]]), false);
});

void test('Menu property-path keys preserve button identity when options reorder', async () => {
  const props = rt.vm({
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  });
  mount(ui.Menu, props);
  const first = document.querySelectorAll('.ja-menu-item')[0];
  const second = document.querySelectorAll('.ja-menu-item')[1];
  props.options.reverse();
  await flush();
  assert.equal(document.querySelectorAll('.ja-menu-item')[0], second);
  assert.equal(document.querySelectorAll('.ja-menu-item')[1], first);
});
