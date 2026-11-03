import { type JNode, type WithChildren, type WithEvents, type WithPropSlot, cx } from 'jinge';

import { z } from '../_util/z';
import {
  Floating,
  type FloatingDuration,
  type FloatingPlacement,
  type FloatingTrigger,
} from '../floating';

export type PopoverProps = {
  id?: string;
  className?: string;
  style?: string;
  safePolygon?: boolean;
  placement?: FloatingPlacement;
  delay?: FloatingDuration;
  triggerMethod?: FloatingTrigger;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  dismissable?: boolean;
  keyboard?: boolean;
  returnFocus?: boolean;
  autoFocus?: boolean;
  offset?: number;
  padding?: number;
  motion?: boolean;
  ariaLabel?: string;
} & WithEvents<{ openChange?(open: boolean): void }> &
  WithChildren<JNode> &
  WithPropSlot<'content', JNode>;

export function Popover(props: PopoverProps) {
  const zIndex = z.getPopoverZ();
  return (
    <Floating
      id={props.id}
      zIndex={zIndex}
      role="dialog"
      ariaLabel={props.ariaLabel ?? '更多信息'}
      delay={props.delay}
      safePolygon={props.safePolygon ?? true}
      triggerMethod={props.triggerMethod}
      offset={props.offset ?? 10}
      padding={props.padding}
      placement={props.placement}
      slot:trigger={props.children}
      style={props.style}
      className={cx('ja-popover', props.className)}
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled}
      dismissable={props.dismissable}
      keyboard={props.keyboard}
      returnFocus={props.returnFocus}
      autoFocus={props.autoFocus}
      motion={props.motion}
      on:openChange={props['on:openChange']}
    >
      {props['slot:content'] ?? props.content}
    </Floating>
  );
}
