import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
import { chooseOption } from './select-choice.mjs';
const time = (text) => Temporal.PlainTime.from(text);
const button = (label) =>
  [...document.querySelectorAll('button')].find((el) => el.getAttribute('aria-label') === label);
void test('TimePicker preserves native values, precision and canonical form serialization', () => {
  mount(ui.TimePicker, { defaultValue: time('12:34:56.123'), name: 'time' });
  assert.equal(document.querySelector('.ja-picker-input').value, '12:34:56');
  assert.equal(document.querySelector('input[type=hidden]').value, '12:34:56');
});
void test('TimePicker rejects overflow, leap-second notation and disabled combinations', async () => {
  const changes = [];
  mount(ui.TimePicker, {
    disabledTime: (value) => value.hour === 12,
    'on:change': (v) => changes.push(v),
  });
  const input = document.querySelector('.ja-picker-input');
  for (const value of ['24:00:00', '23:59:60', '12:30:00']) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    assert.equal(input.checkValidity(), false);
  }
  assert.equal(changes.length, 0);
});
void test('TimePicker steps and per-unit disabled rules drive its Select options and explicit confirmation', async () => {
  const changes = [];
  mount(ui.TimePicker, {
    defaultValue: time('10:00:00'),
    minuteStep: 15,
    disabledHours: () => [11],
    disabledMinutes: (hour) => (hour === 10 ? [30] : []),
    'on:change': (v) => changes.push(v),
  });
  button('打开时间选择').click();
  await flush();
  const hour = document.querySelector('[aria-label=小时]'),
    minute = document.querySelector('[aria-label=分钟]');
  hour.click();
  await flush();
  assert.equal(
    document.querySelector('[role=option][aria-label="11"]').getAttribute('aria-disabled'),
    'true',
  );
  hour.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  minute.click();
  await flush();
  assert.equal(document.querySelectorAll('[role=option]:not([aria-disabled="true"])').length, 3);
  await chooseOption(minute, '15');
  assert.equal(changes.length, 0);
  [...document.querySelectorAll('button')].find((el) => el.textContent === '确定').click();
  await flush();
  assert.equal(changes[0].toString(), '10:15:00');
});
void test('TimePicker controlled requests can be rejected, external writes and clear use native Temporal or null', async () => {
  const changes = [],
    props = rt.vm({
      value: time('10:00'),
      format: 'HH:mm',
      allowClear: true,
      'on:change': (v) => changes.push(v),
    });
  mount(ui.TimePicker, props);
  const input = document.querySelector('.ja-picker-input');
  input.value = '11:30';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await flush();
  assert.equal(input.value, '10:00');
  props.value = changes[0];
  await flush();
  assert.equal(input.value, '11:30');
  button('清空时间').click();
  await flush();
  assert.equal(changes[1], null);
  assert.equal(input.value, '11:30');
});
void test('TimePicker HH:mm drops hidden seconds and disabled/readOnly do not open panels', async () => {
  const props = rt.vm({ defaultValue: time('10:20:30'), format: 'HH:mm', readOnly: true });
  mount(ui.TimePicker, props);
  assert.equal(document.querySelector('input[type=hidden]').value, '10:20:00');
  button('打开时间选择').click();
  await flush();
  assert.equal(document.querySelector('[role=dialog]'), null);
});
