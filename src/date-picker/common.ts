import type { WithEvents, WithExpose } from 'jinge';

import type { DateFormat, DateLimits, TimeFormat } from './temporal';
export type PickerHandle = { focus(options?: FocusOptions): void; blur(): void; select(): void };
export type PickerProps<T> = {
  value?: T | null;
  defaultValue?: T;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  allowClear?: boolean;
  id?: string;
  name?: string;
  form?: string;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: 'error' | 'warning';
  className?: string;
  style?: string;
} & WithEvents<{
  change?(value: T | null, event: Event): void;
  openChange?(open: boolean, event?: Event): void;
  blur?(event: FocusEvent): void;
  focus?(event: FocusEvent): void;
}> &
  WithExpose<PickerHandle>;
export type DatePickerProps = PickerProps<Temporal.PlainDate> &
  DateLimits & {
    format?: DateFormat;
    locale?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    defaultPickerValue?: Temporal.PlainDate;
  };
export type TimePickerProps = PickerProps<Temporal.PlainTime> & {
  format?: TimeFormat;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  disabledHours?(): number[];
  disabledMinutes?(hour: number): number[];
  disabledSeconds?(hour: number, minute: number): number[];
  disabledTime?(time: Temporal.PlainTime): boolean;
};
export type PickerCodec<T> = {
  normalize(value: T | null | undefined): T | null;
  format(value: T | null): string;
  parse(text: string): T | null;
  equal(a: T | null, b: T | null): boolean;
  allowed(value: T): boolean;
  serialize(value: T): string;
};

export type DateRange = [Temporal.PlainDate, Temporal.PlainDate];
export type RangePickerProps = PickerProps<DateRange> &
  DateLimits & {
    format?: DateFormat;
    locale?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    defaultPickerValue?: Temporal.PlainDate;
    'on:calendarChange'?(value: [Temporal.PlainDate | null, Temporal.PlainDate | null]): void;
  };
