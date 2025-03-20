import { type JNode, type WithChildren, type WithEvents, type WithPropSlot, cx } from 'jinge';
import { Floating, type FloatingTriggerMethod } from '../floating';
import { z } from '../_util/z';

export function Tooltip(
  props: {
    triggerMethod?: FloatingTriggerMethod;
    open?: boolean;
    className?: string;
    safePolygon?: boolean;
  } & WithEvents<{
    openChange?(v: boolean): void;
  }> &
    WithChildren<JNode> &
    WithPropSlot<'content', JNode>,
) {
  const zIndex = z.getTooltipZ();

  return (
    <Floating
      zIndex={zIndex}
      open={props.open}
      on:openChange={props['on:openChange']}
      safePolygon={props.safePolygon}
      triggerMethod={props.triggerMethod ?? 'hover'}
      delay={{ open: 300, close: 0 }}
      offset={10}
      placement='top'
      slot:trigger={props.children}
      className={cx('ja-tooltip', props.className)}
    >
      {props['slot:content'] ?? props.content}
    </Floating>
  );
}
