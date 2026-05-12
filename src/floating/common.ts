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
  | 'right-start'
  | 'right-end';
export type FloatingDuration = number | { open: number; close: number };
export type FloatingTriggerMethod = 'click' | 'hover' | 'none';
export type FloatingProps = {
  /** 浮层的 className */
  className?: string;
  /** 浮层的 style */
  style?: string;
  enterClass?: string;
  enterActiveClass?: string;
  leaveClass?: string;
  leaveActiveClass?: string;

  /** 是否打开。使用该参数搭配 on:openChange 事件可切换为受控模式。 */
  open?: boolean;
  /** 位置，默认是 top */
  placement?: FloatingPlacement;
  /** 点击其它区域时是否关闭 */
  dismissable?: boolean;
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

const POS_BOTTOM = 0;
export const POS_TOP = 1;
const POS_LEFT = 2;
const POS_RIGHT = 3;
const ALI_START = 1;
const ALI_END = 2;
const ALI_CENTER = 0;
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

export interface Point {
  x: number;
  y: number;
}

function makePoint(x: number, y: number) {
  return { x, y } as Point;
}

export function calcPosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  windowSize: { width: number; height: number },
  placement: { position: number; align: number },
  offset: number,
  polygon: boolean,
): { x: number; y: number; polygon?: Point[] } {
  const { left: tl, top: tt, bottom: tb, height: th, right: tr, width: tw } = triggerRect;
  const { width: cw, height: ch } = contentRect;
  const { width: W, height: H } = windowSize;
  let { position, align } = placement;
  let x = 0;
  let y = 0;
  if (position === POS_TOP || position === POS_BOTTOM) {
    if (align === ALI_START) {
      x = tl;
    } else if (align === ALI_END) {
      x = tr - cw;
    } else {
      x = tl + (tw - cw) / 2;
    }
    if (x + cw > W) x = W - cw;
    if (x < 0) x = 0;
  } else if (position == POS_LEFT || position === POS_RIGHT) {
    if (align === ALI_START) {
      y = tt;
    } else if (align === ALI_END) {
      y = tb - ch;
    } else {
      y = tt + (th - ch) / 2;
    }
    if (y + ch > H) y = H - ch;
    if (y < 0) y = 0;
  }
  if (position === POS_TOP) {
    y = tt - offset - ch;
    if (y < 0) {
      const y2 = tb + offset;
      if (y2 + ch <= H) {
        y = y2;
        position = POS_BOTTOM;
      }
    }
  } else if (position === POS_BOTTOM) {
    y = tb + offset;
    if (y + ch > H) {
      const y2 = tt - offset - ch;
      if (y2 >= 0) {
        y = y2;
        position = POS_TOP;
      }
    }
  }
  if (position === POS_LEFT) {
    x = tl - offset - cw;
    if (x < 0) {
      const x2 = tr + offset;
      if (x2 <= W) {
        x = x2;
        position = POS_RIGHT;
      }
    }
  } else if (position === POS_RIGHT) {
    x = tr + offset;
    if (x + cw > W) {
      const x2 = tl - offset - cw;
      if (x2 >= 0) {
        x = x2;
        position = POS_LEFT;
      }
    }
  }

  let polygonPoints: Point[] | undefined = undefined;
  if (polygon) {
    if (position == POS_TOP) {
      polygonPoints = [
        makePoint(x, y + ch),
        makePoint(x, y),
        makePoint(x + cw, y),
        makePoint(x + cw, y + ch),
        makePoint(tr, tt),
        makePoint(tl, tt),
      ];
    } else if (position == POS_BOTTOM) {
      polygonPoints = [
        makePoint(x, y),
        makePoint(tl, tb),
        makePoint(tr, tb),
        makePoint(x + cw, y),
        makePoint(x + cw, y + ch),
        makePoint(x, y + ch),
      ];
    } else if (position == POS_LEFT) {
      polygonPoints = [
        makePoint(x + cw, y),
        makePoint(tl, tt),
        makePoint(tl, tb),
        makePoint(x + cw, y + ch),
        makePoint(x, y + ch),
        makePoint(x, y),
      ];
    } else if (position == POS_RIGHT) {
      polygonPoints = [
        makePoint(x, y),
        makePoint(x + cw, y),
        makePoint(x + cw, y + ch),
        makePoint(x, y + ch),
        makePoint(tr, tb),
        makePoint(tr, tt),
      ];
    }
  }

  return { x, y, polygon: polygonPoints };
}
