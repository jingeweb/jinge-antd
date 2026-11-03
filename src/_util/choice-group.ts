import {
  type JNode,
  type WithEvents,
  type WithPropSlot,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  vm,
  watch,
} from 'jinge';

export type ChoiceValue = string | number;
export type ChoiceOption<T extends ChoiceValue = ChoiceValue> = {
  value: T;
  disabled?: boolean;
  id?: string;
} & WithPropSlot<'label', JNode>;
export type ChoiceGroupBase<T extends ChoiceValue> = {
  options: ChoiceOption<T>[];
  name?: string;
  form?: string;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  legend?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  className?: string;
  style?: string;
};
export type SelectionProps<T> = {
  value?: T | null;
  defaultValue?: T;
  form?: string;
  disabled?: boolean;
} & WithEvents<{ change?(value: T, event: Event): void }>;

export function useChoiceGroup<T>(
  props: SelectionProps<T>,
  normalize: (value: T | null | undefined) => T,
) {
  const controlled = props.value !== undefined;
  const initial = normalize(props.defaultValue);
  const state = vm({ value: normalize(controlled ? props.value : initial) });
  const element = ref<HTMLFieldSetElement>();
  let disposed = false,
    frame = 0,
    resetFrame = 0;
  let stopReset: (() => void) | undefined, ownerForm: HTMLFormElement | null | undefined;
  function sync() {
    state.value = normalize(controlled ? props.value : state.value);
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
            if (!disposed && !event.defaultPrevented)
              state.value = normalize(controlled ? props.value : initial);
          });
        })
      : undefined;
  }
  function settle() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) {
        sync();
        bindForm();
      }
    });
  }
  function change(value: T, event: Event) {
    if (props.disabled) return;
    // An optimistic render also restores every native radio if the owner rejects a request.
    const next = normalize(value);
    state.value = next;
    props['on:change']?.(next, event);
    settle();
  }
  watch(
    props,
    'value',
    () => {
      if (controlled) sync();
    },
    { deep: true },
  );
  watch(props, 'form', settle);
  onMount(bindForm);
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resetFrame);
    stopReset?.();
  });
  return { state, element, change, sync };
}
