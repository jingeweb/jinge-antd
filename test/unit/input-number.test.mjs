import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui } from './harness.mjs';

void test('InputNumber supports defaults, empty undefined, attributes and public focus/blur', async () => {
  const changes = [];
  const view = mount(ui.InputNumber, {
    defaultValue: 1.5,
    name: 'amount',
    id: 'amount',
    required: true,
    ariaLabel: 'Amount',
    ariaDescribedby: 'help',
    status: 'error',
    'on:change': (value) => changes.push(value),
  });
  const field = document.querySelector('input');
  assert.equal(field.value, '1.5');
  assert.equal(field.name, 'amount');
  assert.equal(field.required, true);
  assert.equal(field.getAttribute('aria-label'), 'Amount');
  assert.equal(field.getAttribute('aria-invalid'), 'true');
  view.host.focus();
  assert.equal(document.activeElement, field);
  input('');
  await flush();
  assert.deepEqual(changes, [undefined]);
  view.host.blur();
  assert.equal(field.value, '');
});

void test('InputNumber preserves numeric drafts and normalizes precision/bounds on commit once', async () => {
  const changes = [];
  mount(ui.InputNumber, {
    defaultValue: 1,
    min: 0,
    max: 10,
    precision: 2,
    'on:change': (value) => changes.push(value),
  });
  const field = document.querySelector('input');
  field.focus();
  input('1.005');
  assert.equal(field.value, '1.005');
  assert.deepEqual(changes, [1.005]);
  field.blur();
  await flush();
  assert.equal(field.value, '1.01');
  assert.deepEqual(changes, [1.005, 1.01]);
  field.focus();
  input('20');
  field.blur();
  await flush();
  assert.equal(field.value, '10');
  assert.deepEqual(changes, [1.005, 1.01, 20, 10]);
  field.focus();
  field.blur();
  assert.equal(changes.length, 4);
});

void test('InputNumber decimal arrows and buttons avoid binary noise and respect bounds/keyboard', async () => {
  const changes = [];
  const options = rt.vm({
    defaultValue: 0.1,
    step: 0.1,
    min: 0,
    max: 0.3,
    'on:change': (value) => changes.push(value),
  });
  mount(ui.InputNumber, options);
  const field = document.querySelector('input');
  const arrow = () =>
    field.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    );
  arrow();
  await flush();
  arrow();
  await flush();
  arrow();
  await flush();
  assert.equal(field.value, '0.3');
  assert.deepEqual(changes, [0.2, 0.3]);
  assert.equal(document.querySelector('[aria-label="增加数值"]').disabled, true);
  document.querySelector('[aria-label="减少数值"]').click();
  await flush();
  assert.equal(field.value, '0.2');
  options.keyboard = false;
  await flush();
  arrow();
  assert.equal(field.value, '0.2');
  options.readOnly = true;
  await flush();
  document.querySelector('[aria-label="减少数值"]').click();
  input('5');
  await flush();
  assert.equal(field.value, '0.2');
});

void test('InputNumber controlled drafts revert at commit and external value/range changes never emit', async () => {
  const changes = [];
  const options = rt.vm({ value: 4, min: 0, max: 10, 'on:change': (value) => changes.push(value) });
  mount(ui.InputNumber, options);
  const field = document.querySelector('input');
  field.focus();
  input('8');
  await flush();
  assert.equal(field.value, '8');
  field.blur();
  await flush();
  assert.equal(field.value, '4');
  options.value = 20;
  options.max = 5;
  await flush();
  assert.equal(field.value, '20');
  assert.deepEqual(changes, [8]);
});

void test('InputNumber null starts controlled empty, Enter commits and disabled input cannot change', async () => {
  const changes = [],
    entered = [];
  const options = rt.vm({
    value: null,
    precision: 1,
    'on:change': (value) => {
      changes.push(value);
      options.value = value;
    },
    'on:pressEnter': () => entered.push(true),
  });
  mount(ui.InputNumber, options);
  const field = document.querySelector('input');
  input('2.34');
  field.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await flush();
  assert.equal(field.value, '2.3');
  assert.deepEqual(changes, [2.34, 2.3]);
  assert.deepEqual(entered, [true]);
  options.disabled = true;
  await flush();
  input('9');
  await flush();
  assert.equal(field.value, '2.3');
});

void test('InputNumber native reset restores initial default without emitting and cleans reset tasks', async () => {
  const form = document.createElement('form');
  form.id = 'number-form';
  document.body.append(form);
  const changes = [];
  const options = rt.vm({
    defaultValue: 3,
    form: 'number-form',
    'on:change': (value) => changes.push(value),
  });
  const view = mount(ui.InputNumber, options);
  input('9');
  options.defaultValue = 99;
  await flush();
  form.reset();
  await flush();
  assert.equal(document.querySelector('input').value, '3');
  assert.deepEqual(changes, [9]);
  form.reset();
  view.dispose();
  await flush();
  assert.equal(document.querySelector('input'), null);
});
