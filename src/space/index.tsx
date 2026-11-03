import { type JNode, type WithChildren, cx } from 'jinge';

import { type Spacing, spacingStyle } from './common';
import './style.scss';
export type { Spacing, SpacingSize } from './common';
export type SpaceProps = {
  size?: Spacing;
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: boolean;
  block?: boolean;
  className?: string;
  style?: string;
} & WithChildren<JNode>;
export function Space(props: SpaceProps) {
  return (
    <div
      className={cx(
        'ja-space',
        props.direction ?? 'horizontal',
        props.align ?? 'center',
        props.wrap && 'wrap',
        props.block && 'block',
        props.className,
      )}
      style={`gap:${spacingStyle(props.size)};${props.style ?? ''}`}
    >
      {props.children}
    </div>
  );
}
