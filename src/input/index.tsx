import './style.scss';

import {
  type HTMLInputTypeAttribute,
  type JClipboardEvent,
  type JFormEvent,
  type WithEvents,
  cx,
  isUndefined,
  vm,
  watch,
} from 'jinge';

export function Input(
  props: {
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    value?: string;
  } & WithEvents<{
    change?: (value: string, evt: JFormEvent<HTMLInputElement>) => void;
    blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
  }>,
) {
  const notCtrl = isUndefined(props.value);
  const state = vm({
    value: props.value ?? '',
  });

  watch(props, 'value', (v) => {
    state.value = v ?? '';
  });

  return (
    <input
      className={cx('ja-input', props.className, props.disabled && 'disabled')}
      placeholder={props.placeholder}
      disabled={props.disabled}
      type={props.type}
      value={state.value}
      on:input={(evt) => {
        const v = evt.target.value;
        if (notCtrl) {
          state.value = v;
        }

        props['on:change']?.(v, evt);
      }}
      on:blur={props['on:blur']}
    />
  );
}
