import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui, zod } from './harness.mjs';

void test('Checkbox uses a native labelled input, default state, form attributes and focus handle', () => {
  const view = mount(ui.Checkbox, {
    defaultChecked: true,
    name: 'terms',
    value: 'yes',
    required: true,
    id: 'terms',
    label: 'Agree',
  });
  const input = document.querySelector('input');
  assert.equal(input.type, 'checkbox');
  assert.equal(input.checked, true);
  assert.equal(input.name, 'terms');
  assert.equal(input.value, 'yes');
  assert.equal(input.required, true);
  assert.equal(input.labels[0].textContent, 'Agree');
  view.host.focus();
  assert.equal(document.activeElement, input);
  view.host.blur();
  assert.notEqual(document.activeElement, input);
});
void test('Checkbox controlled requests are restored unless accepted, and disabled suppresses changes', async () => {
  const changes = [];
  const options = rt.vm({
    checked: false,
    label: 'Choice',
    'on:change': (checked, event) => changes.push([checked, event.type]),
  });
  mount(ui.Checkbox, options);
  const input = document.querySelector('input');
  input.click();
  await flush();
  assert.equal(input.checked, false);
  assert.deepEqual(changes, [[true, 'change']]);
  options['on:change'] = (checked) => {
    options.checked = checked;
  };
  input.click();
  await flush();
  assert.equal(input.checked, true);
  options.disabled = true;
  await flush();
  input.click();
  await flush();
  assert.equal(input.checked, true);
  assert.equal(input.disabled, true);
});
void test('Checkbox indeterminate persists until owner clears it and native reset restores the default', async () => {
  const form = document.createElement('form');
  form.id = 'choices';
  document.body.append(form);
  const changes = [];
  const options = rt.vm({
    defaultChecked: true,
    indeterminate: true,
    form: 'choices',
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Checkbox, options);
  const input = document.querySelector('input');
  assert.equal(input.indeterminate, true);
  assert.equal(input.getAttribute('aria-checked'), 'mixed');
  input.click();
  await flush();
  assert.equal(input.indeterminate, true);
  options.indeterminate = false;
  await flush();
  assert.equal(input.indeterminate, false);
  form.reset();
  await flush();
  assert.equal(input.checked, true);
  assert.deepEqual(changes, [false]);
});
void test('CheckboxGroup handles typed values, disabled items, defaults, normalization and dynamic option identity', async () => {
  const changes = [];
  const options = rt.vm({
    name: 'features',
    defaultValue: [0],
    options: [
      { value: 0, label: 'Zero' },
      { value: 'b', label: 'Beta', disabled: true },
      { value: 'c', label: 'Gamma' },
    ],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.CheckboxGroup, options);
  const first = document.querySelector('input');
  document.querySelectorAll('input')[2].click();
  await flush();
  assert.deepEqual(changes, [[0, 'c']]);
  document.querySelectorAll('input')[1].click();
  await flush();
  assert.equal(changes.length, 1);
  options.options = [options.options[2], options.options[0]];
  await flush();
  assert.equal(document.querySelectorAll('input')[1], first);
  assert.equal(first.checked, true);
});
void test('CheckboxGroup controlled rejection and later external values synchronize every native checkbox', async () => {
  const options = rt.vm({
    value: ['a'],
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
  });
  mount(ui.CheckboxGroup, options);
  document.querySelectorAll('input')[1].click();
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('input')].map((input) => input.checked),
    [true, false],
  );
  options.value = ['b'];
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('input')].map((input) => input.checked),
    [false, true],
  );
});
void test('Checkbox slots label the native control and cancelled reset retains edited state', async () => {
  const form = document.createElement('form');
  form.id = 'cancel-reset';
  document.body.append(form);
  const view = mount(ui.Checkbox, { form: form.id, 'slot:default': ui.BodySlot });
  const input = document.querySelector('input');
  assert.equal(input.labels[0].textContent, 'slot body');
  assert.equal(input.value, 'on');
  input.click();
  await flush();
  form.addEventListener('reset', (event) => event.preventDefault());
  form.reset();
  await flush();
  assert.equal(input.checked, true);
  form.reset();
  view.dispose();
  await flush();
  assert.equal(document.querySelector('input'), null);
});

void test('CheckboxGroup snapshots default arrays and reset ignores later in-place default mutation', async () => {
  const form = document.createElement('form');
  form.id = 'snapshot';
  document.body.append(form);
  const props = rt.vm({
    form: 'snapshot',
    defaultValue: ['a'],
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
  });
  mount(ui.CheckboxGroup, props);
  props.defaultValue.push('b');
  document.querySelectorAll('input')[1].click();
  await flush();
  form.reset();
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('input')].map((input) => input.checked),
    [true, false],
  );
});

void test('Checkbox binds boolean Controller values, external updates and blur validation', async () => {
  const form = ui.useForm(
    zod.z.object({ accepted: zod.z.boolean().refine((value) => value, 'Accept first') }),
    { defaultValues: { accepted: false } },
  );
  mount(ui.BooleanController, { control: form.control, kind: 'checkbox' });
  const input = document.querySelector('input');
  input.click();
  await flush();
  assert.equal(form.formState.accepted, true);
  await form.setField('accepted', false);
  await flush();
  assert.equal(input.checked, false);
  input.dispatchEvent(new FocusEvent('blur'));
  await flush();
  assert.equal(form.formErrors.accepted, 'Accept first');
});
