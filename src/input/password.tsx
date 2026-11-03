import { expose, ref } from 'jinge';

import type { PasswordProps } from './common';

import { TextField } from './text-field';
export type { PasswordProps } from './common';
export function Password(props: PasswordProps) {
  const field = ref<typeof TextField>();
  expose({
    focus: (options?: FocusOptions) => field.value?.focus(options),
    blur: () => field.value?.blur(),
    select: () => field.value?.select(),
  });
  return <TextField kind="password" config={props} ref={field} />;
}
