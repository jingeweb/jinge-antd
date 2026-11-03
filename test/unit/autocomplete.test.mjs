import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui, zod } from './harness.mjs';
const options = [
  { value: 'ada@example.com', label: 'Ada' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'grace@example.com', label: 'Grace', group: 'Contacts' },
];
const key = (el, value) =>
  el.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
  );
void test('AutoComplete accepts free text, forwards native attrs, and supports public focus/select', async () => {
  const changes = [],
    searches = [];
  const view = mount(ui.AutoComplete, {
    options,
    defaultValue: 'Custom',
    name: 'contact',
    required: true,
    autoComplete: 'email',
    ariaLabel: 'Contact',
    'on:change': (value) => changes.push(value),
    'on:search': (value) => searches.push(value),
  });
  const field = document.querySelector('[role=combobox]');
  assert.equal(field.value, 'Custom');
  assert.equal(field.name, 'contact');
  assert.equal(field.required, true);
  assert.equal(field.autocomplete, 'email');
  view.host.focus();
  view.host.select();
  assert.equal(field.selectionEnd, 6);
  input('Unlisted');
  await flush();
  assert.equal(field.value, 'Unlisted');
  assert.deepEqual(changes, ['Unlisted']);
  assert.deepEqual(searches, ['Unlisted']);
});
void test('AutoComplete keyboard selection commits option value rather than label and preserves input node', async () => {
  const changes = [],
    selections = [];
  mount(ui.AutoComplete, {
    options,
    'on:change': (value) => changes.push(value),
    'on:select': (value) => selections.push(value),
  });
  const field = document.querySelector('[role=combobox]');
  field.focus();
  key(field, 'ArrowDown');
  await flush();
  key(field, 'ArrowDown');
  key(field, 'Enter');
  await flush();
  assert.equal(field.value, 'grace@example.com');
  assert.equal(document.querySelector('[role=combobox]'), field);
  assert.deepEqual(changes, ['grace@example.com']);
  assert.deepEqual(selections, ['grace@example.com']);
  assert.equal(document.querySelector('[role=listbox]'), null);
});
void test('AutoComplete controlled owner transforms accepted text and rejects other edits after propagation', async () => {
  const props = rt.vm({ options, value: 'Owner' });
  mount(ui.AutoComplete, props);
  const field = document.querySelector('[role=combobox]');
  input('Rejected');
  await flush();
  assert.equal(field.value, 'Owner');
  props['on:change'] = (value) => {
    props.value = value.toUpperCase();
  };
  input('accepted');
  await flush();
  assert.equal(field.value, 'ACCEPTED');
});
void test('AutoComplete IME emits once, ignores composition Enter and deduplicates transformed trailing input', async () => {
  const changes = [],
    searches = [];
  const props = rt.vm({
    options: [{ value: '中文', label: '中文' }],
    value: '',
    'on:change': (value) => {
      changes.push(value);
      props.value = value + '!';
    },
    'on:search': (value) => searches.push(value),
  });
  mount(ui.AutoComplete, props);
  const field = document.querySelector('[role=combobox]');
  field.dispatchEvent(new Event('compositionstart'));
  input('中');
  key(field, 'Enter');
  assert.deepEqual(changes, []);
  field.dispatchEvent(new Event('compositionend'));
  await flush();
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.deepEqual(changes, ['中']);
  assert.deepEqual(searches, ['中']);
  assert.equal(field.value, '中!');
});
void test('AutoComplete clearing produces empty string and native reset restores default without change', async () => {
  const form = document.createElement('form');
  form.id = 'auto-reset';
  document.body.append(form);
  const changes = [];
  mount(ui.AutoComplete, {
    options,
    defaultValue: 'Initial',
    form: form.id,
    allowClear: true,
    'on:change': (value) => changes.push(value),
  });
  document.querySelector('[aria-label="清空输入"]').click();
  await flush();
  assert.equal(document.querySelector('[role=combobox]').value, '');
  form.reset();
  await flush();
  assert.equal(document.querySelector('[role=combobox]').value, 'Initial');
  assert.deepEqual(changes, ['']);
});
void test('AutoComplete readonly and disabled block synthetic changes and loading prevents stale suggestion selection', async () => {
  const changes = [];
  const props = rt.vm({
    options,
    defaultValue: 'Safe',
    readOnly: true,
    'on:change': (value) => changes.push(value),
  });
  mount(ui.AutoComplete, props);
  const field = document.querySelector('[role=combobox]');
  input('Bad');
  await flush();
  assert.equal(field.value, 'Safe');
  props.readOnly = false;
  props.loading = true;
  await flush();
  input('');
  await flush();
  assert.equal(document.querySelectorAll('[role=option]').length, 0);
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('[role=listbox]'), null);
  assert.deepEqual(changes, ['']);
});

void test('AutoComplete binds Controller free text, external updates and blur validation', async () => {
  const form = ui.useForm(zod.z.object({ text: zod.z.string().min(3, 'Too short') }), {
    defaultValues: { text: 'Initial' },
  });
  mount(ui.AutoCompleteController, { control: form.control });
  const field = document.querySelector('[role=combobox]');
  input('x');
  field.dispatchEvent(new FocusEvent('blur'));
  await flush();
  assert.equal(form.formState.text, 'x');
  assert.equal(form.formErrors.text, 'Too short');
  await form.setField('text', 'External');
  await flush();
  assert.equal(field.value, 'External');
});
