import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithPropSlot,
  cx,
  isUndefined,
  vm,
  watch,
} from 'jinge';

import { z } from '../_util/z';
import {
  Floating,
  type FloatingDuration,
  type FloatingPlacement,
  type FloatingTriggerMethod,
} from '../floating';

export function Popover(
  props: {
    className?: string;
    safePolygon?: boolean;
    placement?: FloatingPlacement;
    delay?: FloatingDuration;
    triggerMethod?: FloatingTriggerMethod;
    open?: boolean;
  } & WithEvents<{
    openChange?(v: boolean): void;
  }> &
    WithChildren<JNode> &
    WithPropSlot<'content', JNode>,
) {
  const zIndex = z.getPopoverZ();
  const notCtrl = isUndefined(props.open);
  const state = vm({
    open: !!props.open,
  });

  watch(props, 'open', (v) => {
    state.open = !!v;
  });

  return (
    <Floating
      zIndex={zIndex}
      delay={props.delay}
      safePolygon={props.safePolygon}
      triggerMethod={props.triggerMethod}
      offset={10}
      placement={props.placement}
      slot:trigger={props.children}
      className={cx('ja-popover', props.className)}
      open={state.open}
      on:openChange={(v) => {
        if (notCtrl) {
          state.open = v;
        }
        props['on:openChange']?.(v);
      }}
    >
      {props['slot:content'] ?? props.content}
    </Floating>
  );
}
