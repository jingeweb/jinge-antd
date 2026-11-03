import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Password masks by default and visibility toggling preserves value without emitting change', async () => {
  const changes = [];
  mount(ui.Password, {
    defaultValue: 'Example123',
    autoComplete: 'current-password',
    'on:change': (value) => changes.push(value),
  });
  const field = document.querySelector('input');
  assert.equal(field.type, 'password');
  assert.equal(field.autocomplete, 'current-password');
  field.focus();
  field.setSelectionRange(2, 5);
  document.querySelector('[aria-label="显示密码"]').click();
  await flush();
  assert.equal(document.querySelector('input'), field);
  assert.equal(field.type, 'text');
  assert.equal(field.value, 'Example123');
  assert.equal(field.selectionStart, 2);
  assert.equal(field.selectionEnd, 5);
  assert.deepEqual(changes, []);
  assert.equal(
    document.querySelector('[aria-label="隐藏密码"]').getAttribute('aria-pressed'),
    'true',
  );
});

void test('Password controlled visibility requests wait for the owner', async () => {
  const requests = [];
  const options = rt.vm({
    visible: false,
    value: 'Secret',
    'on:visibleChange': (visible) => requests.push(visible),
  });
  mount(ui.Password, options);
  document.querySelector('.ja-input-visibility').click();
  await flush();
  assert.deepEqual(requests, [true]);
  assert.equal(document.querySelector('input').type, 'password');
  options.visible = true;
  await flush();
  assert.equal(document.querySelector('input').type, 'text');
});

void test('Password visibility can be disabled or omitted and its exposed handle focuses the input', async () => {
  const options = rt.vm({ disabled: true });
  const view = mount(ui.Password, options);
  assert.equal(document.querySelector('.ja-input-visibility').disabled, true);
  options.disabled = false;
  options.visibilityToggle = false;
  await flush();
  assert.equal(document.querySelector('.ja-input-visibility'), null);
  view.host.focus();
  assert.equal(document.activeElement, document.querySelector('input'));
});
