import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui, zod } from './harness.mjs';

void test('Switch is a native form control with switch semantics, stable name and focus', async () => {
  const changes = [];
  const view = mount(ui.Switch, {
    label: 'Auto save',
    defaultChecked: true,
    name: 'save',
    value: 'enabled',
    checkedLabel: 'On',
    uncheckedLabel: 'Off',
    'on:change': (checked, event) => changes.push([checked, event.type]),
  });
  const input = document.querySelector('input');
  assert.equal(input.type, 'checkbox');
  assert.equal(input.getAttribute('role'), 'switch');
  assert.equal(input.checked, true);
  assert.equal(input.name, 'save');
  assert.equal(input.value, 'enabled');
  assert.equal(document.querySelector('.ja-switch-caption').textContent, 'On');
  view.host.focus();
  assert.equal(document.activeElement, input);
  input.click();
  await flush();
  assert.equal(input.checked, false);
  assert.equal(input.getAttribute('aria-checked'), 'false');
  assert.deepEqual(changes, [[false, 'change']]);
});
void test('Switch controlled requests are rejected or accepted without replacing the input', async () => {
  const props = rt.vm({ checked: false, label: 'Switch' });
  mount(ui.Switch, props);
  const input = document.querySelector('input');
  input.click();
  await flush();
  assert.equal(input.checked, false);
  props['on:change'] = (checked) => {
    props.checked = checked;
  };
  input.click();
  await flush();
  assert.equal(input.checked, true);
  assert.equal(document.querySelector('input'), input);
});
void test('Switch loading and disabled block pointer and Enter while busy reflects real loading', async () => {
  const changes = [];
  const props = rt.vm({
    defaultChecked: false,
    loading: true,
    label: 'Save',
    'on:change': (checked) => changes.push(checked),
  });
  mount(ui.Switch, props);
  const input = document.querySelector('input');
  assert.equal(input.disabled, true);
  assert.equal(input.getAttribute('aria-busy'), 'true');
  input.click();
  input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await flush();
  assert.deepEqual(changes, []);
  props.loading = false;
  props.disabled = true;
  await flush();
  assert.equal(input.disabled, true);
  props.disabled = false;
  await flush();
  input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await flush();
  assert.deepEqual(changes, [true]);
});
void test('Switch form reset restores its initial value silently and ignores later defaults', async () => {
  const form = document.createElement('form');
  form.id = 'switch-form';
  document.body.append(form);
  const changes = [];
  const props = rt.vm({
    form: 'switch-form',
    defaultChecked: true,
    'on:change': (checked) => changes.push(checked),
  });
  mount(ui.Switch, props);
  const input = document.querySelector('input');
  input.click();
  props.defaultChecked = false;
  await flush();
  form.reset();
  await flush();
  assert.equal(input.checked, true);
  assert.deepEqual(changes, [false]);
});
void test('Switch supplies aria attributes and default label slot without including state captions in the label', () => {
  mount(ui.Switch, {
    ariaLabel: 'Sync',
    ariaDescribedby: 'hint',
    checkedLabel: 'Active',
    'slot:default': ui.BodySlot,
  });
  assert.equal(document.querySelector('input').getAttribute('aria-label'), 'Sync');
  assert.equal(document.querySelector('input').getAttribute('aria-describedby'), 'hint');
  assert.equal(document.querySelector('.ja-switch-label').textContent, 'slot body');
  assert.equal(document.querySelector('.ja-switch-track').getAttribute('aria-hidden'), 'true');
  assert.equal(document.querySelector('input').value, 'on');
  assert.equal(document.querySelector('.ja-switch-caption').textContent, '');
});

void test('Switch binds boolean Controller values and handles external false without a text value adapter', async () => {
  const form = ui.useForm(zod.z.object({ accepted: zod.z.boolean() }), {
    defaultValues: { accepted: false },
  });
  mount(ui.BooleanController, { control: form.control, kind: 'switch' });
  const input = document.querySelector('input');
  input.click();
  await flush();
  assert.equal(form.formState.accepted, true);
  await form.setField('accepted', false);
  await flush();
  assert.equal(input.checked, false);
});
