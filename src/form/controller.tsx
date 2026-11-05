import {
  type JNode,
  type WithChildren,
  type WithEvents,
  context,
  onUnmount,
  uid,
  vm,
  vmWatch,
  watch,
} from 'jinge';

import {
  type FormControl,
  type FormName,
  type FormPresentation,
  FORM_PRESENTATION,
} from './common';
/** 控件可公开组件实例或原生元素，只需提供 focus 方法。 */
export type FormFieldHandle = { focus(): void };
export type FormFieldRef = (handle: FormFieldHandle | undefined) => void;

export type FormFieldValue<T extends object, P extends FormName<T>> = {
  value?: T[P];
  name: P;
  id: string;
  ref: FormFieldRef;
  error?: string;
  invalid: boolean;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  required: boolean;
  size: 'sm' | 'md' | 'lg';
  ariaDescribedby?: string;
} & WithEvents<{
  change(value: T[P] | undefined, event?: Event): void;
  blur(event: FocusEvent): void;
}>;
export type ControllerProps<T extends object, P extends FormName<T>> = {
  name: P;
  control: FormControl<T>;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  preserve?: boolean;
  dependencies?: FormName<T>[];
  validateTrigger?: 'blur' | 'change' | 'submit';
  descriptionId?: string;
  errorId?: string;
  focus?: () => void;
} & WithChildren<(field: FormFieldValue<T, P>) => JNode>;

export function Controller<T extends object, P extends FormName<T>>(props: ControllerProps<T, P>) {
  const presentation = context<FormPresentation | undefined>(FORM_PRESENTATION);
  const id = `ja-field-${uid()}`;
  let boundControl: FormControl<T> | undefined, boundName: P | undefined;
  let focusFrame = 0,
    disposed = false;
  let focusTarget: FormFieldHandle | undefined;
  let stops: (() => void)[] = [],
    unregister: (() => void) | undefined;
  function disabled() {
    return !!(
      props.disabled ||
      presentation?.disabled ||
      (presentation?.disabledWhileSubmitting !== false && props.control.status.submitting)
    );
  }
  const state = vm<FormFieldValue<T, P>>({
    value: undefined,
    name: props.name,
    id: props.id ?? id,
    ref: (handle) => {
      if (!disposed) focusTarget = handle;
    },
    invalid: false,
    touched: false,
    dirty: false,
    validating: false,
    disabled: disabled(),
    required: !!props.required,
    size: props.size ?? presentation?.size ?? 'md',
    'on:change': (value) => {
      ensure();
      if (disabled()) return;
      const meta = props.control.getFieldState(props.name);
      const validate =
        props.validateTrigger === 'change' ||
        props.control.status.validated ||
        (meta.touched && props.validateTrigger !== 'submit');
      void props.control
        .setField(props.name, value, validate)
        .catch((error) => props.control.reportError(error));
    },
    'on:blur': () => {
      ensure();
      if (disabled()) return;
      props.control.touch(props.name);
      if ((props.validateTrigger ?? 'blur') === 'blur')
        void props.control
          .validateField(props.name)
          .catch((error) => props.control.reportError(error));
    },
  });
  function sync() {
    const meta = props.control.getFieldState(props.name);
    state.name = props.name;
    state.id = props.id ?? id;
    state.error = meta.error;
    state.invalid = !!meta.error;
    state.touched = meta.touched;
    state.dirty = meta.dirty;
    state.validating = meta.validating;
    state.disabled = disabled();
    state.required = !!props.required;
    state.size = props.size ?? presentation?.size ?? 'md';
    state.ariaDescribedby =
      [props.descriptionId, meta.error ? props.errorId : undefined].filter(Boolean).join(' ') ||
      undefined;
  }
  function cleanup() {
    cancelAnimationFrame(focusFrame);
    for (const stop of stops) stop();
    stops = [];
    unregister?.();
    unregister = undefined;
  }
  function bind() {
    cleanup();
    boundControl = props.control;
    boundName = props.name;
    unregister = props.control.registerField(props.name, {
      get preserve() {
        return props.preserve;
      },
      get dependencies() {
        return props.dependencies;
      },
      focus: () => {
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(() => {
          focusFrame = 0;
          if (!disposed) {
            if (props.focus) props.focus();
            else if (focusTarget) focusTarget.focus();
            else document.getElementById(state.id)?.focus();
          }
        });
      },
    });
    stops = [
      props.control.watchField(props.name, (value) => {
        state.value = value;
      }),
      props.control.watchFieldState(props.name, sync),
      vmWatch(props.control.status, sync),
    ];
    sync();
  }
  function ensure() {
    if (boundControl !== props.control || boundName !== props.name) bind();
  }
  bind();
  watch(props, 'name', bind);
  watch(props, 'control', bind);

  for (const key of ['id', 'disabled', 'required', 'size', 'descriptionId', 'errorId'] as const)
    watch(props, key, sync);
  if (presentation) watch(presentation, sync);
  onUnmount(() => {
    disposed = true;
    focusTarget = undefined;
    cleanup();
  });
  return <>{props.children({ ...state })}</>;
}
