import { expose, ref } from 'jinge';

import type { TextAreaProps } from './common';

import { TextField } from './text-field';
export type { TextAreaProps, TextAreaHandle, AutoSize } from './common';
export function TextArea(props: TextAreaProps) {
  const field = ref<typeof TextField>();
  expose({
    focus: (options?: FocusOptions) => field.value?.focus(options),
    blur: () => field.value?.blur(),
    select: () => field.value?.select(),
    resize: () => field.value?.resize(),
  });
  return <TextField kind="textarea" config={props} ref={field} />;
}
