import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Radio uses native mutual exclusion and publishes boolean changes with labels and focus', async () => {
  const changes = [];
  mount(ui.Radio, { name: 'single', value: 'a', defaultChecked: true, label: 'Alpha' });
  const second = mount(ui.Radio, {
    name: 'single',
    value: 'b',
    label: 'Beta',
    'on:change': (value, event) => changes.push([value, event.type]),
  });
  second.host.focus();
  assert.equal(document.activeElement, document.querySelectorAll('input')[1]);
  document.querySelectorAll('input')[1].click();
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('input')].map((el) => el.checked),
    [false, true],
  );
  assert.deepEqual(changes, [[true, 'change']]);
});
void test('RadioGroup preserves numeric zero, names, required and rejects controlled selection across all radios', async () => {
  const changes = [];
  const props = rt.vm({
    value: 0,
    name: 'plan',
    required: true,
    options: [
      { value: 0, label: 'Zero' },
      { value: 1, label: 'One' },
    ],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.RadioGroup, props);
  const inputs = document.querySelectorAll('input');
  assert.equal(inputs[0].checked, true);
  assert.equal(inputs[0].required, true);
  assert.equal(inputs[0].name, 'plan');
  inputs[1].click();
  await flush();
  assert.deepEqual(
    [...inputs].map((el) => el.checked),
    [true, false],
  );
  assert.deepEqual(changes, [1]);
  props.value = 1;
  await flush();
  assert.deepEqual(
    [...inputs].map((el) => el.checked),
    [false, true],
  );
});
void test('RadioGroup supports defaults, disabled options, reorder identity and empty options', async () => {
  const props = rt.vm({
    defaultValue: 'a',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta', disabled: true },
    ],
  });
  mount(ui.RadioGroup, props);
  const first = document.querySelector('input');
  assert.ok(first.name);
  document.querySelectorAll('input')[1].click();
  await flush();
  assert.equal(first.checked, true);
  props.options.reverse();
  await flush();
  assert.equal(document.querySelectorAll('input')[1], first);
  props.options = [];
  await flush();
  assert.equal(document.querySelector('input'), null);
  props.options = [{ value: 'c', label: 'Gamma' }];
  await flush();
  assert.equal(document.querySelector('input').checked, false);
});
void test('RadioGroup reset restores default selection without change and distinct unnamed groups stay isolated', async () => {
  const form = document.createElement('form');
  form.id = 'radios';
  document.body.append(form);
  const changes = [];
  mount(ui.RadioGroup, {
    form: 'radios',
    defaultValue: 'a',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.RadioGroup, { options: [{ value: 'a', label: 'Other' }], defaultValue: 'a' });
  const inputs = document.querySelectorAll('input');
  assert.notEqual(inputs[0].name, inputs[2].name);
  inputs[1].click();
  await flush();
  assert.equal(inputs[2].checked, true);
  form.reset();
  await flush();
  assert.deepEqual(
    [...inputs].map((el) => el.checked),
    [true, false, true],
  );
  assert.deepEqual(changes, ['b']);
});
void test('RadioGroup button variant uses labels and label slots, null is controlled empty', async () => {
  const props = rt.vm({
    value: null,
    variant: 'button',
    disabled: false,
    options: [{ value: 'a', 'slot:label': ui.BodySlot }],
  });
  mount(ui.RadioGroup, props);
  assert.equal(document.querySelector('label').textContent, 'slot body');
  document.querySelector('input').click();
  await flush();
  assert.equal(document.querySelector('input').checked, false);
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('input').disabled, true);
  assert.ok(document.querySelector('.ja-radio.button'));
});
