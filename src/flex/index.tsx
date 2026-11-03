import { type JNode, type WithChildren, cx } from 'jinge';

import { type Spacing, spacingStyle } from '../space/common';
import './style.scss';
export type FlexProps = {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: Spacing;
  wrap?: boolean;
  className?: string;
  style?: string;
} & WithChildren<JNode>;
export function Flex(props: FlexProps) {
  return (
    <div
      className={cx('ja-flex', props.className)}
      style={`flex-direction:${props.direction ?? 'row'};align-items:${props.align ?? 'stretch'};justify-content:${props.justify ?? 'start'};gap:${spacingStyle(props.gap ?? 0)};flex-wrap:${props.wrap ? 'wrap' : 'nowrap'};${props.style ?? ''}`}
    >
      {props.children}
    </div>
  );
}
