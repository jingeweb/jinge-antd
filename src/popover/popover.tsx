import { type JNode, type WithChildren, type WithPropSlot, cx } from 'jinge';
import { Floating, type FloatingDuration, type FloatingTriggerMethod } from '../floating';
import { z } from '../_util/z';

export function Popover(
  props: {
    className?: string;
    safePolygon?: boolean;
    delay?: FloatingDuration;
    triggerMethod?: FloatingTriggerMethod;
  } & WithChildren<JNode> &
    WithPropSlot<'content', JNode>,
) {
  const zIndex = z.getPopoverZ();

  return (
    <Floating
      zIndex={zIndex}
      delay={props.delay}
      safePolygon={props.safePolygon}
      triggerMethod={props.triggerMethod}
      offset={10}
      placement='top'
      slot:trigger={props.children}
      className={cx('ja-popover', props.className)}
    >
      {props['slot:content'] ?? props.content}
    </Floating>
  );
}
