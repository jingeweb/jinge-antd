import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, ui, zod } from './harness.mjs';

void test('Form/Field renders labels, help/error relationships, binds text and focuses invalid controls', async () => {
  const form = ui.useForm(zod.z.object({ name: zod.z.string().min(2, 'Name too short') }), {
    defaultValues: { name: '' },
  });
  mount(ui.FormViewProbe, { form });
  const field = document.querySelector('input');
  assert.equal(field.labels[0].textContent.includes('Customer'), true);
  assert.equal(document.querySelector('form').noValidate, true);
  assert.equal(field.getAttribute('aria-describedby').includes('help'), true);
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await flush();
  assert.equal(document.querySelector('[role=alert]').textContent, 'Name too short');
  assert.equal(field.getAttribute('aria-invalid'), 'true');
  assert.equal(document.activeElement, field);
  input('Ada');
  await flush();
  assert.equal(form.formState.name, 'Ada');
  assert.equal(document.querySelector('[role=alert]'), null);
});
void test('Form native reset updates engine, cancellation is respected and owner unmount prevents late finish', async () => {
  const form = ui.useForm(zod.z.object({ name: zod.z.string() }), {
    defaultValues: { name: 'Initial' },
  });
  const finished = [];
  const view = mount(ui.FormViewProbe, { form, finish: (value) => finished.push(value) });
  input('Edited');
  await flush();
  document.querySelector('form').reset();
  await flush();
  assert.equal(document.querySelector('input').value, 'Initial');
  input('Retained');
  await flush();
  document
    .querySelector('form')
    .addEventListener('reset', (event) => event.preventDefault(), { once: true });
  document.querySelector('form').reset();
  await flush();
  assert.equal(form.formState.name, 'Retained');
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  view.dispose();
  await flush();
  assert.deepEqual(finished, []);
});
void test('Field dynamic unmount respects preserve=false and remount registers a fresh focus target', async () => {
  const form = ui.useForm(zod.z.object({ name: zod.z.string().optional() }), {
    defaultValues: { name: 'Draft' },
  });
  const state = { form, visible: true, preserve: false };
  const view = mount(ui.DynamicFormProbe, state);
  assert.equal(document.querySelector('input').value, 'Draft');
  view.host.hide();
  await flush();
  assert.equal(form.formState.name, undefined);
  view.host.show();
  await flush();
  assert.equal(document.querySelector('input').value, '');
  form.focusField('name');
  await flush();
  assert.equal(document.activeElement, document.querySelector('input'));
});

void test('Form field validateTrigger=submit delays blur errors and after submission changes revalidate', async () => {
  const form = ui.useForm(zod.z.object({ name: zod.z.string().min(2, 'Short') }), {
    defaultValues: { name: '' },
  });
  mount(ui.FormTriggerProbe, { form });
  const field = document.querySelector('input');
  field.dispatchEvent(new FocusEvent('blur'));
  await flush();
  assert.equal(form.formErrors.name, undefined);
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await flush();
  assert.equal(form.formErrors.name, 'Short');
  input('Ada');
  await flush();
  assert.equal(form.formErrors.name, undefined);
});
