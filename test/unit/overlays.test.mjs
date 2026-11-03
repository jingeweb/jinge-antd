import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, mount, flush } from './harness.mjs';
const slots = () => ({ 'slot:default': ui.TriggerSlot });

void test('Tooltip default focus trigger establishes a description and dismisses on Escape', async () => {
  mount(ui.Tooltip, { content: 'Help', ...slots() });
  const trigger = document.querySelector('button');
  trigger.focus();
  await flush();
  const tooltip = document.querySelector('[role=tooltip]');
  assert.equal(tooltip.textContent, 'Help');
  assert.equal(trigger.getAttribute('aria-describedby'), tooltip.id);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.querySelector('.ja-tooltip'), null);
});
void test('Tooltip uses a content slot and does not open while disabled', async () => {
  const options = rt.vm({ disabled: true, 'slot:content': ui.ContentSlot, ...slots() });
  mount(ui.Tooltip, options);
  const trigger = document.querySelector('button');
  trigger.focus();
  await flush();
  assert.equal(document.querySelector('.ja-tooltip'), null);
  trigger.blur();
  options.disabled = false;
  await flush();
  trigger.focus();
  await flush();
  assert.ok(document.querySelector('.ja-tooltip [data-testid=content-slot]'));
});
void test('Popover forwards controlled open requests without duplicating local state', async () => {
  const values = [];
  const options = rt.vm({
    open: false,
    content: 'Body',
    'on:openChange': (value) => values.push(value),
    ...slots(),
  });
  mount(ui.Popover, options);
  document.querySelector('button').click();
  await flush();
  assert.deepEqual(values, [true]);
  assert.equal(document.querySelector('.ja-popover'), null);
  options.open = true;
  await flush();
  assert.equal(document.querySelector('.ja-popover').textContent, 'Body');
});
void test('Popconfirm renders only the preferred content slot and forwards a cancellation', async () => {
  let cancelled = 0;
  mount(ui.Popconfirm, {
    title: 'Proceed?',
    content: 'fallback',
    'slot:content': ui.ContentSlot,
    'on:cancel': () => cancelled++,
    ...slots(),
  });
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelectorAll('.ja-popconfirm-content').length, 1);
  assert.equal(document.querySelector('.ja-popconfirm-content').textContent, 'custom content');
  document.querySelector('.ja-popconfirm-footer button').click();
  await flush();
  assert.equal(cancelled, 1);
  assert.equal(document.querySelector('.ja-popconfirm'), null);
});
void test('Popconfirm prevents duplicate async submits and stays open when confirmation returns false', async () => {
  let finish,
    calls = 0;
  mount(ui.Popconfirm, {
    title: 'Proceed?',
    'on:confirm': () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    ...slots(),
  });
  document.querySelector('button').click();
  await flush();
  const confirm = document.querySelector('.ja-popconfirm-footer button.primary');
  confirm.click();
  confirm.click();
  assert.equal(calls, 1);
  await flush();
  assert.equal(confirm.disabled, true);
  finish(false);
  await flush();
  assert.ok(document.querySelector('.ja-popconfirm'));
  assert.equal(confirm.disabled, false);
});
void test('Popconfirm catches synchronous errors, clears loading, and reports the error', async () => {
  const errors = [],
    error = new Error('Failed');
  mount(ui.Popconfirm, {
    title: 'Proceed?',
    'on:confirm': () => {
      throw error;
    },
    'on:error': (value) => errors.push(value),
    ...slots(),
  });
  document.querySelector('button').click();
  await flush();
  document.querySelector('.ja-popconfirm-footer button.primary').click();
  await flush();
  assert.deepEqual(errors, [error]);
  assert.equal(document.querySelector('.ja-popconfirm-footer button.primary').disabled, false);
});
void test('Confirm context ignores late completion callbacks after its owner is destroyed', async () => {
  let finish, ctx;
  const changes = [];
  const view = mount(ui.ConfirmProbe, {
    listener: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    capture: (value) => {
      ctx = value;
    },
  });
  const pending = ctx.handleConfirm({
    onSubmittingChange: (value) => changes.push(value),
    onSubmitted: () => changes.push('submitted'),
  });
  await Promise.resolve();
  view.dispose();
  finish();
  await pending;
  assert.deepEqual(changes, [true]);
});

void test('Confirm listeners registered during a pending transaction are deferred to the next one', async () => {
  let finish,
    ctx,
    lateCalls = 0;
  mount(ui.ConfirmProbe, {
    listener: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    capture: (value) => {
      ctx = value;
    },
  });
  const pending = ctx.handleConfirm({ onSubmittingChange() {}, onSubmitted() {} });
  await Promise.resolve();
  ctx.onConfirmFns.add(() => {
    lateCalls++;
  });
  finish();
  await pending;
  assert.equal(lateCalls, 0);
});
