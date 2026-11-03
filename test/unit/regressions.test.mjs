import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, zod, mount, input, flush, sleep, endTransition, within } from './harness.mjs';

// Assert the desired contract, not the buggy output. These tests must remain red until fixed.
void test('R01 Message.clear closes every message, invokes callbacks, and settles waiters', async () => {
  const closed = [];
  const instances = ['a', 'b'].map((content) =>
    ui.message.info({
      content,
      duration: 0,
      'on:close': () => closed.push(content),
    }),
  );
  await flush();
  ui.message.clear();
  assert.deepEqual(closed, ['a', 'b']);
  await within(Promise.all(instances.map((instance) => instance.waitClose())));
});

void test('R03 Tabs accepts an empty options array without throwing', () => {
  assert.doesNotThrow(() => mount(ui.Tabs, { options: [] }));
  assert.equal(document.querySelectorAll('.ja-tab-item').length, 0);
});

void test('R04 Button stays disabled when loading is explicitly false', () => {
  let clicks = 0;
  mount(ui.Button, { loading: false, disabled: true, 'on:click': () => clicks++ });
  const button = document.querySelector('button');
  assert.equal(button.disabled, true);
  button.click();
  assert.equal(clicks, 0);
});

void test('R05 Form field validation preserves object refinements', async () => {
  const schema = zod.z
    .object({ password: zod.z.string(), confirm: zod.z.string() })
    .refine((value) => value.password === value.confirm, {
      path: ['confirm'],
      message: 'Passwords differ',
    });
  const form = ui.useForm(schema, { defaultValues: { password: 'one', confirm: 'two' } });
  assert.equal(await form.validateField('confirm'), 'Passwords differ');
  await form.setField('confirm', 'one');
  assert.equal(await form.validateField('confirm'), undefined);
});

void test('R06 An old async field validation cannot overwrite the latest successful result', async () => {
  // Real Zod async refinement, with deterministic completion order instead of timing guesses.
  const resolvers = new Map();
  const schema = zod.z.object({
    name: zod.z
      .string()
      .refine((value) => new Promise((resolve) => resolvers.set(value, resolve)), 'Invalid name'),
  });
  const form = ui.useForm(schema, { defaultValues: { name: 'old' } });
  const old = form.validateField('name');
  await form.setField('name', 'new');
  const latest = form.validateField('name');
  resolvers.get('new')(true);
  await latest;
  resolvers.get('old')(false);
  await old;
  assert.equal(form.formErrors.name, undefined);
});

void test('R07 Floating cancels delayed callbacks when unmounted', async () => {
  const changes = [];
  const view = mount(ui.Floating, {
    open: false,
    zIndex: 1,
    delay: 40,
    'slot:trigger': ui.TriggerSlot,
    'slot:default': ui.BodySlot,
    'on:openChange': (value) => changes.push(value),
  });
  document.querySelector('button').click();
  view.dispose();
  await sleep(80);
  assert.deepEqual(changes, []);
});

void test('R08 Floating cancels a pending hover open when the pointer leaves', async () => {
  const changes = [];
  mount(ui.Floating, {
    open: false,
    zIndex: 1,
    triggerMethod: 'hover',
    delay: 40,
    'slot:trigger': ui.TriggerSlot,
    'slot:default': ui.BodySlot,
    'on:openChange': (value) => changes.push(value),
  });
  const trigger = document.querySelector('button');
  trigger.dispatchEvent(new MouseEvent('mouseenter'));
  trigger.dispatchEvent(new MouseEvent('mouseleave'));
  await sleep(80);
  assert.deepEqual(changes, []);
});

void test('R09 Select restores the placeholder after its controlled value is cleared', async () => {
  const props = rt.vm({ value: 'a', placeholder: 'Choose', options: [{ value: 'a', label: 'A' }] });
  mount(ui.Select, props);
  assert.equal(document.querySelector('.ja-select').textContent, 'A');
  props.value = undefined;
  await flush();
  assert.equal(document.querySelector('.ja-select').textContent, 'Choose');
});

