import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const options = () => [
  { value: 0, label: 'Day' },
  { value: 1, label: 'Unavailable', disabled: true },
  { value: 7, label: 'Week' },
];
void test('Segmented defaults to the first enabled option and exposes native radio semantics', () => {
  mount(ui.Segmented, { options: options(), ariaLabel: 'Range', name: 'range' });
  assert.equal(document.querySelector('[role=radiogroup]').getAttribute('aria-label'), 'Range');
  assert.equal(document.querySelector('input:checked').value, '0');
  assert.equal(document.querySelectorAll('input')[1].disabled, true);
  assert.equal(new Set([...document.querySelectorAll('input')].map((el) => el.name)).size, 1);
});
void test('Segmented supports default value, user changes, same-value suppression and stable custom labels', async () => {
  const changes = [];
  mount(ui.Segmented, {
    defaultValue: 7,
    options: [{ value: 0, 'slot:label': ui.BodySlot }, ...options().slice(1)],
    'on:change': (v) => changes.push(v),
  });
  assert.equal(document.querySelector('input:checked').value, '7');
  const first = document.querySelector('input');
  first.click();
  first.click();
  await flush();
  assert.deepEqual(changes, [0]);
  assert.ok(document.querySelector('[data-testid=body-slot]'));
});
void test('Segmented controlled requests restore native checked state when rejected and accept external writes', async () => {
  const changes = [];
  const props = rt.vm({ value: 0, options: options(), 'on:change': (v) => changes.push(v) });
  mount(ui.Segmented, props);
  document.querySelectorAll('input')[2].click();
  await flush();
  assert.equal(document.querySelector('input:checked').value, '0');
  assert.deepEqual(changes, [7]);
  props.value = 7;
  await flush();
  assert.equal(document.querySelector('input:checked').value, '7');
});
void test('Segmented handles empty options, dynamic fallback, global disabling and keyed identity', async () => {
  const props = rt.vm({ options: [], disabled: false });
  mount(ui.Segmented, props);
  props.options = options();
  await flush();
  assert.equal(document.querySelector('input:checked').value, '0');
  const first = document.querySelector('input');
  props.options.reverse();
  await flush();
  assert.equal(document.querySelectorAll('input')[2], first);
  props.options = props.options.slice(0, 2);
  await flush();
  assert.equal(document.querySelector('input:checked').value, '7');
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('fieldset').disabled, true);
});
void test('Segmented participates in native form serialization and resets to its initial value', async () => {
  const form = document.createElement('form');
  form.id = 'report';
  document.body.append(form);
  mount(ui.Segmented, { options: options(), name: 'range', form: 'report', defaultValue: 7 });
  document.querySelector('input').click();
  await flush();
  assert.equal(new window.FormData(form).get('range'), '0');
  form.reset();
  await flush();
  assert.equal(document.querySelector('input:checked').value, '7');
});
