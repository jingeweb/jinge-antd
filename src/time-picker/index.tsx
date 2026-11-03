import '../date-picker/style.scss';
import { For, vm, watch } from 'jinge';

import type { TimePickerProps } from '../date-picker/common';

import { formatTime, normalizeTime, parseTime } from '../date-picker/temporal';
import { usePicker } from '../date-picker/use-picker';
import { PickerView } from '../date-picker/view';
import './style.scss';
export type { TimePickerProps } from '../date-picker/common';
export type { TimeFormat } from '../date-picker/temporal';
function pad(value: number) {
  return `${value}`.padStart(2, '0');
}
function step(value: number | undefined, max: number) {
  return value && Number.isInteger(value) && value >= 1 && value <= max ? value : 1;
}
function normalize(value: Temporal.PlainTime | null | undefined, props: TimePickerProps) {
  const time = normalizeTime(value);
  return props.format === 'HH:mm' && time ? time.with({ second: 0 }) : time;
}
function allowed(value: Temporal.PlainTime, props: TimePickerProps) {
  return (
    value.hour % step(props.hourStep, 24) === 0 &&
    value.minute % step(props.minuteStep, 60) === 0 &&
    value.second % step(props.secondStep, 60) === 0 &&
    !props.disabledHours?.().includes(value.hour) &&
    !props.disabledMinutes?.(value.hour).includes(value.minute) &&
    !props.disabledSeconds?.(value.hour, value.minute).includes(value.second) &&
    !props.disabledTime?.(value)
  );
}
function equal(a: Temporal.PlainTime | null, b: Temporal.PlainTime | null) {
  return a === b || (!!a && !!b && a.equals(b));
}
function TimePanel(props: {
  config: TimePickerProps;
  value: Temporal.PlainTime | null;
  choose(value: Temporal.PlainTime, event: Event): void;
}) {
  const config = props.config;
  const state = vm<{
    time: Temporal.PlainTime;
    hours: { key: number; disabled: boolean }[];
    minutes: { key: number; disabled: boolean }[];
    seconds: { key: number; disabled: boolean }[];
    valid: boolean;
  }>({
    time: props.value ?? Temporal.PlainTime.from('00:00'),
    hours: [],
    minutes: [],
    seconds: [],
    valid: false,
  });
  const now = normalize(Temporal.Now.plainTimeISO(), config)!;
  function options(
    max: number,
    increment: number | undefined,
    current: number,
    disabled: number[],
  ) {
    const interval = step(increment, max),
      values = Array.from({ length: Math.ceil(max / interval) }, (_, index) => index * interval);
    if (!values.includes(current)) values.push(current);
    return values
      .sort((a, b) => a - b)
      .map((key) => ({ key, disabled: key % interval !== 0 || disabled.includes(key) }));
  }
  function build() {
    state.hours = options(24, config.hourStep, state.time.hour, config.disabledHours?.() ?? []);
    state.minutes = options(
      60,
      config.minuteStep,
      state.time.minute,
      config.disabledMinutes?.(state.time.hour) ?? [],
    );
    state.seconds = options(
      60,
      config.secondStep,
      state.time.second,
      config.disabledSeconds?.(state.time.hour, state.time.minute) ?? [],
    );
    state.valid = allowed(state.time, config);
  }
  function change(field: 'hour' | 'minute' | 'second', event: Event) {
    state.time = state.time.with({ [field]: Number((event.target as HTMLSelectElement).value) });
    build();
  }
  watch(props, 'value', (value) => {
    state.time = value ?? Temporal.PlainTime.from('00:00');
    build();
  });
  watch(config, build);
  build();
  return (
    <div className="ja-time-panel">
      <div className="ja-time-columns">
        <label>
          时
          <select
            aria-label="小时"
            data-picker-focus="true"
            value={`${state.time.hour}`}
            on:change={(event) => change('hour', event)}
          >
            <For loop={state.hours} key="key">
              {(each) => (
                <option value={`${each.data.key}`} disabled={each.data.disabled}>
                  {pad(each.data.key)}
                </option>
              )}
            </For>
          </select>
        </label>
        <label>
          分
          <select
            aria-label="分钟"
            value={`${state.time.minute}`}
            on:change={(event) => change('minute', event)}
          >
            <For loop={state.minutes} key="key">
              {(each) => (
                <option value={`${each.data.key}`} disabled={each.data.disabled}>
                  {pad(each.data.key)}
                </option>
              )}
            </For>
          </select>
        </label>
        {config.format !== 'HH:mm' && (
          <label>
            秒
            <select
              aria-label="秒钟"
              value={`${state.time.second}`}
              on:change={(event) => change('second', event)}
            >
              <For loop={state.seconds} key="key">
                {(each) => (
                  <option value={`${each.data.key}`} disabled={each.data.disabled}>
                    {pad(each.data.key)}
                  </option>
                )}
              </For>
            </select>
          </label>
        )}
      </div>
      {!state.valid && <span role="status">当前时间不可选，请调整</span>}
      <div className="ja-time-actions">
        <button
          type="button"
          disabled={!allowed(now, config)}
          on:click={(event) => props.choose(normalize(Temporal.Now.plainTimeISO(), config)!, event)}
        >
          此刻
        </button>
        <button
          type="button"
          disabled={!state.valid}
          on:click={(event) => props.choose(state.time, event)}
        >
          确定
        </button>
      </div>
    </div>
  );
}
export function TimePicker(props: TimePickerProps) {
  const control = usePicker(props, {
    normalize: (value) => normalize(value, props),
    format: (value) => formatTime(value, props.format),
    parse: (text) => parseTime(text, props.format),
    equal,
    allowed: (value) => allowed(value, props),
    serialize: (value) => value.toString({ smallestUnit: 'second' }),
  });
  const state = control.state;
  watch(props, 'format', () => control.sync());
  watch(props, 'hourStep', control.validity);
  watch(props, 'minuteStep', control.validity);
  watch(props, 'secondStep', control.validity);
  watch(props, 'disabledHours', control.validity);
  watch(props, 'disabledMinutes', control.validity);
  watch(props, 'disabledSeconds', control.validity);
  watch(props, 'disabledTime', control.validity);
  return (
    <PickerView
      config={props}
      control={control}
      kind="time"
      slot:panel={
        <TimePanel
          config={props}
          value={state.value}
          choose={(value, event) => control.choose(value, event)}
        />
      }
    />
  );
}
