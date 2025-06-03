
import {
  type JClipboardEvent,
  type JFormEvent,

  type JNode,

  type WithChildren,

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
    value?: string;
    size?: 'sm' | 'lg' | 'md';
    noRoundedR?: boolean;
    noRoundedL?: boolean;
  } & WithEvents<{
    change?: (value: string, evt: JFormEvent<HTMLInputElement>) => void;
    blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
    focus?: (evt: JClipboardEvent<HTMLInputElement>) => void;
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
      className={cx('ja-input', props.noRoundedR && 'no-rounded-r', props.noRoundedL && 'no-rounded-l', props.size ?? 'md', props.className, props.disabled && 'disabled')}
      placeholder={props.placeholder}
      disabled={props.disabled}
      value={state.value}
      on:input={(evt) => {
        const v = evt.target.value;
        if (notCtrl) {
          state.value = v;
        }

        props['on:change']?.(v, evt);
      }}
      on:blur={props['on:blur']}
      on:focus={props['on:focus']}
    />
  );
}

export function InputWrapper(props: { className?: string } & WithChildren<JNode>) {
  return <div className={cx('ja-input-wrapper', props.className)}>
    {props.children}
  </div>
}

export function InputAddon(props: {
  className?: string;
  size?: 'sm' | 'lg' | 'md';
} & WithChildren<JNode>) {
  return <div className={cx('ja-input-addon', props.size ?? 'md', props.className)}>
    {props.children}
  </div>
}