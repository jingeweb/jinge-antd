import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, sleep, ui } from './harness.mjs';

void test('Spin standalone exposes a named status, size and tip and can stop', async () => {
  const options = rt.vm({ spinning: true, tip: 'Reading', size: 'lg' });
  mount(ui.Spin, options);
  assert.equal(document.querySelector('[role="status"]').getAttribute('aria-label'), 'Reading');
  assert.equal(document.querySelector('.ja-spin-tip').textContent, 'Reading');
  assert.equal(document.querySelectorAll('.ja-spin i').length, 4);
  options.spinning = false;
  await flush();
  assert.equal(document.querySelector('[role="status"]'), null);
});

void test('Spin delay suppresses short operations and cancels a pending display when destroyed', async () => {
  const clear = window.clearTimeout.bind(window);
  let canceled = 0;
  window.clearTimeout = (id) => {
    if (id) canceled++;
    clear(id);
  };
  try {
    const options = rt.vm({ spinning: true, delay: 100 });
    const view = mount(ui.Spin, options);
    assert.equal(document.querySelector('[role="status"]'), null);
    options.spinning = false;
    await flush();
    assert.ok(canceled > 0);
    await sleep(120);
    assert.equal(document.querySelector('[role="status"]'), null);
    options.delay = 2000;
    options.spinning = true;
    await flush();
    const before = canceled;
    view.dispose();
    assert.ok(canceled > before);
    assert.equal(document.querySelector('.ja-spin'), null);
  } finally {
    window.clearTimeout = clear;
  }
});

void test('Spin preserves content and blocks it from the start of a delayed operation', async () => {
  const options = rt.vm({ spinning: false, delay: 100, 'slot:default': ui.FocusContentSlot });
  mount(ui.Spin, options);
  const input = document.querySelector('input');
  input.value = 'Retained';
  options.spinning = true;
  await flush();
  assert.equal(document.querySelector('.ja-spin').getAttribute('aria-busy'), 'true');
  assert.equal(document.querySelector('.ja-spin-content').hasAttribute('inert'), true);
  assert.equal(document.querySelector('[role="status"]'), null);
  await sleep(110);
  assert.ok(document.querySelector('[role="status"]'));
  options.spinning = false;
  await flush();
  assert.equal(document.querySelector('.ja-spin-content').hasAttribute('inert'), false);
  assert.equal(document.querySelector('input'), input);
  assert.equal(input.value, 'Retained');
});

void test('Spin supports custom indicator and tip slots and reacts to pending delay changes', async () => {
  const options = rt.vm({
    delay: 100,
    'slot:indicator': ui.IconSlot,
    'slot:tip': ui.ContentSlot,
    ariaLabel: 'Fetching',
  });
  mount(ui.Spin, options);
  options.delay = 0;
  await flush();
  assert.ok(document.querySelector('.ja-spin-indicator [data-testid="icon-slot"]'));
  assert.equal(document.querySelector('.ja-spin-tip').textContent, 'custom content');
  assert.equal(document.querySelector('[role="status"]').getAttribute('aria-label'), 'Fetching');
});
