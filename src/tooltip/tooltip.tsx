import { type JNode, type WithChildren, type WithEvents, type WithPropSlot, cx } from 'jinge';

import { z } from '../_util/z';
import {
  Floating,
  type FloatingDuration,
  type FloatingPlacement,
  type FloatingTrigger,
} from '../floating';

export type TooltipProps = {
  id?: string;
  triggerMethod?: FloatingTrigger;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  className?: string;
  style?: string;
  safePolygon?: boolean;
  placement?: FloatingPlacement;
  delay?: FloatingDuration;
  offset?: number;
  padding?: number;
  keyboard?: boolean;
  motion?: boolean;
} & WithEvents<{ openChange?(open: boolean): void }> &
  WithChildren<JNode> &
  WithPropSlot<'content', JNode>;

export function Tooltip(props: TooltipProps) {
  const zIndex = z.getTooltipZ();
  return (
    <Floating
      id={props.id}
      zIndex={zIndex}
      role="tooltip"
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled || (!props['slot:content'] && !props.content)}
      on:openChange={props['on:openChange']}
      safePolygon={props.safePolygon ?? true}
      triggerMethod={props.triggerMethod ?? ['hover', 'focus']}
      delay={props.delay ?? { open: 300, close: 100 }}
      offset={props.offset ?? 10}
      padding={props.padding}
      placement={props.placement ?? 'top'}
      keyboard={props.keyboard}
      motion={props.motion}
      slot:trigger={props.children}
      style={props.style}
      className={cx('ja-tooltip', props.className)}
    >
      {props['slot:content'] ?? props.content}
    </Floating>
  );
}
