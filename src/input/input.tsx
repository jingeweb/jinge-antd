import { type JNode, type WithChildren, cx, expose, ref } from 'jinge';

import type { InputProps } from './common';

import { TextField } from './text-field';
export type { InputProps, InputHandle, InputSize } from './common';
export function Input(props: InputProps) {
  const field = ref<typeof TextField>();
  expose({
    focus: (options?: FocusOptions) => field.value?.focus(options),
    blur: () => field.value?.blur(),
    select: () => field.value?.select(),
  });
  return <TextField kind="input" config={props} ref={field} />;
}

export function InputWrapper(props: { className?: string } & WithChildren<JNode>) {
  return <div className={cx('ja-input-wrapper', props.className)}>{props.children}</div>;
}

export function InputAddon(
  props: {
    className?: string;
    size?: 'sm' | 'lg' | 'md';
  } & WithChildren<JNode>,
) {
  return (
    <div className={cx('ja-input-addon', props.size ?? 'md', props.className)}>
      {props.children}
    </div>
  );
}