void test('R10 Controller rebinds reading, writing, and blur validation to the new field name', async () => {
  const form = ui.useForm(zod.z.object({ first: zod.z.string(), second: zod.z.string() }), {
    defaultValues: { first: 'First', second: 'Second' },
  });
  const props = rt.vm({ name: 'first', control: form.control });
  mount(ui.ControllerField, props);
  assert.equal(document.querySelector('input').value, 'First');
  props.name = 'second';
  await flush();
  assert.equal(document.querySelector('input').value, 'Second');
  input('updated');
  assert.equal(form.formState.second, 'updated');
  assert.equal(form.formState.first, 'First');
});

void test('R11 Closing a message twice in the same turn invokes on:close only once', async () => {
  let count = 0;
  const instance = ui.message.info({ content: 'One', duration: 0, 'on:close': () => count++ });
  await flush();
  instance.close();
  instance.close();
  assert.equal(count, 1);
  await within(instance.waitClose());
});

void test('R12 Clearing InputNumber emits an empty value rather than zero', async () => {
  const changes = [];
  mount(ui.InputNumber, { value: 12, 'on:change': (value) => changes.push(value) });
  input('');
  await flush();
  // Establish the empty-value contract as undefined; updating this also requires widening the API type.
  assert.deepEqual(changes, [undefined]);
  assert.equal(document.querySelector('input').value, '');
});

void test('R14 Message renders slot:content', async () => {
  const instance = ui.message.info({ 'slot:content': ui.ContentSlot, duration: 0 });
  try {
    await flush();
    assert.equal(
      document.querySelector('[data-testid="content-slot"]')?.textContent,
      'custom content',
    );
  } finally {
    instance.close();
  }
});

void test('R15 Modal respects footer=false and a custom footer slot', async () => {
  const hidden = mount(ui.Modal, { footer: false, 'slot:default': ui.BodySlot });
  await flush();
  const hiddenCount = document.querySelectorAll('.ja-modal-footer').length;
  hidden.dispose();
  mount(ui.Modal, { 'slot:default': ui.BodySlot, 'slot:footer': ui.FooterSlot });
  await flush();
  assert.deepEqual(
    {
      hiddenCount,
      customFooter: document.querySelector('[data-testid="footer-slot"]')?.textContent,
    },
    { hiddenCount: 0, customFooter: 'custom footer' },
  );
});

void test('R16 modal.waitForClose retains the result after closing has completed', async () => {
  const instance = ui.modal.show({ title: 'Dialog', content: 'Body' });
  const waiting = instance.waitForClose();
  await flush();
  instance.close('accepted');
  await flush();
  endTransition('.ja-modal');
  assert.equal(await within(waiting), 'accepted');
  assert.equal(await instance.waitForClose(), 'accepted');
});

void test('R17 Select forwards its current value to the dropdown selection', async () => {
  mount(ui.Select, {
    value: 'b',
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  });
  document.querySelector('.ja-select').click();
  await flush();
  await flush();
  assert.equal(document.querySelector('.ja-menu-item.ja-active')?.textContent.trim(), 'B');
});

void test('R19 A synchronous confirm error after an async listener always clears submitting', async () => {
  let ctx;
  const failure = new Error('Synchronous validation failed');
  mount(ui.ConfirmProbe, {
    listener: () => {
      throw failure;
    },
    capture: (value) => {
      ctx = value;
    },
  });
  const submitting = [];
  const submitted = [];
  let thrown;
  await ctx
    .handleConfirm({
      onSubmittingChange: (value) => submitting.push(value),
      onSubmitted: (preventClose) => submitted.push(preventClose),
    })
    .catch((error) => {
      thrown = error;
    });
  assert.deepEqual(submitting, [true, false]);
  assert.deepEqual(submitted, [true]);
  assert.equal(thrown, undefined);
});
