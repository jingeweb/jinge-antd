import { For, type WithEvents, cx, onUnmount, ref, uid, vm, watch } from 'jinge';

import {
  type DateLimits,
  dateAllowed,
  clampDate,
  inRange,
  normalizeDate,
  sameDate,
} from './temporal';
export type CalendarProps = DateLimits & {
  ariaLabel?: string;
  hideOutside?: boolean;
  value?: Temporal.PlainDate | null;
  viewDate?: Temporal.PlainDate;
  locale?: string;
  weekStartsOn?: number;
  rangeStart?: Temporal.PlainDate | null;
  rangeEnd?: Temporal.PlainDate | null;
} & WithEvents<{
    select(date: Temporal.PlainDate, event: Event): void;
    hover?(date: Temporal.PlainDate): void;
    viewChange?(date: Temporal.PlainDate): void;
  }>;
function keyOf(date: Temporal.PlainDate) {
  return date.toString();
}
function selected(
  date: Temporal.PlainDate,
  value?: Temporal.PlainDate | null,
  start?: Temporal.PlainDate | null,
  end?: Temporal.PlainDate | null,
) {
  return (
    sameDate(date, value ?? null) ||
    (!!start && sameDate(date, start)) ||
    (!!end && sameDate(date, end))
  );
}
function localeName(locale?: string) {
  try {
    return Intl.getCanonicalLocales(locale ?? 'zh-CN')[0] ?? 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}
function monthText(date: Temporal.PlainDate, locale = 'zh-CN') {
  return date.toLocaleString(localeName(locale), { year: 'numeric', month: 'long' });
}
function weekdayText(index: number, locale = 'zh-CN') {
  return Temporal.PlainDate.from('2024-01-01')
    .add({ days: index })
    .toLocaleString(localeName(locale), { weekday: 'short' });
}
function monthAllowed(
  date: Temporal.PlainDate,
  offset: number,
  min?: Temporal.PlainDate,
  max?: Temporal.PlainDate,
) {
  const month = date.add({ months: offset }).with({ day: 1 });
  return (
    month.year >= 1 &&
    month.year <= 9999 &&
    (!min || Temporal.PlainDate.compare(month, min.with({ day: 1 })) >= 0) &&
    (!max || Temporal.PlainDate.compare(month, max.with({ day: 1 })) <= 0)
  );
}
function allowed(
  date: Temporal.PlainDate,
  min?: Temporal.PlainDate,
  max?: Temporal.PlainDate,
  disabled?: CalendarProps['disabledDate'],
) {
  return dateAllowed(date, { minDate: min, maxDate: max, disabledDate: disabled });
}
function bounded(date: Temporal.PlainDate, props: DateLimits) {
  return clampDate(date, props);
}
export function CalendarPanel(props: CalendarProps) {
  const today = Temporal.Now.plainDateISO(),
    initial =
      props.hideOutside && props.viewDate
        ? props.viewDate
        : bounded(normalizeDate(props.value) ?? normalizeDate(props.viewDate) ?? today, props);
  const state = vm<{
    view: Temporal.PlainDate;
    cursor: Temporal.PlainDate;
    weeks: {
      key: string;
      days: { key: string; date: Temporal.PlainDate; disabled: boolean; outside: boolean }[];
    }[];
    weekdays: { key: number; index: number }[];
  }>({ view: initial.with({ day: 1 }), cursor: initial, weeks: [], weekdays: [] });
  const root = ref<HTMLDivElement>(),
    id = `ja-calendar-${uid()}`;
  let frame = 0,
    disposed = false;
  function build() {
    const start = (props.weekStartsOn ?? 1) % 7;
    const offset = ((state.view.dayOfWeek % 7) - start + 7) % 7;
    const first = state.view.subtract({ days: offset }),
      days = Array.from({ length: 42 }, (_, index) => {
        const date = first.add({ days: index });
        return {
          key: keyOf(date),
          date,
          disabled: !dateAllowed(date, props),
          outside: date.month !== state.view.month,
        };
      });
    state.weeks = Array.from({ length: 6 }, (_, index) => ({
      key: days[index * 7].key,
      days: days.slice(index * 7, index * 7 + 7),
    }));
    state.weekdays = Array.from({ length: 7 }, (_, index) => ({
      key: index,
      index: (start + index + 6) % 7,
    }));
    if (!days.some((day) => sameDate(day.date, state.cursor) && !day.disabled)) {
      const first =
        days.find((day) => !day.disabled && !day.outside) ?? days.find((day) => !day.disabled);
      if (first) state.cursor = first.date;
    }
  }
  function focusCursor() {
    const target = () => document.getElementById(`${id}-${keyOf(state.cursor)}`);
    const existing = target();
    if (existing) {
      existing.focus({ preventScroll: true });
      return;
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) target()?.focus({ preventScroll: true });
    });
  }
  function move(date: Temporal.PlainDate, focus: boolean, notify = true) {
    if (date.year < 1 || date.year > 9999) return;
    const keepFocus =
      root.value?.contains(document.activeElement) &&
      document.activeElement?.classList.contains('ja-calendar-day');
    state.view = date.with({ day: 1 });
    state.cursor = date;
    build();
    if (notify) props['on:viewChange']?.(state.view);
    if (focus || keepFocus) focusCursor();
  }
  function navigate(event: KeyboardEvent, date: Temporal.PlainDate) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (dateAllowed(date, props)) props['on:select'](date, event);
      return;
    }
    let target: Temporal.PlainDate,
      direction = 1;
    const start = (props.weekStartsOn ?? 1) % 7,
      weekday = date.dayOfWeek % 7;
    switch (event.key) {
      case 'ArrowRight':
        target = date.add({ days: 1 });
        break;
      case 'ArrowLeft':
        target = date.subtract({ days: 1 });
        direction = -1;
        break;
      case 'ArrowDown':
        target = date.add({ days: 7 });
        break;
      case 'ArrowUp':
        target = date.subtract({ days: 7 });
        direction = -1;
        break;
      case 'Home':
        target = date.subtract({ days: (weekday - start + 7) % 7 });
        break;
      case 'End':
        target = date.add({ days: 6 - ((weekday - start + 7) % 7) });
        direction = -1;
        break;
      case 'PageDown':
        target = date.add(event.shiftKey ? { years: 1 } : { months: 1 });
        break;
      case 'PageUp':
        target = date.subtract(event.shiftKey ? { years: 1 } : { months: 1 });
        direction = -1;
        break;
      default:
        return;
    }
    event.preventDefault();
    // Bound the search when every date is disabled; keyboard input must not hang.
    for (
      let attempt = 0;
      attempt < (event.key === 'Home' || event.key === 'End' ? 7 : 366);
      attempt++
    ) {
      if (dateAllowed(target, props)) {
        move(target, true);
        return;
      }
      target = target.add({ days: direction });
    }
  }
  watch(props, 'value', (date) => {
    if (date) move(bounded(date, props), false, false);
    else build();
  });
  watch(props, 'viewDate', (date) => {
    if (date) move(props.hideOutside ? date : bounded(date, props), false, false);
  });
  watch(props, 'minDate', () => {
    if (props.hideOutside) build();
    else move(bounded(state.cursor, props), false, false);
  });
  watch(props, 'maxDate', () => {
    if (props.hideOutside) build();
    else move(bounded(state.cursor, props), false, false);
  });
  watch(props, 'disabledDate', build);
  watch(props, 'weekStartsOn', build);
  build();
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
  });
  return (
    <div className="ja-calendar" ref={root}>
      <div className="ja-calendar-header">
        <button
          type="button"
          aria-label="上个月"
          disabled={!monthAllowed(state.view, -1, props.minDate, props.maxDate)}
          on:click={() => move(state.view.subtract({ months: 1 }), false)}
        >
          ‹
        </button>
        <span className="ja-calendar-heading" aria-live="polite">
          {monthText(state.view, props.locale)}
        </span>
        <button
          type="button"
          aria-label="下个月"
          disabled={!monthAllowed(state.view, 1, props.minDate, props.maxDate)}
          on:click={() => move(state.view.add({ months: 1 }), false)}
        >
          ›
        </button>
      </div>
      <div className="ja-calendar-controls">
        <input
          type="number"
          min={1}
          max={9999}
          aria-label="选择年份"
          value={state.view.year}
          on:keyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
          on:change={(event) => {
            const input = event.target as HTMLInputElement,
              year = Number(input.value);
            if (Number.isInteger(year) && year >= 1 && year <= 9999)
              move(bounded(state.view.with({ year }), props), false);
            else input.value = `${state.view.year}`;
          }}
        />
        <select
          aria-label="选择月份"
          value={`${state.view.month}`}
          on:change={(event) =>
            move(
              bounded(
                state.view.with({ month: Number((event.target as HTMLSelectElement).value) }),
                props,
              ),
              false,
            )
          }
        >
          <For loop={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}>
            {(each) => <option value={`${each.data}`}>{each.data} 月</option>}
          </For>
        </select>
      </div>
      <table role="grid" aria-label={props.ariaLabel ?? '日历'} className="ja-calendar-grid">
        <thead>
          <tr>
            <For loop={state.weekdays} key="key">
              {(each) => <th scope="col">{weekdayText(each.data.index, props.locale)}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For loop={state.weeks} key="key">
            {(week) => (
              <tr>
                <For loop={week.data.days} key="key">
                  {(day) => (
                    <td
                      role="gridcell"
                      aria-selected={selected(
                        day.data.date,
                        props.value,
                        props.rangeStart,
                        props.rangeEnd,
                      )}
                      className={cx(
                        day.data.outside && 'outside',
                        selected(day.data.date, props.value, props.rangeStart, props.rangeEnd) &&
                          'selected',
                        inRange(day.data.date, props.rangeStart, props.rangeEnd) && 'in-range',
                      )}
                    >
                      <button
                        type="button"
                        className="ja-calendar-day"
                        id={`${id}-${day.data.key}`}
                        aria-label={day.data.key}
                        aria-current={sameDate(day.data.date, today) ? 'date' : undefined}
                        hidden={props.hideOutside && day.data.outside}
                        data-picker-focus={
                          sameDate(day.data.date, state.cursor) &&
                          !day.data.disabled &&
                          !(props.hideOutside && day.data.outside)
                            ? 'true'
                            : undefined
                        }
                        tabIndex={
                          sameDate(day.data.date, state.cursor) && !day.data.disabled ? 0 : -1
                        }
                        disabled={day.data.disabled}
                        on:focus={() => {
                          state.cursor = day.data.date;
                        }}
                        on:mouseEnter={() => props['on:hover']?.(day.data.date)}
                        on:keyDown={(event) => navigate(event, day.data.date)}
                        on:click={(event) => props['on:select'](day.data.date, event)}
                      >
                        {day.data.date.day}
                      </button>
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <div className="ja-calendar-footer">
        <button
          type="button"
          disabled={!allowed(today, props.minDate, props.maxDate, props.disabledDate)}
          on:click={(event) => props['on:select'](Temporal.Now.plainDateISO(), event)}
        >
          今天
        </button>
      </div>
    </div>
  );
}
