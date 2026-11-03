import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const date = (text) => Temporal.PlainDate.from(text);
const open = () =>
  [...document.querySelectorAll('button')]
    .find((el) => el.getAttribute('aria-label') === '打开范围选择')
    .click();
const day = (text) =>
  [...document.querySelectorAll('.ja-calendar-day')].find(
    (el) => el.getAttribute('aria-label') === text && !el.closest('.outside'),
  );
void test('RangePicker preserves native endpoints and serializes a canonical date interval', () => {
  mount(ui.RangePicker, { defaultValue: [date('2026-11-03'), date('2026-11-05')], name: 'range' });
  assert.equal(document.querySelector('.ja-picker-input').value, '2026-11-03 ~ 2026-11-05');
  assert.equal(document.querySelector('input[type=hidden]').value, '2026-11-03/2026-11-05');
});
void test('RangePicker commits once only after two dates, sorts reversed clicks and displays two adjacent months', async () => {
  const changes = [];
  mount(ui.RangePicker, {
    defaultPickerValue: date('2026-11-01'),
    'on:change': (v) => changes.push(v),
  });
  open();
  await flush();
  assert.equal(document.querySelectorAll('.ja-calendar').length, 2);
  day('2026-11-10').click();
  await flush();
  assert.equal(changes.length, 0);
  assert.ok(document.querySelector('[role=dialog]'));
  day('2026-11-03').click();
  await flush();
  assert.deepEqual(
    changes[0].map((v) => v.toString()),
    ['2026-11-03', '2026-11-10'],
  );
  assert.equal(document.querySelector('[role=dialog]'), null);
});
void test('RangePicker validates typed order and disabled endpoints without modifying committed values', async () => {
  const changes = [];
  mount(ui.RangePicker, { disabledDate: (d) => d.day === 5, 'on:change': (v) => changes.push(v) });
  const input = document.querySelector('.ja-picker-input');
  for (const value of ['2026-11-10 ~ 2026-11-03', '2026-11-03 ~ 2026-11-05']) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    assert.equal(input.checkValidity(), false);
  }
  assert.equal(changes.length, 0);
});
void test('RangePicker external updates and rejected changes retain parent ownership', async () => {
  const changes = [],
    props = rt.vm({
      value: [date('2026-11-03'), date('2026-11-05')],
      'on:change': (v) => changes.push(v),
    });
  mount(ui.RangePicker, props);
  open();
  await flush();
  day('2026-11-10').click();
  day('2026-11-12').click();
  await flush();
  assert.equal(document.querySelector('.ja-picker-input').value, '2026-11-03 ~ 2026-11-05');
  props.value = changes[0];
  await flush();
  assert.equal(document.querySelector('.ja-picker-input').value, '2026-11-10 ~ 2026-11-12');
});
void test('RangePicker Escape discards the partial selection and clearing emits null', async () => {
  const changes = [];
  mount(ui.RangePicker, {
    defaultValue: [date('2026-11-03'), date('2026-11-05')],
    allowClear: true,
    'on:change': (v) => changes.push(v),
  });
  open();
  await flush();
  day('2026-11-10').click();
  await flush();
  document
    .querySelector('[role=dialog]')
    .dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(changes.length, 0);
  [...document.querySelectorAll('button')]
    .find((el) => el.getAttribute('aria-label') === '清空日期')
    .click();
  await flush();
  assert.deepEqual(changes, [null]);
});

void test('RangePicker keeps adjacent month headings even when all dates in the second month are out of range', async () => {
  mount(ui.RangePicker, {
    defaultPickerValue: date('2026-11-01'),
    minDate: date('2026-11-01'),
    maxDate: date('2026-11-30'),
  });
  open();
  await flush();
  const headings = [...document.querySelectorAll('.ja-calendar-heading')].map(
    (el) => el.textContent,
  );
  assert.match(headings[0], /11/);
  assert.match(headings[1], /12/);
});
void test('RangePicker at the last supported month does not render an unrelated second calendar', async () => {
  mount(ui.RangePicker, { defaultValue: [date('9999-12-01'), date('9999-12-31')] });
  open();
  await flush();
  assert.equal(document.querySelectorAll('.ja-calendar').length, 1);
});
