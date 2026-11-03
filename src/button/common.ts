export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonGroupContext {
  size?: ButtonSize;
  disabled?: boolean;
}
export const BUTTON_GROUP_CONTEXT = Symbol('ja-button-group');
