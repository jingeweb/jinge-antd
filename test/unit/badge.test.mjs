import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, rt, ui, flush } from './harness.mjs';

void test('Badge handles zero, overflow, text counts and live count updates', async () => {
  const options = rt.vm({ count: 0 });
  mount(ui.Badge, options);
  assert.equal(document.querySelector('.ja-badge-indicator'), null);
  options.count = 120;
  await flush();
  const indicator = document.querySelector('.ja-badge-indicator');
  assert.equal(indicator.textContent, '99+');
  assert.equal(indicator.getAttribute('aria-label'), '120 条');
  assert.equal(indicator.title, '120');
  options.count = 'NEW';
  await flush();
  assert.equal(indicator.textContent, 'NEW');
});

void test('Badge supports dot/status/zero semantics and standalone rendering', async () => {
  const options = rt.vm({ count: 0, showZero: true, dot: false });
  mount(ui.Badge, options);
  assert.equal(document.querySelector('.ja-badge-indicator').textContent, '0');
  options.dot = true;
  await flush();
  assert.ok(document.querySelector('.ja-badge-indicator.dot'));
  assert.equal(document.querySelector('.ja-badge-indicator').textContent, '');
  mount(ui.Badge, { status: 'success', text: 'Online' });
  assert.ok(document.querySelector('.ja-badge-status-text'));
  assert.equal(document.querySelector('.ja-badge-status-text').textContent, 'Online');
});

void test('Badge keeps child identity across updates and supports custom colors and offsets', async () => {
  const options = rt.vm({
    count: 2,
    'slot:default': ui.TriggerSlot,
    offset: [4, 6],
    color: '#123456',
  });
  mount(ui.Badge, options);
  const trigger = document.querySelector('button');
  options.count = 3;
  await flush();
  assert.equal(document.querySelector('button'), trigger);
  assert.ok(document.querySelector('.ja-badge.with-child'));
  const style = document.querySelector('.ja-badge-indicator').style;
  assert.equal(style.right, '-4px');
  assert.equal(style.top, '6px');
  assert.equal(style.getPropertyValue('--ja-badge-color'), '#123456');
});
