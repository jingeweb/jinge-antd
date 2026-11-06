import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui, zod } from './harness.mjs';
const options = [
  { value: 0, label: 'Zero' },
  { value: 1, label: 'One', disabled: true },
  { value: 2, label: 'Two', group: 'Numbers' },
];
const key = (el, key) =>
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

void test('Select defaults preserve zero, native labels, public focus and selected display', () => {
  const view = mount(ui.Select, {
    defaultValue: 0,
    options,
    id: 'choice',
    name: 'choice',
    ariaLabel: 'Choice',
  });
  const trigger = document.querySelector('[role=combobox]');
  assert.equal(trigger.textContent, 'Zero');
  assert.equal(trigger.id, 'choice');
  view.host.focus();
  assert.equal(document.activeElement, trigger);
  view.host.blur();
  assert.equal(document.querySelector('input[type=hidden]').value, '0');
});
void test('Select opens a listbox and arrows skip disabled choices, select once and retain focus', async () => {
  const changes = [];
  mount(ui.Select, {
    options,
    defaultValue: 0,
    'on:change': (value, event) => changes.push([value, event.type]),
  });
  const trigger = document.querySelector('[role=combobox]');
  trigger.focus();
  key(trigger, 'ArrowDown');
  await flush();
  assert.ok(document.querySelector('[role=listbox]'));
  key(trigger, 'ArrowDown');
  await flush();
  const active = document.getElementById(trigger.getAttribute('aria-activedescendant'));
  assert.equal(active.textContent.trim(), 'Two');
  document
    .querySelector('[role=option][aria-label=One]')
    .dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
  await flush();
  assert.equal(trigger.getAttribute('aria-activedescendant'), active.id);
  const zero = document.querySelector('[role=option][aria-label=Zero]');
  zero.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
  await flush();
  assert.equal(trigger.getAttribute('aria-activedescendant'), zero.id);
  key(trigger, 'ArrowDown');
  key(trigger, 'Enter');
  await flush();
  assert.equal(trigger.textContent, 'Two');
  assert.deepEqual(changes, [[2, 'keydown']]);
  assert.equal(document.activeElement, trigger);
  assert.equal(document.querySelector('[role=listbox]'), null);
});
void test('Select controlled selection/clear requests leave owner authoritative and external undefined clears', async () => {
  const changes = [];
  const props = rt.vm({
    value: 0,
    options,
    allowClear: true,
    placeholder: 'Choose',
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Select, props);
  document.querySelector('[aria-label="清空选择"]').click();
  await flush();
  assert.deepEqual(changes, [undefined]);
  assert.equal(document.querySelector('[role=combobox]').textContent, 'Zero');
  props.value = undefined;
  await flush();
  assert.equal(document.querySelector('[role=combobox]').textContent, 'Choose');
});
void test('Select searchable queries filter groups and never change selected values until option commit', async () => {
  const changes = [],
    searches = [];
  mount(ui.Select, {
    options,
    showSearch: true,
    'on:change': (value) => changes.push(value),
    'on:search': (value) => searches.push(value),
  });
  input('tw', '[role=combobox]');
  await flush();
  assert.equal(document.querySelectorAll('[role=option]').length, 1);
  assert.equal(document.querySelector('[role=group]').getAttribute('aria-label'), 'Numbers');
  assert.deepEqual(changes, []);
  assert.deepEqual(searches, ['tw']);
  document.querySelector('[role=option]').click();
  await flush();
  assert.deepEqual(changes, [2]);
});
void test('Select multiple emits fresh typed arrays, remains open, clears and removes with Backspace', async () => {
  const changes = [];
  mount(ui.Select, {
    mode: 'multiple',
    defaultValue: [0],
    options,
    allowClear: true,
    'on:change': (value) => changes.push(value),
  });
  const trigger = document.querySelector('[role=combobox]');
  trigger.click();
  await flush();
  document.querySelectorAll('[role=option]')[2].click();
  await flush();
  assert.deepEqual(changes, [[0, 2]]);
  assert.ok(document.querySelector('[role=listbox]'));
  assert.equal(
    document.querySelector('[role=listbox]').getAttribute('aria-multiselectable'),
    'true',
  );
  key(trigger, 'Backspace');
  await flush();
  assert.deepEqual(changes, [[0, 2], [0]]);
  document.querySelector('[aria-label="清空选择"]').click();
  await flush();
  assert.deepEqual(changes, [[0, 2], [0], []]);
});
void test('Select loading/disabled prevent changes, expose status and custom empty content', async () => {
  const props = rt.vm({ options, loading: true, emptyText: 'No results' });
  mount(ui.Select, props);
  document.querySelector('[role=combobox]').click();
  await flush();
  assert.equal(document.querySelectorAll('[role=option]').length, 0);
  assert.ok(document.querySelector('[role=status]'));
  props.loading = false;
  props.options = [];
  await flush();
  assert.equal(document.querySelector('[role=status]').textContent, 'No results');
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('[role=listbox]'), null);
  assert.equal(document.querySelector('[role=combobox]').disabled, true);
});
void test('Select snapshots multiple defaults and native reset restores values without change', async () => {
  const form = document.createElement('form');
  form.id = 'select-reset';
  document.body.append(form);
  const changes = [];
  const props = rt.vm({
    mode: 'multiple',
    options,
    form: form.id,
    name: 'choices',
    defaultValue: [0],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Select, props);
  document.querySelector('[role=combobox]').click();
  await flush();
  document.querySelectorAll('[role=option]')[2].click();
  await flush();
  props.defaultValue.push(2);
  form.reset();
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('input[type=hidden]')].map((el) => el.value),
    ['0'],
  );
  assert.equal(changes.length, 1);
});
void test('Select updates labels when remote options resolve while preserving unknown values', async () => {
  const props = rt.vm({ value: 'remote', options: [] });
  mount(ui.Select, props);
  assert.equal(document.querySelector('[role=combobox]').textContent, 'remote');
  props.options = [
    {
      value: 'remote',
      label: 'Resolved',
    },
  ];
  await flush();
  assert.equal(document.querySelector('[role=combobox]').textContent, 'Resolved');
  document.querySelector('[role=combobox]').click();
  await flush();
  assert.equal(document.querySelector('[role=option]').textContent.trim(), 'Resolved');
});
void test('Select controlled open only follows owner, Escape/Tab request close without changing selection', async () => {
  const opens = [];
  const props = rt.vm({ options, open: false, 'on:openChange': (value) => opens.push(value) });
  mount(ui.Select, props);
  const trigger = document.querySelector('[role=combobox]');
  key(trigger, 'ArrowDown');
  await flush();
  assert.equal(document.querySelector('[role=listbox]'), null);
  props.open = true;
  await flush();
  key(trigger, 'Escape');
  await flush();
  assert.ok(document.querySelector('[role=listbox]'));
  assert.deepEqual(opens, [true, false]);
  props.open = false;
  await flush();
  assert.equal(document.querySelector('[role=listbox]'), null);
});
void test('Select search commits IME once and does not choose a suggestion on composition Enter', async () => {
  const searches = [],
    changes = [];
  mount(ui.Select, {
    showSearch: true,
    options: [{ value: 'zh', label: '中文' }],
    'on:search': (value) => searches.push(value),
    'on:change': (value) => changes.push(value),
  });
  const field = document.querySelector('[role=combobox]');
  field.dispatchEvent(new Event('compositionstart'));
  input('中', '[role=combobox]');
  key(field, 'Enter');
  field.dispatchEvent(new Event('compositionend'));
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.deepEqual(searches, ['中']);
  assert.deepEqual(changes, []);
});

