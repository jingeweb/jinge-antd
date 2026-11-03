import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui, zod } from './harness.mjs';
const date = (value) => Temporal.PlainDate.from(value);
const button = (label) =>
  [...document.querySelectorAll('button')].find((el) => el.getAttribute('aria-label') === label);
const type = (value) => {
  const input = document.querySelector('.ja-picker-input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input;
};
const key = (el, value, extra = {}) =>
  el.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra }),
  );
void test('DatePicker preserves native Temporal defaults, exposes focus, and submits canonical ISO separately from display', () => {
  const view = mount(ui.DatePicker, {
    defaultValue: date('2024-02-29'),
    format: 'dd/MM/yyyy',
    name: 'date',
    ariaLabel: 'Date',
  });
  assert.equal(document.querySelector('.ja-picker-input').value, '29/02/2024');
  assert.equal(document.querySelector('input[type=hidden]').value, '2024-02-29');
  view.host.focus();
  assert.equal(document.activeElement, document.querySelector('.ja-picker-input'));
});
void test('DatePicker text edits commit only on Enter and reject non-existent or mismatched dates', async () => {
  const changes = [];
  mount(ui.DatePicker, { defaultValue: date('2024-01-01'), 'on:change': (v) => changes.push(v) });
  let input = type('2025-02-29');
  key(input, 'Enter');
  await flush();
  assert.equal(changes.length, 0);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(input.checkValidity(), false);
  input = type('2024-02-29');
  assert.equal(changes.length, 0);
  key(input, 'Enter');
  await flush();
  assert.equal(changes[0].toString(), '2024-02-29');
  assert.equal(rt.isViewModel(changes[0]), false);
  type('2024-2-9');
  key(input, 'Enter');
  await flush();
  assert.equal(changes.length, 1);
  key(input, 'Escape');
  await flush();
  assert.equal(input.value, '2024-02-29');
});
void test('DatePicker controlled requests restore rejected native text and accept external updates including null', async () => {
  const changes = [];
  const props = rt.vm({ value: date('2026-11-03'), 'on:change': (v) => changes.push(v) });
  mount(ui.DatePicker, props);
  const input = type('2026-11-04');
  key(input, 'Enter');
  await flush();
  assert.equal(input.value, '2026-11-03');
  assert.equal(changes[0].day, 4);
  props.value = date('2026-12-05');
  await flush();
  assert.equal(input.value, '2026-12-05');
  props.value = null;
  await flush();
  assert.equal(input.value, '');
});
void test('DatePicker calendar has a named dialog and six weeks, supports month/year and disabled limits', async () => {
  mount(ui.DatePicker, {
    defaultValue: date('2024-02-29'),
    minDate: date('2024-02-02'),
    maxDate: date('2024-03-10'),
    disabledDate: (d) => d.day === 15,
  });
  button('打开日期选择').click();
  await flush();
  assert.ok(document.querySelector('[role=dialog]'));
  assert.equal(document.querySelectorAll('.ja-calendar-day').length, 42);
  assert.equal(button('2024-02-01').disabled, true);
  assert.equal(button('2024-02-15').disabled, true);
  assert.equal(button('上个月').disabled, true);
  button('下个月').click();
  await flush();
  assert.equal(button('2024-03-11').disabled, true);
});
void test('DatePicker arrow navigation crosses leap-month boundaries, skips disabled dates and selects with Enter', async () => {
  const changes = [];
  mount(ui.DatePicker, {
    defaultValue: date('2024-02-28'),
    disabledDate: (d) => d.equals(date('2024-02-29')),
    'on:change': (v) => changes.push(v),
  });
  key(document.querySelector('.ja-picker-input'), 'ArrowDown');
  await flush();
  assert.equal(document.activeElement.getAttribute('aria-label'), '2024-02-28');
  key(document.activeElement, 'ArrowRight');
  await flush();
  assert.equal(document.activeElement.getAttribute('aria-label'), '2024-03-01');
  key(document.activeElement, 'Enter');
  await flush();
  assert.equal(changes[0].toString(), '2024-03-01');
  assert.equal(document.querySelector('[role=dialog]'), null);
});
void test('DatePicker clear, disabled and readonly guard native fields, calendar and change requests', async () => {
  const changes = [];
  const props = rt.vm({
    defaultValue: date('2026-11-03'),
    allowClear: true,
    readOnly: true,
    'on:change': (v) => changes.push(v),
  });
  mount(ui.DatePicker, props);
  button('清空日期').click();
  assert.equal(changes.length, 0);
  button('打开日期选择').click();
  await flush();
  assert.equal(document.querySelector('[role=dialog]'), null);
  props.readOnly = false;
  await flush();
  button('清空日期').click();
  await flush();
  assert.deepEqual(changes, [null]);
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('.ja-picker-input').disabled, true);
});
void test('DatePicker controlled open may reject requests and external disabled closes an accepted panel', async () => {
  const requests = [];
  const props = rt.vm({
    open: false,
    defaultValue: date('2026-11-03'),
    'on:openChange': (v) => requests.push(v),
  });
  mount(ui.DatePicker, props);
  button('打开日期选择').click();
  await flush();
  assert.deepEqual(requests, [true]);
  assert.equal(document.querySelector('[role=dialog]'), null);
  props.open = true;
  await flush();
  assert.ok(document.querySelector('[role=dialog]'));
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('[role=dialog]'), null);
});
void test('DatePicker ignores composing Enter and required empty/invalid values fail native validation', async () => {
  const changes = [];
  mount(ui.DatePicker, { required: true, 'on:change': (v) => changes.push(v) });
  const input = type('2026-11-03');
  key(input, 'Enter', { isComposing: true });
  await flush();
  assert.equal(changes.length, 0);
  input.dispatchEvent(new Event('compositionend', { bubbles: true }));
  key(input, 'Enter');
  await flush();
  assert.equal(changes.length, 1);
  type('');
  key(input, 'Enter');
  await flush();
  assert.equal(input.checkValidity(), false);
});
void test('DatePicker native reset restores immutable defaults without change callbacks', async () => {
  mount(ui.DatePickerFormFixture);
  const input = type('2026-11-04');
  key(input, 'Enter');
  await flush();
  document.querySelector('form').reset();
  await flush();
  assert.equal(input.value, '2026-11-03');
  assert.equal(document.querySelector('input[type=hidden]').value, '2026-11-03');
});
void test('DatePicker unsupported browsers show an explicit unavailable state without importing a polyfill', () => {
  const original = globalThis.Temporal;
  try {
    globalThis.Temporal = undefined;
    mount(ui.DatePicker, {});
    assert.match(document.querySelector('[role=alert]').textContent, /Temporal/);
    assert.equal(document.querySelector('.ja-picker-input').disabled, true);
  } finally {
    globalThis.Temporal = original;
  }
});

