export type DateFormat = 'yyyy-MM-dd' | 'yyyy/MM/dd' | 'dd/MM/yyyy';
export type TimeFormat = 'HH:mm' | 'HH:mm:ss';
export function temporalSupported() {
  return (
    typeof globalThis.Temporal !== 'undefined' &&
    typeof Temporal.PlainDate?.from === 'function' &&
    typeof Temporal.PlainTime?.from === 'function' &&
    typeof Temporal.Now?.plainDateISO === 'function' &&
    typeof Temporal.Now?.plainTimeISO === 'function'
  );
}
export function normalizeDate(value: Temporal.PlainDate | null | undefined) {
  if (!temporalSupported() || value == null) return null;
  try {
    const date = Temporal.PlainDate.from(value).withCalendar('iso8601');
    return date.year >= 1 && date.year <= 9999 ? date : null;
  } catch {
    return null;
  }
}
export function formatDate(value: Temporal.PlainDate | null, format: DateFormat = 'yyyy-MM-dd') {
  if (!value) return '';
  const year = `${value.year}`.padStart(4, '0'),
    month = `${value.month}`.padStart(2, '0'),
    day = `${value.day}`.padStart(2, '0');
  return format === 'dd/MM/yyyy'
    ? `${day}/${month}/${year}`
    : format === 'yyyy/MM/dd'
      ? `${year}/${month}/${day}`
      : `${year}-${month}-${day}`;
}
export function parseDate(text: string, format: DateFormat = 'yyyy-MM-dd') {
  if (!temporalSupported()) return null;
  const match = (
    format === 'yyyy-MM-dd' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{2,4})\/(\d{2})\/(\d{2,4})$/
  ).exec(text);
  if (!match) return null;
  const fields =
    format === 'dd/MM/yyyy'
      ? { year: Number(match[3]), month: Number(match[2]), day: Number(match[1]) }
      : { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  try {
    const value = Temporal.PlainDate.from(fields, { overflow: 'reject' });
    return value.year >= 1 && value.year <= 9999 && formatDate(value, format) === text
      ? value
      : null;
  } catch {
    return null;
  }
}
export function sameDate(a: Temporal.PlainDate | null, b: Temporal.PlainDate | null) {
  return a === b || (!!a && !!b && a.equals(b));
}
export type DateLimits = {
  minDate?: Temporal.PlainDate;
  maxDate?: Temporal.PlainDate;
  disabledDate?(this: void, date: Temporal.PlainDate): boolean;
};
export function dateAllowed(date: Temporal.PlainDate, limits: DateLimits) {
  return (
    date.year >= 1 &&
    date.year <= 9999 &&
    (!limits.minDate || Temporal.PlainDate.compare(date, limits.minDate) >= 0) &&
    (!limits.maxDate || Temporal.PlainDate.compare(date, limits.maxDate) <= 0) &&
    !limits.disabledDate?.(date)
  );
}
export function todayDate() {
  return temporalSupported() ? Temporal.Now.plainDateISO() : null;
}
export function inRange(
  date: Temporal.PlainDate,
  start?: Temporal.PlainDate | null,
  end?: Temporal.PlainDate | null,
) {
  return (
    !!start &&
    !!end &&
    Temporal.PlainDate.compare(date, start) >= 0 &&
    Temporal.PlainDate.compare(date, end) <= 0
  );
}
export function normalizeTime(value: Temporal.PlainTime | null | undefined) {
  if (!temporalSupported() || value == null) return null;
  try {
    return Temporal.PlainTime.from(value).with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
  } catch {
    return null;
  }
}
export function formatTime(value: Temporal.PlainTime | null, format: TimeFormat = 'HH:mm:ss') {
  return value ? value.toString({ smallestUnit: format === 'HH:mm' ? 'minute' : 'second' }) : '';
}
export function parseTime(text: string, format: TimeFormat = 'HH:mm:ss') {
  if (
    !temporalSupported() ||
    !(format === 'HH:mm' ? /^\d{2}:\d{2}$/ : /^\d{2}:\d{2}:\d{2}$/).test(text)
  )
    return null;
  const [hour, minute, second = 0] = text.split(':').map(Number);
  // PlainTime.from(string) accepts leap-second notation; field bags with reject do not.
  try {
    return Temporal.PlainTime.from({ hour, minute, second }, { overflow: 'reject' });
  } catch {
    return null;
  }
}

export function clampDate(date: Temporal.PlainDate, limits: DateLimits) {
  const minimum = normalizeDate(limits.minDate),
    maximum = normalizeDate(limits.maxDate);
  return minimum && Temporal.PlainDate.compare(date, minimum) < 0
    ? minimum
    : maximum && Temporal.PlainDate.compare(date, maximum) > 0
      ? maximum
      : date;
}