void test('Select stable option and selection slots receive updated remote option data', async () => {
  const props = rt.vm({
    value: 'remote',
    options: [],
    'slot:option': ui.BodySlot,
    'slot:selection': ui.SelectLabelSlot,
  });
  mount(ui.Select, props);
  assert.equal(document.querySelector('[role=combobox] strong').textContent, 'remote');
  props.options = [{ value: 'remote', label: 'Resolved' }];
  await flush();
  assert.equal(document.querySelector('[role=combobox] strong').textContent, 'Resolved');
  document.querySelector('[role=combobox]').click();
  await flush();
  assert.equal(document.querySelector('[role=option]').textContent, 'slot body');
});

void test('Select binds Controller zero, numeric selection and external undefined as controlled empty', async () => {
  const form = ui.useForm(zod.z.object({ selection: zod.z.number().optional() }), {
    defaultValues: { selection: 0 },
  });
  mount(ui.SelectController, { control: form.control });
  const combo = document.querySelector('[role=combobox]');
  assert.equal(combo.textContent, 'Zero');
  combo.click();
  await flush();
  document.querySelectorAll('[role=option]')[1].click();
  await flush();
  assert.equal(form.formState.selection, 2);
  await form.setField('selection', undefined);
  await flush();
  assert.equal(combo.textContent, 'Choose');
});
void test('Select disconnects width observers and ignores queued measurements/reset after destruction', async () => {
  const previous = window.ResizeObserver;
  const observers = [];
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  };
  try {
    const form = document.createElement('form');
    form.id = 'select-cleanup';
    document.body.append(form);
    const view = mount(ui.Select, { options, form: form.id });
    assert.equal(observers.length, 1);
    form.reset();
    view.dispose();
    assert.equal(observers[0].disconnected, true);
    observers[0].callback([]);
    await flush();
    assert.equal(document.querySelector('[role=combobox]'), null);
  } finally {
    window.ResizeObserver = previous;
  }
});
void test('Select keyboard order follows grouped visual order for interleaved source groups', async () => {
  mount(ui.Select, {
    options: [
      { value: 'a', label: 'A', group: 'One' },
      { value: 'b', label: 'B', group: 'Two' },
      { value: 'c', label: 'C', group: 'One' },
    ],
  });
  const combo = document.querySelector('[role=combobox]');
  key(combo, 'ArrowDown');
  await flush();
  key(combo, 'ArrowDown');
  await flush();
  assert.equal(
    document.getElementById(combo.getAttribute('aria-activedescendant')).getAttribute('aria-label'),
    'C',
  );
});
