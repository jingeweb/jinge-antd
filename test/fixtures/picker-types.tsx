import { ref } from 'jinge';

import {
  DatePicker,
  RangePicker,
  TimePicker,
  type DatePickerProps,
  type RangePickerProps,
  type TimePickerProps,
  type DateRange,
} from '../../src';
export function NativePickerTypes() {
  const date = Temporal.PlainDate.from('2026-11-03'),
    time = Temporal.PlainTime.from('12:30');
  const handle = ref<typeof DatePicker>();
  // @ts-expect-error Date is a different value model; no implicit timezone conversion.
  const oldDate: DatePickerProps = { value: new Date(0) };
  // @ts-expect-error A date is not a pure time.
  const wrongTime: TimePickerProps = { value: date };
  // @ts-expect-error Committed ranges must have both endpoints.
  const partial: RangePickerProps = { value: [date] };
  void oldDate;
  void wrongTime;
  void partial;
  return (
    <>
      <DatePicker
        value={date}
        ref={handle}
        on:change={(value) => {
          const expected: Temporal.PlainDate | null = value;
          void expected;
        }}
      />
      <TimePicker
        defaultValue={time}
        on:change={(value) => {
          const expected: Temporal.PlainTime | null = value;
          void expected;
        }}
      />
      <RangePicker
        value={[date, date]}
        on:change={(value) => {
          const expected: DateRange | null = value;
          void expected;
        }}
      />
    </>
  );
}
