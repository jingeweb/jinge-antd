import './style.scss';
import {
  type WithEvents,
  type WithExpose,
  cx,
  expose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  vm,
  watch,
} from 'jinge';

import type { InputHandle, TextControlProps } from './common';

export type InputNumberProps = Omit<
  TextControlProps,
  | 'value'
  | 'defaultValue'
  | 'maxLength'
  | 'minLength'
  | 'allowClear'
  | 'clearLabel'
  | 'showCount'
  | 'on:change'
  | 'on:clear'
> & {
  value?: number | null;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  keyboard?: boolean;
  controls?: boolean;
} & WithEvents<{ change?(value: number | undefined, event: Event): void }> &
  WithExpose<InputHandle>;

function finite(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
function numericText(value: number | undefined) {
  return value === undefined ? '' : String(value);
}
function decimalPlaces(value: number) {
  const [digits, exponent = '0'] = String(value).toLowerCase().split('e');
  return Math.max(0, (digits.split('.')[1]?.length ?? 0) - Number(exponent));
}
function round(value: number, places: number) {
  const factor = 10 ** places;
  if (!Number.isSafeInteger(Math.trunc(value * factor))) return value;
  return (
    (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON * Math.abs(value)) * factor)) /
    factor
  );
}

export function InputNumber(props: InputNumberProps) {
  const controlled = props.value !== undefined;
  const initial = finite(props.defaultValue);
  const state = vm({
    value: numericText(controlled ? finite(props.value) : initial),
    numeric: controlled ? finite(props.value) : initial,
  });
  const element = ref<HTMLInputElement>();
  let lastPublished = state.numeric;
  let disposed = false,
    editing = false,
    frame = 0,
    resetFrame = 0;
  let ownerForm: HTMLFormElement | null | undefined;
  let stopReset: (() => void) | undefined;
  function setValue(value: number | undefined) {
    state.numeric = value;
    state.value = numericText(value);
    if (element.value && element.value.value !== state.value) element.value.value = state.value;
  }
  function precision() {
    return Number.isFinite(props.precision)
      ? Math.max(0, Math.min(15, Math.floor(props.precision!)))
      : undefined;
  }
  function normalize(value: number) {
    const places = precision();
    let next = places === undefined ? value : round(value, places);
    const min = finite(props.min),
      max = finite(props.max);
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  }
  function publish(value: number | undefined, event: Event) {
    if (Object.is(value, lastPublished)) return;
    lastPublished = value;
    props['on:change']?.(value, event);
  }
  function settle() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (controlled) {
        setValue(finite(props.value));
        lastPublished = state.numeric;
      }
      bindForm();
    });
  }
  function commit(event: Event) {
    if (props.disabled || props.readOnly) return;
    const field = element.value!;
    // Native number inputs distinguish a genuinely empty field from an incomplete '-' or '1e'.
    const next = field.validity.badInput
      ? state.numeric
      : field.value === ''
        ? undefined
        : finite(Number(field.value));
    const normalized = next === undefined ? undefined : normalize(next);
    editing = false;
    setValue(normalized);
    publish(normalized, event);
    settle();
  }
  function stepBy(direction: 1 | -1, event: Event) {
    if (props.disabled || props.readOnly) return;
    const step = finite(props.step);
    const offset = step !== undefined && step > 0 ? step : 1;
    const current = state.numeric ?? 0;
    const places =
      precision() ?? Math.min(15, Math.max(decimalPlaces(current), decimalPlaces(offset)));
    const candidate = round(current + direction * offset, places);
    if (!Number.isFinite(candidate)) return;
    const next = normalize(candidate);
    // Do not move a valid value past a bound; an external out-of-range value may move into range.
    setValue(next);
    editing = false;
    publish(next, event);
    settle();
  }
  function bindForm() {
    const form = element.value?.form;
    if (form === ownerForm) return;
    stopReset?.();
    ownerForm = form;
    stopReset = form
      ? registerEvent(form, 'reset', (event) => {
          cancelAnimationFrame(resetFrame);
          resetFrame = requestAnimationFrame(() => {
            resetFrame = 0;
            if (disposed || event.defaultPrevented) return;
            editing = false;
            setValue(controlled ? finite(props.value) : initial);
            lastPublished = state.numeric;
          });
        })
      : undefined;
  }
  function syncAutoComplete() {
    if (!element.value || disposed) return;
    if (props.autoComplete === undefined) element.value.removeAttribute('autocomplete');
    else element.value.setAttribute('autocomplete', props.autoComplete);
  }
  watch(props, 'value', (value) => {
    if (!controlled || disposed) return;
    const next = finite(value);
    // An accepted numeric value must not erase a trailing decimal/zero while editing.
    if (!editing || next !== state.numeric) setValue(next);
    lastPublished = next;
  });
  watch(props, 'autoComplete', syncAutoComplete);
  watch(props, 'form', settle);
  onMount(() => {
    const field = element.value!;
    field.defaultValue = state.value;
    syncAutoComplete();
    bindForm();
    const stops = [
      registerEvent(field, 'input', (event) => {
        if (props.disabled || props.readOnly) {
          field.value = state.value;
          return;
        }
        cancelAnimationFrame(frame);
        frame = 0;
        editing = true;
        props['on:input']?.(event);
        if (field.validity.badInput) return;
        state.value = field.value;
        const next = field.value === '' ? undefined : finite(Number(field.value));
        state.numeric = next;
        publish(next, event);
      }),
      registerEvent(field, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(field, 'blur', (event) => {
        commit(event);
        props['on:blur']?.(event);
      }),
      registerEvent(field, 'keydown', (event) => {
        if (props.disabled || props.readOnly || event.isComposing || event.keyCode === 229) return;
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          if (props.keyboard !== false) stepBy(event.key === 'ArrowUp' ? 1 : -1, event);
        } else if (event.key === 'Enter') {
          commit(event);
          props['on:pressEnter']?.(event);
        }
      }),
    ];
    if (props.autoFocus && !props.disabled) field.focus();
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resetFrame);
    stopReset?.();
  });
  expose({
    focus: (options?: FocusOptions) => element.value?.focus(options),
    blur: () => element.value?.blur(),
    select: () => element.value?.select(),
  });
  return (
    <span
      className={cx(
        'ja-input-field ja-input-number-field',
        props.size ?? 'md',
        props.status,
        props.disabled && 'disabled',
        props.noRoundedL && 'no-rounded-l',
        props.noRoundedR && 'no-rounded-r',
        props.className,
      )}
      style={props.style}
    >
      <input
        ref={element}
        type="number"
        className="ja-input ja-input-number"
        value={state.value}
        id={props.id}
        name={props.name}
        form={props.form}
        placeholder={props.placeholder}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        tabIndex={props.tabIndex}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        aria-label={props.ariaLabel}
        aria-labelledby={props.ariaLabelledby}
        aria-describedby={props.ariaDescribedby}
        aria-invalid={props.ariaInvalid ?? (props.status === 'error' ? true : undefined)}
      />
      {props.controls !== false && (
        <span className="ja-input-number-controls">
          <button
            type="button"
            aria-label="增加数值"
            disabled={
              props.disabled ||
              props.readOnly ||
              (props.max !== undefined && state.numeric !== undefined && state.numeric >= props.max)
            }
            on:mouseDown={(event) => event.preventDefault()}
            on:click={(event) => stepBy(1, event)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="减少数值"
            disabled={
              props.disabled ||
              props.readOnly ||
              (props.min !== undefined && state.numeric !== undefined && state.numeric <= props.min)
            }
            on:mouseDown={(event) => event.preventDefault()}
            on:click={(event) => stepBy(-1, event)}
          >
            −
          </button>
        </span>
      )}
    </span>
  );
}
