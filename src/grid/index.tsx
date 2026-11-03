import { type JNode, type WithChildren, cx } from 'jinge';

import { type Spacing, spacingStyle } from '../space/common';
import './style.scss';
export type RowProps = {
  gutter?: Spacing;
  align?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  className?: string;
  style?: string;
} & WithChildren<JNode>;
function gutterStyle(gutter: Spacing = 0) {
  const [row, column = row] = spacingStyle(gutter).split(' ');
  return `--ja-grid-gutter:${column};row-gap:${row};`;
}
export function Row(props: RowProps) {
  return (
    <div
      className={cx('ja-row', props.className)}
      style={`${gutterStyle(props.gutter)}align-items:${props.align ?? 'stretch'};justify-content:${props.justify ?? 'start'};flex-wrap:${props.wrap === false ? 'nowrap' : 'wrap'};${props.style ?? ''}`}
    >
      {props.children}
    </div>
  );
}
export interface ColSize {
  span?: number;
  offset?: number;
}
export type ColProps = {
  span?: number;
  offset?: number;
  order?: number;
  xs?: number | ColSize;
  sm?: number | ColSize;
  md?: number | ColSize;
  lg?: number | ColSize;
  xl?: number | ColSize;
  xxl?: number | ColSize;
  className?: string;
  style?: string;
} & WithChildren<JNode>;
function bound(value: number, max: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : max;
}
function responsiveClass(name: string, value?: number | ColSize) {
  if (value === undefined) return '';
  if (typeof value === 'number') return `${name}-span-${bound(value, 24)}`;
  return `${value.span === undefined ? '' : `${name}-span-${bound(value.span, 24)}`} ${value.offset === undefined ? '' : `${name}-offset-${bound(value.offset, 23)}`}`;
}
export function Col(props: ColProps) {
  return (
    <div
      className={cx(
        'ja-col',
        `span-${bound(props.span ?? 24, 24)}`,
        `offset-${bound(props.offset ?? 0, 23)}`,
        responsiveClass('xs', props.xs),
        responsiveClass('sm', props.sm),
        responsiveClass('md', props.md),
        responsiveClass('lg', props.lg),
        responsiveClass('xl', props.xl),
        responsiveClass('xxl', props.xxl),
        props.className,
      )}
      style={`${props.order === undefined ? '' : `order:${props.order};`}${props.style ?? ''}`}
    >
      {props.children}
    </div>
  );
}
