import './style.scss';
import { For, cx, expose, onMount, onUnmount, ref, registerEvent, vm, watch } from 'jinge';

import { z } from '../_util/z';
import { Floating } from '../floating';
import { type SelectOption, type SelectProps, type SelectValue } from './common';
import { ComboList } from './popup';
import { useCombo } from './use-combo';
export type { SelectProps, SelectValue, SelectOption, ComboHandle } from './common';

function values<T extends SelectValue>(value: T | T[] | null | undefined, multiple: boolean): T[] {
  if (value === null || value === undefined) return [];
  return typeof value === 'string' || typeof value === 'number'
    ? [value]
    : [...new Set(value)].slice(0, multiple ? undefined : 1);
}
function display<T extends SelectValue>(
  selected: T[],
  options: SelectOption<T>[],
): SelectOption<T>[] {
  return selected.map(
    (value) => options.find((option) => option.value === value) ?? { value, label: String(value) },
  );
}
function limited<T>(items: T[], max?: number) {
  return max === undefined ? items : items.slice(0, Math.max(0, Math.floor(max)));
}
function fieldValue(value: SelectValue | undefined) {
  return value === undefined ? '' : String(value);
}

export function Select<T extends SelectValue>(props: SelectProps<T>) {
  const multiple = props.mode === 'multiple',
    searchable = props.showSearch ?? multiple,
    editable = searchable || multiple;
  const controlled = props.value !== undefined;
  const initial = values(props.defaultValue, multiple);
  const state = vm({
    values: values(controlled ? props.value : initial, multiple),
    display: [] as SelectOption<T>[],
    invalid: false,
  });
  const button = ref<HTMLButtonElement>(),
    input = ref<HTMLInputElement>(),
    validator = ref<HTMLSelectElement>();
  let disposed = false,
    frame = 0,
    resetFrame = 0,
    composing = false,
    compositionCommit: string | undefined;
  let ownerForm: HTMLFormElement | null | undefined, stopReset: (() => void) | undefined;
  function focus(options?: FocusOptions) {
    (input.value ?? button.value)?.focus(options);
  }
  function sync() {
    state.display = display(state.values, props.options);
    if (state.values.length) state.invalid = false;
    if (validator.value) validator.value.value = state.values.length ? 'chosen' : '';
  }
  function publish(next: T[], event: Event) {
    if (props.disabled) return;
    if (!controlled) {
      state.values = [...next];
      sync();
    }
    if (props.mode === 'multiple') props['on:change']?.([...next], event);
    else props['on:change']?.(next[0], event);
  }
  function choose(option: SelectOption<T>, event: Event) {
    if (props.disabled || props.loading || option.disabled) return;
    publish(
      multiple
        ? state.values.includes(option.value)
          ? state.values.filter((value) => value !== option.value)
          : [...state.values, option.value]
        : [option.value],
      event,
    );
    popup.query('');
    if (!multiple) popup.request(false, event);
    focus();
  }
  const popup = useCombo(props, () => state.values, choose, searchable);
  const list = popup.state;
  const layer = z.getDropdownZ();
  function remove(value: T, event: Event) {
    event.stopPropagation();
    if (props.disabled) return;
    publish(
      state.values.filter((item) => item !== value),
      event,
    );
    focus();
  }
  function bindForm() {
    const form = validator.value?.form;
    if (form === ownerForm) return;
    stopReset?.();
    ownerForm = form;
    stopReset = form
      ? registerEvent(form, 'reset', (event) => {
          cancelAnimationFrame(resetFrame);
          resetFrame = requestAnimationFrame(() => {
            resetFrame = 0;
            if (disposed || event.defaultPrevented) return;
            state.values = values(controlled ? props.value : initial, multiple);
            state.invalid = false;
            sync();
            popup.query('');
            popup.request(false);
          });
        })
      : undefined;
  }
  function clear(event: MouseEvent) {
    event.stopPropagation();
    if (props.disabled) return;
    publish([], event);
    popup.query('');
    focus();
  }
  function search(event: Event) {
    if (props.disabled) return;
    const value = input.value!.value;
    popup.query(value);
    popup.request(true, event);
    if (composing || (event as InputEvent).isComposing) return;
    if (compositionCommit !== undefined && compositionCommit === value) {
      compositionCommit = undefined;
      return;
    }
    compositionCommit = undefined;
    props['on:search']?.(value, event);
  }
  function key(event: KeyboardEvent) {
    if (composing || event.isComposing) return;
    if (
      multiple &&
      event.key === 'Backspace' &&
      !list.query &&
      state.values.length &&
      !props.disabled
    ) {
      event.preventDefault();
      remove(state.values.at(-1)!, event);
      return;
    }
    popup.key(event);
  }
  watch(
    props,
    'value',
    (value) => {
      if (controlled) {
        state.values = values(value, multiple);
        sync();
      }
    },
    { deep: true },
  );
  watch(props, 'options', sync, { deep: true });
  watch(props, 'form', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) bindForm();
    });
  });
  watch(popup.state, 'open', (open) => {
    if (!open) popup.query('');
  });
  sync();
  onMount(() => {
    sync();
    bindForm();
    const target = input.value ?? button.value!;
    const stops = [
      registerEvent(target, 'keydown', key),
      registerEvent(target, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(target, 'blur', (event) => props['on:blur']?.(event)),
      registerEvent(validator.value!, 'invalid', (event) => {
        event.preventDefault();
        state.invalid = true;
        focus();
      }),
    ];
    if (input.value) {
      input.value.setAttribute('autocomplete', 'off');
      stops.push(
        registerEvent(input.value, 'input', search),
        registerEvent(input.value, 'compositionstart', () => {
          composing = true;
          compositionCommit = undefined;
        }),
        registerEvent(input.value, 'compositionend', (event) => {
          if (!composing || props.disabled) return;
          composing = false;
          compositionCommit = input.value!.value;
          popup.query(compositionCommit);
          popup.request(true, event);
          props['on:search']?.(compositionCommit, event);
        }),
      );
    }
    if (props.autoFocus && !props.disabled) focus();
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
  expose({ focus, blur: () => (input.value ?? button.value)?.blur() });
  return (
    <>
      <Floating
        id={popup.id}
        role="listbox"
        ariaLabel={props.ariaLabel ?? '选项'}
        ariaMultiselectable={multiple}
        zIndex={layer}
        open={list.open}
        disabled={props.disabled}
        triggerMethod="none"
        placement="bottom-start"
        offset={4}
        returnFocus={false}
        className={cx('ja-select-popup ja-dropdown', props.popupClassName)}
        style={`width:${list.width}px`}
        on:openChange={popup.request}
        slot:trigger={
          <span
            ref={popup.root}
            className={cx(
              'ja-select-field',
              props.size ?? 'md',
              props.status,
              state.invalid && 'error',
              props.disabled && 'disabled',
              props.className,
            )}
            style={props.style}
            on:click={(event) => {
              if (!props.disabled) {
                popup.request(editable ? true : !list.open, event);
                focus();
              }
            }}
          >
            {editable ? (
              <input
                ref={input}
                className={cx('ja-select ja-select-search', props.triggerClassName)}
                role="combobox"
                id={props.id}
                value={list.query}
                placeholder={
                  multiple
                    ? props.placeholder
                    : (state.display[0]?.label ?? props.placeholder ?? '')
                }
                disabled={props.disabled}
                readOnly={!searchable}
                tabIndex={props.tabIndex}
                aria-label={props.ariaLabel}
                aria-labelledby={props.ariaLabelledby}
                aria-describedby={props.ariaDescribedby}
                aria-invalid={
                  props.ariaInvalid ??
                  (state.invalid || props.status === 'error' ? true : undefined)
                }
                aria-busy={props.loading}
                aria-required={props.required}
                aria-autocomplete={searchable ? 'list' : 'none'}
                aria-expanded={list.open}
                aria-controls={list.open ? popup.id : undefined}
                aria-activedescendant={list.open && list.active ? list.active : undefined}
              />
            ) : (
              <button
                ref={button}
                type="button"
                className={cx('ja-select', props.triggerClassName)}
                role="combobox"
                id={props.id}
                disabled={props.disabled}
                tabIndex={props.tabIndex}
                aria-label={props.ariaLabel}
                aria-labelledby={props.ariaLabelledby}
                aria-describedby={props.ariaDescribedby}
                aria-invalid={
                  props.ariaInvalid ??
                  (state.invalid || props.status === 'error' ? true : undefined)
                }
                aria-busy={props.loading}
                aria-required={props.required}
                aria-expanded={list.open}
                aria-controls={list.open ? popup.id : undefined}
                aria-activedescendant={list.open && list.active ? list.active : undefined}
              >
                {state.display.length ? (
                  <For loop={state.display} key="value">
                    {(each) => (
                      <span className="ja-select-value">
                        {props['slot:selection'] ? (
                          props['slot:selection']({ option: each.data })
                        ) : (
                          <span>{each.data.label}</span>
                        )}
                      </span>
                    )}
                  </For>
                ) : (
                  (props.placeholder ?? '')
                )}
              </button>
            )}
            {multiple && (
              <For
                loop={limited(
                  state.display,
                  props.mode === 'multiple' ? props.maxTagCount : undefined,
                )}
                key="value"
              >
                {(each) => (
                  <span className="ja-select-tag">
                    <span>
                      {props['slot:selection'] ? (
                        props['slot:selection']({ option: each.data })
                      ) : (
                        <span>{each.data.label}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={props.disabled}
                      aria-label={`移除 ${each.data.label}`}
                      on:mouseDown={(event) => event.preventDefault()}
                      on:click={(event) => remove(each.data.value, event)}
                    >
                      ×
                    </button>
                  </span>
                )}
              </For>
            )}
            {props.mode === 'multiple' &&
              props.maxTagCount !== undefined &&
              state.display.length > props.maxTagCount && (
                <span className="ja-select-tag ja-select-overflow">
                  +{state.display.length - Math.max(0, Math.floor(props.maxTagCount))}
                </span>
              )}
            {props.allowClear && state.values.length > 0 && !props.disabled && (
              <button
                type="button"
                className="ja-select-clear"
                aria-label={props.clearLabel ?? '清空选择'}
                on:mouseDown={(event) => event.preventDefault()}
                on:click={clear}
              >
                ×
              </button>
            )}
            <span
              className={cx('ja-select-arrow', props.loading && 'loading')}
              aria-hidden="true"
            />
          </span>
        }
      >
        <ComboList
          slot:option={props['slot:option']}
          state={list}
          values={state.values}
          loading={props.loading}
          loadingText={props.loadingText}
          emptyText={props.emptyText}
          on:choose={choose}
        />
      </Floating>
      <select
        ref={validator}
        className="ja-select-validator"
        aria-hidden="true"
        tabIndex={-1}
        required={props.required}
        disabled={props.disabled}
        form={props.form}
        value={state.values.length ? 'chosen' : ''}
      >
        <option value="" />
        <option value="chosen" />
      </select>
      {multiple ? (
        <For loop={state.values}>
          {(each) => (
            <input
              type="hidden"
              name={props.name}
              form={props.form}
              disabled={props.disabled}
              value={fieldValue(each.data)}
            />
          )}
        </For>
      ) : (
        <input
          type="hidden"
          name={props.name}
          form={props.form}
          disabled={props.disabled}
          value={fieldValue(state.values[0])}
        />
      )}
    </>
  );
}
