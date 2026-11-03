import type { JNode, WithEvents, WithSlots } from 'jinge';

export type FloatingPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';
export type FloatingDuration = number | { open: number; close: number };
export type FloatingTriggerMethod = 'click' | 'hover' | 'focus' | 'none';
export type FloatingTrigger = FloatingTriggerMethod | Exclude<FloatingTriggerMethod, 'none'>[];
export type FloatingRole = 'tooltip' | 'dialog' | 'menu' | 'listbox';
export type FloatingProps = {
  id?: string;
  className?: string;
  style?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: FloatingPlacement;
  dismissable?: boolean;
  keyboard?: boolean;
  returnFocus?: boolean;
  autoFocus?: boolean;
  triggerMethod?: FloatingTrigger;
  /** Defaults to zero. Tooltip supplies its own hover delay. Focus opens immediately. Click close is immediate. */
  delay?: FloatingDuration;
  offset?: number;
  /** Safe viewport margin in CSS pixels. Defaults to 8. */
  padding?: number;
  safePolygon?: boolean;
  zIndex: number;
  role?: FloatingRole;
  ariaLabel?: string;
  ariaMultiselectable?: boolean;
  motion?: boolean;
} & WithSlots<{ default: JNode; trigger: JNode }> &
  WithEvents<{
    openChange?(open: boolean, event?: Event): void;
  }>;

function nonnegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
export function getDelayOpt(delay?: FloatingDuration) {
  if (typeof delay === 'number') return { open: nonnegative(delay), close: nonnegative(delay) };
  return { open: nonnegative(delay?.open ?? 0), close: nonnegative(delay?.close ?? 0) };
}
export const POS_BOTTOM = 0;
export const POS_TOP = 1;
const POS_LEFT = 2;
const POS_RIGHT = 3;
const ALI_START = 1;
const ALI_END = 2;
export function getPlacementOpt(placement: FloatingPlacement = 'top') {
  const align = placement.endsWith('-end') ? ALI_END : placement.endsWith('-start') ? ALI_START : 0;
  const position = placement.startsWith('top')
    ? POS_TOP
    : placement.startsWith('bottom')
      ? POS_BOTTOM
      : placement.startsWith('left')
        ? POS_LEFT
        : POS_RIGHT;
  return { position, align };
}
export interface Point {
  x: number;
  y: number;
}
const point = (x: number, y: number): Point => ({ x, y });
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

/** Viewport coordinates throughout. Size constraints are applied by the caller before its final measurement. */
export function calcPosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  windowSize: { width: number; height: number },
  placement: { position: number; align: number },
  offset: number,
  safePolygonTriggerPoint?: Point,
  padding = 0,
) {
  const W = nonnegative(windowSize.width),
    H = nonnegative(windowSize.height);
  const margin = Math.min(nonnegative(padding), W / 2, H / 2);
  const gap = nonnegative(offset);
  const availableWidth = Math.max(0, W - margin * 2),
    availableHeight = Math.max(0, H - margin * 2);
  const spaces = [
    clamp(H - margin - triggerRect.bottom - gap, 0, availableHeight),
    clamp(triggerRect.top - gap - margin, 0, availableHeight),
    clamp(triggerRect.left - gap - margin, 0, availableWidth),
    clamp(W - margin - triggerRect.right - gap, 0, availableWidth),
  ];
  let { position, align } = placement;
  const opposite =
    position === POS_TOP
      ? POS_BOTTOM
      : position === POS_BOTTOM
        ? POS_TOP
        : position === POS_LEFT
          ? POS_RIGHT
          : POS_LEFT;
  const vertical = position === POS_TOP || position === POS_BOTTOM;
  const desiredSize = vertical ? nonnegative(contentRect.height) : nonnegative(contentRect.width);
  if (desiredSize > spaces[position] && spaces[opposite] > spaces[position]) position = opposite;
  const maxWidth = vertical ? availableWidth : spaces[position] || availableWidth;
  const maxHeight = vertical ? spaces[position] || availableHeight : availableHeight;
  const width = Math.min(nonnegative(contentRect.width), maxWidth);
  const height = Math.min(nonnegative(contentRect.height), maxHeight);
  let x: number, y: number;
  if (vertical) {
    x =
      align === ALI_START
        ? triggerRect.left
        : align === ALI_END
          ? triggerRect.right - width
          : triggerRect.left + (triggerRect.width - width) / 2;
    y = position === POS_TOP ? triggerRect.top - gap - height : triggerRect.bottom + gap;
  } else {
    y =
      align === ALI_START
        ? triggerRect.top
        : align === ALI_END
          ? triggerRect.bottom - height
          : triggerRect.top + (triggerRect.height - height) / 2;
    x = position === POS_LEFT ? triggerRect.left - gap - width : triggerRect.right + gap;
  }
  x = clamp(x, margin, W - margin - width);
  y = clamp(y, margin, H - margin - height);
  const side =
    position === POS_TOP
      ? 'top'
      : position === POS_BOTTOM
        ? 'bottom'
        : position === POS_LEFT
          ? 'left'
          : 'right';
  const resolved =
    `${side}${align === ALI_START ? '-start' : align === ALI_END ? '-end' : ''}` as FloatingPlacement;
  let polygon: Point[] | undefined;
  const rect = safePolygonTriggerPoint ? [point(x, y), point(x + width, y + height)] : undefined;
  if (safePolygonTriggerPoint) {
    // A corridor between the closest edges; independent of page scroll and the pointer's original entry point.
    if (vertical) {
      const anchorY = position === POS_TOP ? triggerRect.top : triggerRect.bottom;
      const contentY = position === POS_TOP ? y + height : y;
      polygon = [
        point(triggerRect.left, anchorY),
        point(triggerRect.right, anchorY),
        point(x + width, contentY),
        point(x, contentY),
      ];
    } else {
      const anchorX = position === POS_LEFT ? triggerRect.left : triggerRect.right;
      const contentX = position === POS_LEFT ? x + width : x;
      polygon = [
        point(anchorX, triggerRect.top),
        point(anchorX, triggerRect.bottom),
        point(contentX, y + height),
        point(contentX, y),
      ];
    }
  }
  return { x, y, maxWidth, maxHeight, placement: resolved, polygon, rect };
}
