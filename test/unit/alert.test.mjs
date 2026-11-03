import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Alert renders semantic status, message and description and reacts to severity', async () => {
  const options = rt.vm({ title: 'Saved', description: 'All changes saved', type: 'success' });
  mount(ui.Alert, options);
  assert.equal(document.querySelector('.ja-alert').getAttribute('role'), 'status');
  assert.equal(document.querySelector('.ja-alert-title').textContent, 'Saved');
  assert.equal(document.querySelector('.ja-alert-description').textContent, 'All changes saved');
  assert.ok(document.querySelector('.ja-alert-icon svg'));
  options.type = 'error';
  await flush();
  assert.equal(document.querySelector('.ja-alert').getAttribute('role'), 'alert');
  assert.ok(document.querySelector('.ja-alert.error'));
});

void test('Alert slots override text and icons/actions can be configured independently', async () => {
  const options = rt.vm({
    title: 'Text',
    'slot:title': ui.ContentSlot,
    'slot:description': ui.BodySlot,
    'slot:icon': ui.IconSlot,
    'slot:action': ui.TriggerSlot,
    banner: true,
    showIcon: true,
  });
  mount(ui.Alert, options);
  assert.equal(document.querySelector('.ja-alert-title').textContent, 'custom content');
  assert.ok(document.querySelector('.ja-alert-description strong'));
  assert.ok(document.querySelector('.ja-alert-icon [data-testid="icon-slot"]'));
  assert.ok(document.querySelector('.ja-alert-action button'));
  assert.ok(document.querySelector('.ja-alert.banner'));
  options.showIcon = false;
  await flush();
  assert.equal(document.querySelector('.ja-alert-icon'), null);
});

void test('Alert uncontrolled close is idempotent, stops bubbling and notifies visibility', async () => {
  const calls = [];
  mount(ui.Alert, {
    title: 'Notice',
    closable: true,
    'on:close': () => calls.push('close'),
    'on:visibleChange': (v) => calls.push(v),
  });
  const button = document.querySelector('button[aria-label="关闭提示"]');
  let bubbled = 0;
  const listen = () => bubbled++;
  document.body.addEventListener('click', listen);
  try {
    button.click();
    button.click();
    await flush();
  } finally {
    document.body.removeEventListener('click', listen);
  }
  assert.deepEqual(calls, ['close', false]);
  assert.equal(bubbled, 0);
  assert.equal(document.querySelector('.ja-alert'), null);
});

void test('Alert controlled visibility and preventDefault retain the notice until its owner hides it', async () => {
  const calls = [];
  const options = rt.vm({
    title: 'Notice',
    closable: true,
    visible: true,
    role: 'none',
    'on:close': (event) => event.preventDefault(),
    'on:visibleChange': (v) => calls.push(v),
  });
  mount(ui.Alert, options);
  document.querySelector('.ja-alert-close').click();
  assert.deepEqual(calls, []);
  options['on:close'] = undefined;
  document.querySelector('.ja-alert-close').click();
  await flush();
  assert.deepEqual(calls, [false]);
  assert.equal(document.querySelector('.ja-alert').getAttribute('role'), null);
  options.visible = false;
  await flush();
  assert.equal(document.querySelector('.ja-alert'), null);
  options.visible = true;
  await flush();
  assert.ok(document.querySelector('.ja-alert'));
});
