import { expose, onMount, onUnmount, ref, registerEvent, uid, vm, watch } from 'jinge';

import type { PickerCodec, PickerProps } from './common';

import { z } from '../_util/z';
import { temporalSupported } from './temporal';
export function usePicker<T>(props: PickerProps<T>, codec: PickerCodec<T>) {
  const controlled = props.value !== undefined,
    controlledOpen = props.open !== undefined;
  const initial = codec.normalize(props.defaultValue),
    value = codec.normalize(controlled ? props.value : initial);
  const supported = temporalSupported(),
    id = `ja-picker-${uid()}`,
    layer = z.getDropdownZ();
  const state = vm<{ value: T | null; text: string; open: boolean; invalid: boolean }>({
    value,
    text: codec.format(value),
    open: supported && !props.disabled && !props.readOnly && !!(props.open ?? props.defaultOpen),
    invalid: false,
  });
  const input = ref<HTMLInputElement>(),
    root = ref<HTMLSpanElement>(),
    popup = ref<HTMLDivElement>();
  let disposed = false,
    frame = 0,
    focusFrame = 0,
    blurFrame = 0,
    resetFrame = 0,
    revision = 0,
    pending = false,
    pendingValue: T | null = null,
    pendingRevision = 0,
    composing = false;
  let stopReset: (() => void) | undefined;
  function focus(options?: FocusOptions) {
    input.value?.focus(options);
  }
  function validity() {
    const value = state.text ? codec.parse(state.text) : null;
    state.invalid = !!state.text && (!value || !codec.allowed(value));
    input.value?.setCustomValidity(state.invalid ? '请输入有效且可选的值' : '');
  }
  function sync(resetText = true) {
    const value = codec.normalize(controlled ? props.value : state.value);
    if (!codec.equal(value, state.value)) state.value = value;
    if (resetText) {
      state.text = codec.format(state.value);
      validity();
    }
  }
  watch(props, 'value', () => sync(!(pending && revision !== pendingRevision)), { deep: true });
  function setOpen(open: boolean, event?: Event) {
    if (open && (!supported || props.disabled || props.readOnly)) return;
    if (state.open === open) return;
    if (!controlledOpen) state.open = open;
    props['on:openChange']?.(open, event);
  }
  function cancel() {
    state.text = codec.format(state.value);
    validity();
  }
  function commit(value: T | null, event: Event) {
    if (props.disabled || props.readOnly || (value && !codec.allowed(value))) return false;
    if (codec.equal(value, state.value) || (pending && codec.equal(value, pendingValue)))
      return true;
    pending = true;
    pendingValue = value;
    pendingRevision = revision;
    if (!controlled) state.value = value;
    state.text = codec.format(value);
    validity();
    try {
      props['on:change']?.(value, event);
    } finally {
      cancelAnimationFrame(frame);
      const committedRevision = revision;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!disposed) {
          sync(revision === committedRevision);
          pending = false;
        }
      });
    }
    return true;
  }
  function commitText(event: Event) {
    validity();
    if (state.invalid) return false;
    return commit(state.text ? codec.parse(state.text) : null, event);
  }
  function request(open: boolean, event?: Event) {
    if (!open) {
      if (event?.type === 'keydown' && (event as KeyboardEvent).key === 'Escape') {
        cancel();
        focus({ preventScroll: true });
      } else if (event) commitText(event);
    }
    setOpen(open, event);
  }
  function choose(value: T | null, event: Event, close = true) {
    if (!commit(value, event)) return;
    if (close) {
      focus({ preventScroll: true });
      setOpen(false, event);
    }
  }
  function focusPanel() {
    cancelAnimationFrame(focusFrame);
    focusFrame = requestAnimationFrame(() => {
      focusFrame = 0;
      if (!disposed && state.open)
        (
          popup.value?.querySelector<HTMLElement>('[data-picker-focus="true"]') ??
          popup.value?.querySelector<HTMLElement>('button:not(:disabled), select:not(:disabled)')
        )?.focus({ preventScroll: true });
    });
  }
  function inputKey(event: KeyboardEvent) {
    if (composing || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      request(true, event);
      focusPanel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (commitText(event)) setOpen(false, event);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      setOpen(false, event);
    }
  }
  function blur(event: FocusEvent) {
    cancelAnimationFrame(blurFrame);
    blurFrame = requestAnimationFrame(() => {
      blurFrame = 0;
      if (
        disposed ||
        root.value?.contains(document.activeElement) ||
        popup.value?.contains(document.activeElement)
      )
        return;
      commitText(event);
      setOpen(false, event);
      props['on:blur']?.(event);
    });
  }
  function popupKey(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const nodes = [
      ...popup.value!.querySelectorAll<HTMLElement>(
        'button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex="0"]',
      ),
    ].filter((el) => el.tabIndex >= 0 && !el.closest('[hidden]'));
    if (
      (!event.shiftKey && document.activeElement === nodes.at(-1)) ||
      (event.shiftKey && document.activeElement === nodes[0])
    ) {
      focus({ preventScroll: true });
      setOpen(false, event);
    }
  }
  watch(props, 'open', () => {
    if (controlledOpen)
      state.open = supported && !props.disabled && !props.readOnly && !!props.open;
  });
  function disable() {
    if (props.disabled || props.readOnly) {
      cancel();
      if (state.open) {
        state.open = false;
        props['on:openChange']?.(false);
      }
    }
  }
  watch(props, 'disabled', disable);
  watch(props, 'readOnly', disable);
  onMount(() => {
    input.value!.setAttribute('autocomplete', 'off');
    validity();
    const stops = [
      registerEvent(root.value!, 'focusout', blur),
      registerEvent(input.value!, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(input.value!, 'compositionstart', () => {
        composing = true;
      }),
      registerEvent(input.value!, 'compositionend', () => {
        composing = false;
      }),
    ];
    const form = input.value!.form;
    if (form)
      stopReset = registerEvent(form, 'reset', (event) => {
        cancelAnimationFrame(resetFrame);
        resetFrame = requestAnimationFrame(() => {
          resetFrame = 0;
          if (disposed || event.defaultPrevented) return;
          if (!controlled) state.value = initial;
          sync();
          state.open = false;
        });
      });
    if (props.autoFocus && !props.disabled) focus();
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    for (const timer of [frame, focusFrame, blurFrame, resetFrame]) cancelAnimationFrame(timer);
    stopReset?.();
  });
  expose({ focus, blur: () => input.value?.blur(), select: () => input.value?.select() });
  return {
    state,
    input,
    root,
    popup,
    id,
    layer,
    supported,
    codec,
    focus,
    focusPanel,
    choose,
    request,
    blur,
    popupKey,
    inputKey,
    cancel,
    sync,
    validity,
    edit: (event: Event) => {
      revision++;
      state.text = (event.target as HTMLInputElement).value;
      validity();
    },
  };
}
export type PickerControl<T> = ReturnType<typeof usePicker<T>>;