void test('DatePicker integrates Controller, preserves native values and equivalent dates remain clean', async () => {
  const form = ui.useForm(
    zod.z.object({
      date: zod.z.custom((value) => value === null || value instanceof Temporal.PlainDate),
    }),
    { defaultValues: { date: date('2026-11-03') } },
  );
  mount(ui.DatePickerControllerFixture, { form });
  await form.setField('date', date('2026-11-03'), false);
  await flush();
  assert.equal(form.status.dirty, false);
  const input = type('2026-11-04');
  key(input, 'Enter');
  await flush();
  assert.equal(form.formState.date.toString(), '2026-11-04');
  assert.equal(form.status.dirty, true);
  form.reset();
  await flush();
  assert.equal(input.value, '2026-11-03');
  assert.equal(rt.isViewModel(form.formState.date), false);
});
void test('DatePicker queued open/focus work is harmless after unmount and does not close newer instances', async () => {
  const first = mount(ui.DatePicker, { defaultValue: date('2026-11-03') });
  key(document.querySelector('.ja-picker-input'), 'ArrowDown');
  first.dispose();
  await flush();
  mount(ui.DatePicker, { defaultValue: date('2026-11-04') });
  await flush();
  assert.equal(document.querySelector('[role=dialog]'), null);
  assert.equal(document.querySelector('.ja-picker-input').value, '2026-11-04');
});

void test('DatePicker last allowed day keeps focus when all forward candidates are disabled', async () => {
  mount(ui.DatePicker, { defaultValue: date('2026-11-03'), maxDate: date('2026-11-03') });
  key(document.querySelector('.ja-picker-input'), 'ArrowDown');
  await flush();
  const active = document.activeElement;
  key(active, 'ArrowRight');
  await flush();
  assert.equal(document.activeElement, active);
});
void test('DatePicker invalid locale configuration falls back without breaking the calendar', async () => {
  mount(ui.DatePicker, { defaultValue: date('2026-11-03'), locale: 'bad_locale' });
  button('打开日期选择').click();
  await flush();
  assert.match(document.querySelector('.ja-calendar-heading').textContent, /2026/);
});

void test('DatePicker restores controlled state and can retry after a change callback throws', async () => {
  const calls = [];
  const props = rt.vm({
    value: date('2026-11-03'),
    'on:change': () => {
      throw new Error('owner failed');
    },
  });
  mount(ui.DatePicker, props);
  const stop = (event) => event.preventDefault();
  window.addEventListener('error', stop);
  try {
    const input = type('2026-11-04');
    key(input, 'Enter');
    await flush();
    assert.equal(input.value, '2026-11-03');
    props['on:change'] = (value) => calls.push(value);
    type('2026-11-04');
    key(input, 'Enter');
    await flush();
    assert.equal(calls.length, 1);
  } finally {
    window.removeEventListener('error', stop);
  }
});
