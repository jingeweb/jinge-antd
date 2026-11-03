import {
  type WithEvents,
  type WithExpose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  vm,
  watch,
} from 'jinge';

export type CheckableHandle = { focus(options?: FocusOptions): void; blur(): void };
export type CheckableProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string | number;
  form?: string;
  required?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: string;
} & WithEvents<{
  change?(checked: boolean, event: Event): void;
  focus?(event: FocusEvent): void;
  blur?(event: FocusEvent): void;
}> &
  WithExpose<CheckableHandle>;

export function checkableLabel(label: string | undefined) {
  return label ?? '';
}

// The native control remains the single focus and form target in Checkbox, Radio and Switch.
export function useChecked(
  props: CheckableProps & { indeterminate?: boolean },
  blocked: () => boolean = () => false,
  enter = false,
) {
  const controlled = props.checked !== undefined;
  const initial = !!props.defaultChecked;
  const state = vm({ checked: controlled ? !!props.checked : initial });
  const element = ref<HTMLInputElement>();
  let frame = 0,
    resetFrame = 0,
    disposed = false;
  let ownerForm: HTMLFormElement | null | undefined, stopReset: (() => void) | undefined;
  function sync() {
    if (!element.value || disposed) return;
    element.value.checked = state.checked;
    element.value.indeterminate = !!props.indeterminate;
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
            state.checked = controlled ? !!props.checked : initial;
            sync();
          });
        })
      : undefined;
  }
  function settle() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (controlled) state.checked = !!props.checked;
      sync();
      bindForm();
    });
  }
  watch(props, 'checked', (checked) => {
    if (controlled) {
      state.checked = !!checked;
      sync();
    }
  });
  watch(props, 'indeterminate', sync);
  watch(props, 'form', settle);
  onMount(() => {
    const input = element.value!;
    input.defaultChecked = state.checked;
    sync();
    bindForm();
    const stops = [
      registerEvent(input, 'click', (event) => {
        if (props.disabled || blocked()) event.preventDefault();
      }),
      registerEvent(input, 'change', (event) => {
        if (props.disabled || blocked()) {
          sync();
          return;
        }
        const next = input.checked;
        if (!controlled) state.checked = next;
        props['on:change']?.(next, event);
        settle();
      }),
      registerEvent(input, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(input, 'blur', (event) => props['on:blur']?.(event)),
      registerEvent(input, 'keydown', (event) => {
        if (enter && event.key === 'Enter' && !event.isComposing && !props.disabled && !blocked()) {
          event.preventDefault();
          input.click();
        }
      }),
    ];
    if (props.autoFocus && !props.disabled && !blocked()) input.focus();
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
  return { state, element };
}
