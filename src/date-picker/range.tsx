import { vm, watch } from 'jinge';

import type { DateRange, RangePickerProps } from './common';

import { CalendarPanel } from './calendar';
import {
  dateAllowed,
  clampDate,
  formatDate,
  normalizeDate,
  parseDate,
  sameDate,
  temporalSupported,
} from './temporal';
import { usePicker } from './use-picker';
import { PickerView } from './view';
export type { DateRange, RangePickerProps } from './common';
function normalize(value: DateRange | null | undefined): DateRange | null {
  if (!value || value.length !== 2) return null;
  const start = normalizeDate(value[0]),
    end = normalizeDate(value[1]);
  return start && end && Temporal.PlainDate.compare(start, end) <= 0 ? [start, end] : null;
}
function ordered(start: Temporal.PlainDate, end: Temporal.PlainDate): DateRange {
  return Temporal.PlainDate.compare(start, end) <= 0 ? [start, end] : [end, start];
}
function hasNextMonth(date: Temporal.PlainDate | null) {
  return !!date && (date.year < 9999 || date.month < 12);
}
function nextMonth(date: Temporal.PlainDate | null) {
  return date && (date.year < 9999 || date.month < 12) ? date.add({ months: 1 }) : undefined;
}
export function RangePicker(props: RangePickerProps) {
  const control = usePicker(props, {
    normalize,
    format: (value) =>
      value ? `${formatDate(value[0], props.format)} ~ ${formatDate(value[1], props.format)}` : '',
    parse: (text) => {
      const parts = text.split(' ~ ');
      if (parts.length !== 2) return null;
      const start = parseDate(parts[0], props.format),
        end = parseDate(parts[1], props.format);
      return start && end ? normalize([start, end]) : null;
    },
    equal: (a, b) => a === b || (!!a && !!b && sameDate(a[0], b[0]) && sameDate(a[1], b[1])),
    allowed: (value) => dateAllowed(value[0], props) && dateAllowed(value[1], props),
    serialize: (value) => `${value[0].toString()}/${value[1].toString()}`,
  });
  const state = control.state;
  const range = vm<{
    month: Temporal.PlainDate | null;
    anchor: Temporal.PlainDate | null;
    start: Temporal.PlainDate | null;
    end: Temporal.PlainDate | null;
  }>({
    month: temporalSupported()
      ? clampDate(
          state.value?.[0] ??
            normalizeDate(props.defaultPickerValue) ??
            Temporal.Now.plainDateISO(),
          props,
        ).with({ day: 1 })
      : null,
    anchor: null,
    start: state.value?.[0] ?? null,
    end: state.value?.[1] ?? null,
  });
  function reset() {
    range.anchor = null;
    range.start = state.value?.[0] ?? null;
    range.end = state.value?.[1] ?? null;
    if (temporalSupported())
      range.month = clampDate(
        state.value?.[0] ?? range.month ?? Temporal.Now.plainDateISO(),
        props,
      ).with({ day: 1 });
  }
  watch(state, 'open', reset);
  watch(state, 'value', reset);
  watch(props, 'format', () => control.sync());
  watch(props, 'minDate', () => {
    control.validity();
    reset();
  });
  watch(props, 'maxDate', () => {
    control.validity();
    reset();
  });
  watch(props, 'disabledDate', control.validity);
  function select(date: Temporal.PlainDate, event: Event) {
    if (!range.anchor) {
      range.anchor = date;
      range.start = date;
      range.end = date;
      props['on:calendarChange']?.([date, null]);
    } else {
      const dates = ordered(range.anchor, date);
      props['on:calendarChange']?.([...dates]);
      range.anchor = null;
      control.choose(dates, event);
    }
  }
  function hover(date: Temporal.PlainDate) {
    if (!range.anchor) return;
    const dates = ordered(range.anchor, date);
    range.start = dates[0];
    range.end = dates[1];
  }
  return (
    <PickerView
      config={props}
      control={control}
      kind="range"
      slot:panel={
        <div className="ja-range-panel">
          <div className="ja-range-calendars">
            <CalendarPanel
              ariaLabel="开始日历"
              hideOutside
              viewDate={range.month ?? undefined}
              rangeStart={range.start}
              rangeEnd={range.end}
              minDate={props.minDate}
              maxDate={props.maxDate}
              disabledDate={props.disabledDate}
              locale={props.locale}
              weekStartsOn={props.weekStartsOn}
              on:select={select}
              on:hover={hover}
              on:viewChange={(month) => {
                range.month = month;
              }}
            />
            {hasNextMonth(range.month) && (
              <CalendarPanel
                ariaLabel="结束日历"
                hideOutside
                viewDate={nextMonth(range.month)}
                rangeStart={range.start}
                rangeEnd={range.end}
                minDate={props.minDate}
                maxDate={props.maxDate}
                disabledDate={props.disabledDate}
                locale={props.locale}
                weekStartsOn={props.weekStartsOn}
                on:select={select}
                on:hover={hover}
                on:viewChange={(month) => {
                  range.month =
                    month.year === 1 && month.month === 1 ? month : month.subtract({ months: 1 });
                }}
              />
            )}
          </div>
          <div className="ja-range-status" role="status">
            {range.anchor ? '开始日期已选，请选择结束日期' : '请选择开始日期和结束日期'}
          </div>
        </div>
      }
    />
  );
}
