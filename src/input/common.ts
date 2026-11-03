import type { JNode, WithEvents, WithExpose, WithSlots } from 'jinge';

export type InputHandle = { focus(options?: FocusOptions): void; blur(): void; select(): void };
export type TextAreaHandle = InputHandle & { resize(): void };
export type InputSize = 'sm' | 'md' | 'lg';
export type TextControlProps = {
  value?: string | null;
  defaultValue?: string;
  id?: string;
  name?: string;
  form?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  tabIndex?: number;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  size?: InputSize;
  status?: 'error' | 'warning';
  allowClear?: boolean;
  clearLabel?: string;
  showCount?: boolean;
  className?: string;
  style?: string;
  noRoundedL?: boolean;
  noRoundedR?: boolean;
} & WithEvents<{
  change?(value: string, event: Event): void;
  input?(event: Event): void;
  focus?(event: FocusEvent): void;
  blur?(event: FocusEvent): void;
  pressEnter?(event: KeyboardEvent): void;
  clear?(event: MouseEvent): void;
}>;
export type InputConfig = TextControlProps & {
  type?: 'text' | 'search' | 'email' | 'url' | 'tel';
  pattern?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  prefix?: string;
  suffix?: string;
} & WithSlots<{ prefix?: JNode; suffix?: JNode }>;
export type InputProps = InputConfig & WithExpose<InputHandle>;
export type AutoSize = boolean | { minRows?: number; maxRows?: number };
export type TextAreaConfig = TextControlProps & {
  rows?: number;
  autoSize?: AutoSize;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
};
export type TextAreaProps = TextAreaConfig & WithExpose<TextAreaHandle>;
export type PasswordConfig = Omit<InputConfig, 'type' | 'pattern' | 'inputMode'> & {
  visible?: boolean;
  defaultVisible?: boolean;
  visibilityToggle?: boolean;
} & WithEvents<{ visibleChange?(visible: boolean): void }>;
export type PasswordProps = PasswordConfig & WithExpose<InputHandle>;
