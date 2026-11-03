import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui } from './harness.mjs';

void test('Input forwards form/ARIA attributes, exposes focus/select and initializes a default value', () => {
  const view = mount(ui.Input, {
    defaultValue: 'Ada',
    id: 'customer',
    name: 'customer',
    required: true,
    readOnly: true,
    maxLength: 12,
    minLength: 2,
    autoComplete: 'name',
    ariaLabel: 'Customer',
    ariaDescribedby: 'help',
    status: 'error',
  });
  const element = document.querySelector('input');
  assert.equal(element.value, 'Ada');
  assert.equal(element.id, 'customer');
  assert.equal(element.name, 'customer');
  assert.equal(element.readOnly, true);
  assert.equal(element.required, true);
  assert.equal(element.autocomplete, 'name');
  assert.equal(element.maxLength, 12);
  assert.equal(element.getAttribute('aria-label'), 'Customer');
  assert.equal(element.getAttribute('aria-invalid'), 'true');
  assert.equal(element.getAttribute('aria-describedby'), 'help');
  view.host.focus();
  assert.equal(document.activeElement, element);
  view.host.select();
  assert.equal(element.selectionEnd - element.selectionStart, 3);
});

void test('Input uncontrolled edits ignore later defaultValue changes and controlled edits wait for acceptance', async () => {
  const options = rt.vm({ defaultValue: 'Initial' });
  const first = mount(ui.Input, options);
  input('Edited');
  options.defaultValue = 'Ignored';
  await flush();
  assert.equal(document.querySelector('input').value, 'Edited');
  first.dispose();
  const controlled = rt.vm({ value: 'Owner' });
  mount(ui.Input, controlled);
  input('Rejected');
  await flush();
  assert.equal(document.querySelector('input').value, 'Owner');
  controlled['on:change'] = (value) => {
    controlled.value = value;
  };
  input('Accepted');
  await flush();
  assert.equal(document.querySelector('input').value, 'Accepted');
});

void test('Input defers IME changes, ignores composition Enter and deduplicates the trailing input', async () => {
  const changes = [],
    entered = [];
  mount(ui.Input, {
    'on:change': (value) => changes.push(value),
    'on:pressEnter': () => entered.push(true),
  });
  const element = document.querySelector('input');
  element.dispatchEvent(new Event('compositionstart'));
  input('中');
  element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.deepEqual(changes, []);
  assert.deepEqual(entered, []);
  element.dispatchEvent(new Event('compositionend'));
  element.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.deepEqual(changes, ['中']);
  element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.deepEqual(entered, [true]);
});

void test('Input affixes, counters and clear preserve the native node and focus', async () => {
  const changes = [];
  const options = rt.vm({
    defaultValue: '🙂',
    prefix: '$',
    suffix: 'USD',
    allowClear: true,
    showCount: true,
    maxLength: 10,
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Input, options);
  const element = document.querySelector('input');
  element.focus();
  assert.equal(document.querySelector('.ja-input-count').textContent, '2 / 10');
  options.prefix = '€';
  options.suffix = 'EUR';
  await flush();
  assert.equal(document.querySelector('input'), element);
  assert.equal(document.activeElement, element);
  document.querySelector('button[aria-label="清空输入"]').click();
  await flush();
  assert.equal(element.value, '');
  assert.deepEqual(changes, ['']);
  assert.equal(document.activeElement, element);
  assert.equal(document.querySelector('.ja-input-count').textContent, '0 / 10');
});

void test('Input disabled and readOnly prevent synthetic edits and hide clearing controls', async () => {
  const changes = [];
  const options = rt.vm({
    defaultValue: 'Protected',
    allowClear: true,
    disabled: true,
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Input, options);
  input('Unexpected');
  await flush();
  assert.equal(document.querySelector('input').value, 'Protected');
  assert.equal(document.querySelector('.ja-input-clear'), null);
  options.disabled = false;
  options.readOnly = true;
  await flush();
  input('Unexpected again');
  await flush();
  assert.deepEqual(changes, []);
  assert.equal(document.querySelector('input').value, 'Protected');
});

void test('Input prefix/suffix slots and clear event use actual native events', async () => {
  const clears = [];
  mount(ui.Input, {
    defaultValue: 'Value',
    allowClear: true,
    'slot:prefix': ui.IconSlot,
    'slot:suffix': ui.ContentSlot,
    'on:clear': (event) => clears.push(event.type),
  });
  assert.ok(document.querySelector('.ja-input-prefix [data-testid="icon-slot"]'));
  assert.equal(document.querySelector('.ja-input-suffix').textContent, 'custom content');
  document.querySelector('.ja-input-clear').click();
  await flush();
  assert.deepEqual(clears, ['click']);
});

void test('Input composition deduplication survives a controlled owner transforming the committed text', async () => {
  const changes = [];
  const options = rt.vm({
    value: '',
    'on:change': (value) => {
      changes.push(value);
      options.value = `${value}!`;
    },
  });
  mount(ui.Input, options);
  const field = document.querySelector('input');
  field.dispatchEvent(new Event('compositionstart'));
  input('中');
  field.dispatchEvent(new Event('compositionend'));
  await flush();
  assert.equal(field.value, '中!');
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.deepEqual(changes, ['中']);
  assert.equal(field.value, '中!');
});
