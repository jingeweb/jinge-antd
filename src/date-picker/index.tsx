import './style.scss';
import { watch } from 'jinge';

import type { DatePickerProps } from './common';

import { CalendarPanel } from './calendar';
import { dateAllowed, formatDate, normalizeDate, parseDate, sameDate } from './temporal';
import { usePicker } from './use-picker';
import { PickerView } from './view';
export type { DatePickerProps, PickerHandle } from './common';
export type { DateFormat } from './temporal';
export { temporalSupported } from './temporal';
export function DatePicker(props: DatePickerProps) {
  const control = usePicker(props, {
    normalize: normalizeDate,
    format: (value) => formatDate(value, props.format),
    parse: (text) => parseDate(text, props.format),
    equal: sameDate,
    allowed: (date) => dateAllowed(date, props),
    serialize: (date) => date.toString(),
  });
  const state = control.state;
  watch(props, 'format', () => control.sync());
  watch(props, 'minDate', control.validity);
  watch(props, 'maxDate', control.validity);
  watch(props, 'disabledDate', control.validity);
  return (
    <PickerView
      config={props}
      control={control}
      kind="date"
      slot:panel={
        <CalendarPanel
          value={state.value}
          viewDate={props.defaultPickerValue}
          minDate={props.minDate}
          maxDate={props.maxDate}
          disabledDate={props.disabledDate}
          locale={props.locale}
          weekStartsOn={props.weekStartsOn}
          on:select={(date, event) => control.choose(date, event)}
        />
      }
    />
  );
}
export { RangePicker } from './range';
export type { RangePickerProps, DateRange } from './common';
