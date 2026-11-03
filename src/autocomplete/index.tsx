import '../select/style.scss';
import {
  type JNode,
  type WithEvents,
  type WithExpose,
  type WithSlots,
  cx,
  expose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  vm,
  watch,
} from 'jinge';

import { z } from '../_util/z';
import { Floating } from '../floating';
import { type ComboBase, type ComboHandle, type SelectOption } from '../select/common';
import { ComboList } from '../select/popup';
import { useCombo } from '../select/use-combo';
export type AutoCompleteOption = SelectOption<string>;
export type AutoCompleteHandle = ComboHandle & { select(): void };
export type AutoCompleteProps = Omit<ComboBase<string>, 'showSearch'> & {
  value?: string | null;
  defaultValue?: string;
  readOnly?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
} & WithExpose<AutoCompleteHandle> &
  WithSlots<{ option?: (props: { option: AutoCompleteOption }) => JNode }> &
  WithEvents<{
    change?(value: string, event: Event): void;
    select?(value: string, option: AutoCompleteOption, event: Event): void;
    pressEnter?(event: KeyboardEvent): void;
  }>;
export function AutoComplete(props: AutoCompleteProps) {
  const controlled = props.value !== undefined,
    initial = props.defaultValue ?? '';
  const state = vm({ value: controlled ? (props.value ?? '') : initial, invalid: false });
  const element = ref<HTMLInputElement>();
  let disposed = false,
    composing = false,
    commitText: string | undefined,
    frame = 0,
    resetFrame = 0;
  let ownerForm: HTMLFormElement | null | undefined, stopReset: (() => void) | undefined;
  function focus(options?: FocusOptions) {
    element.value?.focus(options);
  }
  function setText(value: string) {
    state.value = value;
    if (value) state.invalid = false;
    if (element.value && element.value.value !== value) element.value.value = value;
  }
  function choose(option: AutoCompleteOption, event: Event) {
    if (props.disabled || props.readOnly || props.loading || option.disabled) return;
    publish(option.value, event, false);
    props['on:select']?.(option.value, option, event);
    popup.request(false, event);
    focus();
  }
  const popup = useCombo(props, () => [state.value], choose, true);
  const list = popup.state,
    layer = z.getDropdownZ();
  popup.query(state.value);
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
            composing = false;
            commitText = undefined;
            state.invalid = false;
            setText(controlled ? (props.value ?? '') : initial);
            popup.query(state.value);
            popup.request(false);
          });
        })
      : undefined;
  }
  function settle() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (controlled && !composing) {
        setText(props.value ?? '');
        popup.query(state.value);
      }
      bindForm();
    });
  }
  function publish(value: string, event: Event, search: boolean) {
    setText(value);
    popup.query(value);
    props['on:change']?.(value, event);
    if (search) props['on:search']?.(value, event);
    settle();
  }
  function handleInput(event: Event) {
    if (props.disabled || props.readOnly) {
      setText(state.value);
      return;
    }
    const value = element.value!.value;
    if (composing || (event as InputEvent).isComposing) {
      setText(value);
      return;
    }
    if (commitText !== undefined && commitText === value) {
      commitText = undefined;
      settle();
      return;
    }
    commitText = undefined;
    publish(value, event, true);
    popup.request(true, event);
  }
  function syncAutocomplete() {
    if (element.value && !disposed)
      element.value.setAttribute('autocomplete', props.autoComplete ?? 'off');
  }
  function clear(event: MouseEvent) {
    event.stopPropagation();
    if (props.disabled || props.readOnly) return;
    composing = false;
    commitText = undefined;
    publish('', event, true);
    focus();
  }
  watch(props, 'value', (value) => {
    if (controlled && !composing && !disposed) {
      if (commitText !== undefined) commitText = value ?? '';
      setText(value ?? '');
      popup.query(state.value);
    }
  });
  watch(props, 'autoComplete', syncAutocomplete);
  watch(props, 'form', settle);
  watch(props, 'readOnly', (readOnly) => {
    if (readOnly) {
      popup.request(false);
      list.open = false;
    }
  });
  onMount(() => {
    const input = element.value!;
    input.defaultValue = state.value;
    syncAutocomplete();
    bindForm();
    const stops = [
      registerEvent(input, 'input', handleInput),
      registerEvent(input, 'compositionstart', () => {
        if (!props.disabled && !props.readOnly) {
          composing = true;
          commitText = undefined;
        }
      }),
      registerEvent(input, 'compositionend', (event) => {
        if (!composing) return;
        composing = false;
        if (props.disabled || props.readOnly) {
          setText(controlled ? (props.value ?? '') : state.value);
          return;
        }
        commitText = input.value;
        publish(commitText, event, true);
        popup.request(true, event);
      }),
      registerEvent(input, 'keydown', (event) => {
        if (composing || event.isComposing || props.disabled || props.readOnly) return;
        popup.key(event);
        if (event.key === 'Enter' && event.keyCode !== 229) props['on:pressEnter']?.(event);
      }),
      registerEvent(input, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(input, 'blur', (event) => {
        if (controlled && !composing) setText(props.value ?? '');
        props['on:blur']?.(event);
      }),
      registerEvent(input, 'invalid', () => {
        state.invalid = true;
      }),
    ];
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
  expose({ focus, blur: () => element.value?.blur(), select: () => element.value?.select() });
  return (
    <Floating
      id={popup.id}
      role="listbox"
      ariaLabel={props.ariaLabel ?? '输入建议'}
      zIndex={layer}
      open={list.open}
      disabled={props.disabled || props.readOnly}
      triggerMethod="none"
      placement="bottom-start"
      offset={4}
      returnFocus={false}
      className={cx('ja-select-popup ja-autocomplete-popup', props.popupClassName)}
      style={`width:${list.width}px`}
      on:openChange={popup.request}
      slot:trigger={
        <span
          ref={popup.root}
          className={cx(
            'ja-select-field ja-autocomplete',
            props.size ?? 'md',
            props.status,
            state.invalid && 'error',
            props.disabled && 'disabled',
            props.className,
          )}
          style={props.style}
          on:click={(event) => {
            if (!props.disabled && !props.readOnly) {
              popup.request(true, event);
              focus();
            }
          }}
        >
          <input
            ref={element}
            type="text"
            role="combobox"
            className={cx('ja-select ja-select-search', props.triggerClassName)}
            value={state.value}
            id={props.id}
            name={props.name}
            form={props.form}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            maxLength={props.maxLength}
            minLength={props.minLength}
            tabIndex={props.tabIndex}
            aria-label={props.ariaLabel}
            aria-labelledby={props.ariaLabelledby}
            aria-describedby={props.ariaDescribedby}
            aria-invalid={
              props.ariaInvalid ?? (state.invalid || props.status === 'error' ? true : undefined)
            }
            aria-busy={props.loading}
            aria-autocomplete="list"
            aria-expanded={list.open && !props.readOnly}
            aria-controls={list.open && !props.readOnly ? popup.id : undefined}
            aria-activedescendant={
              list.open && !props.readOnly && list.active ? list.active : undefined
            }
          />
          {props.allowClear && state.value.length > 0 && !props.disabled && !props.readOnly && (
            <button
              type="button"
              className="ja-select-clear"
              aria-label={props.clearLabel ?? '清空输入'}
              on:mouseDown={(event) => event.preventDefault()}
              on:click={clear}
            >
              ×
            </button>
          )}
        </span>
      }
    >
      <ComboList
        state={list}
        values={[state.value]}
        loading={props.loading}
        loadingText={props.loadingText}
        emptyText={props.emptyText}
        slot:option={props['slot:option']}
        on:choose={choose}
      />
    </Floating>
  );
}
