import { type JNode, type WithEvents, type WithSlots, isNumber, isUndefined } from 'jinge';

export type FloatingPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'left-start'
  | 'right'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';
export type FloatingDuration = number | { open: number; close: number };
export type FloatingTriggerMethod = 'click' | 'hover' | 'none';
export type FloatingProps = {
  /** 浮层的 className */
  className?: string;
  enterClass?: string;
  enterActiveClass?: string;
  leaveClass?: string;
  leaveActiveClass?: string;

  /** 是否打开。使用该参数搭配 on:openChange 事件可切换为受控模式。 */
  open?: boolean;
  /** 位置，默认是 top */
  placement?: FloatingPlacement;
  /** 触发方式，默认是 click。指定为 none 时完全由外部通过 visible 属性控制。*/
  triggerMethod?: FloatingTriggerMethod;
  /** 延迟显示，毫秒。trigger 为 hover 时默认为 300，trigger 为 click 时默认为 0 */
  delay?: FloatingDuration;
  /** 偏移量。当 placement 是 topXX 时默认为 20，其它时默认为 10 */
  offset?: number;
  /** 在 triggerMethod 为 hover 时，是否开启 safePolygon。详见：https://floating-ui.com/docs/usehover#safepolygon */
  safePolygon?: boolean;
  /** z-index */
  zIndex: number;
} & WithSlots<{ default: JNode; trigger: JNode }> &
  WithEvents<{
    openChange?(v: boolean, evt?: Event): void;
  }>;

export function getDelayOpt(delay: FloatingDuration | undefined) {
  return isUndefined(delay)
    ? { open: 0, close: 0 }
    : isNumber(delay)
      ? { open: delay, close: delay }
      : delay;
}

export const POS_BOTTOM = 0;
export const POS_TOP = 1;
export const POS_LEFT = 2;
export const POS_RIGHT = 3;
export const ALI_START = 1;
export const ALI_END = 2;
export const ALI_CENTER = 0;
export function getPlacementOpt(placement?: FloatingPlacement) {
  const pl = placement ?? 'top';
  const align = pl.endsWith('-end') ? ALI_END : pl.endsWith('-start') ? ALI_START : ALI_CENTER;
  const position = pl.startsWith('top')
    ? POS_TOP
    : pl.startsWith('bottom')
      ? POS_BOTTOM
      : pl.startsWith('left')
        ? POS_LEFT
        : POS_RIGHT;
  return { position, align };
}
