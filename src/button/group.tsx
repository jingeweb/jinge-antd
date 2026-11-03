import { type JNode, type WithChildren, context, cx } from 'jinge';

import { BUTTON_GROUP_CONTEXT, type ButtonSize } from './common';

export type ButtonGroupProps = {
  size?: ButtonSize;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  style?: string;
  ariaLabel?: string;
} & WithChildren<JNode>;

export function ButtonGroup(props: ButtonGroupProps) {
  context(BUTTON_GROUP_CONTEXT, props);
  return (
    <div
      role="group"
      aria-label={props.ariaLabel}
      className={cx('ja-button-group', props.direction ?? 'horizontal', props.className)}
      style={props.style}
    >
      {props.children}
    </div>
  );
}
