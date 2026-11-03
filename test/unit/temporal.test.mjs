import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, rt, ui, zod } from './harness.mjs';
void test('Installed Jinge preserves native Temporal identities and native methods in VM objects and arrays', async () => {
  const values = [
    Temporal.PlainDate.from('2026-11-03'),
    Temporal.PlainTime.from('12:30'),
    Temporal.PlainDateTime.from('2026-11-03T12:30'),
    Temporal.PlainYearMonth.from('2026-11'),
    Temporal.PlainMonthDay.from('11-03'),
    Temporal.Instant.from('2026-11-03T00:00Z'),
    Temporal.ZonedDateTime.from('2026-11-03T08:00+08:00[Asia/Shanghai]'),
    Temporal.Duration.from('P1D'),
  ];
  const state = rt.vm({ values, date: values[0] });
  for (let index = 0; index < values.length; index++) {
    assert.equal(state.values[index], values[index]);
    assert.equal(rt.isViewModel(state.values[index]), false);
    assert.equal(state.values[index].toString(), values[index].toString());
  }
  const calls = [];
  const stop = rt.vmWatch(state, 'date', (value) => calls.push(value));
  const next = Temporal.PlainDate.from('2026-11-04');
  state.date = next;
  await flush();
  stop();
  assert.deepEqual(calls, [next]);
});

void test('Form compares immutable Temporal dates, times and endpoint arrays by value', async () => {
  const form = ui.useForm(
    zod.z.object({
      date: zod.z.custom(),
      time: zod.z.custom(),
      range: zod.z.array(zod.z.custom()),
    }),
    {
      defaultValues: {
        date: Temporal.PlainDate.from('2026-11-03'),
        time: Temporal.PlainTime.from('12:30'),
        range: [Temporal.PlainDate.from('2026-11-03'), Temporal.PlainDate.from('2026-11-04')],
      },
    },
  );
  await form.setField('date', Temporal.PlainDate.from('2026-11-03'), false);
  await form.setField('time', Temporal.PlainTime.from('12:30'), false);
  await form.setField(
    'range',
    [Temporal.PlainDate.from('2026-11-03'), Temporal.PlainDate.from('2026-11-04')],
    false,
  );
  assert.equal(form.status.dirty, false);
  assert.equal(rt.isViewModel(form.formState.time), false);
  await form.setField('time', Temporal.PlainTime.from('12:31'), false);
  assert.equal(form.status.dirty, true);
});
