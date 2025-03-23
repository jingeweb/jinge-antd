import './style.scss';

import {
  type HTMLInputTypeAttribute,
  type JClipboardEvent,
  type JFormEvent,
  type WithEvents,
  cx,
} from 'jinge';

export function Input(
  props: {
    className?: string;
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    value?: string;
  } & WithEvents<{
    change?: (evt: JFormEvent<HTMLInputElement>) => void;
    blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
  }>,
) {
  return (
    <input
      className={cx('ja-input', props.className)}
      placeholder={props.placeholder}
      type={props.type}
      value={props.value ?? ''}
      on:input={(evt) => {
        props['on:change']?.(evt);
      }}
      on:blur={(evt) => {
        props['on:blur']?.(evt);
      }}
    />
  );
}
