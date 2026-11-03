import { type JNode, type WithOptChildren, cx } from 'jinge';

import './style.scss';
export type DividerProps = {
  type?: 'horizontal' | 'vertical';
  dashed?: boolean;
  orientation?: 'left' | 'center' | 'right';
  plain?: boolean;
  className?: string;
  style?: string;
} & WithOptChildren<JNode>;
export function Divider(props: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={props.type ?? 'horizontal'}
      className={cx(
        'ja-divider',
        props.type ?? 'horizontal',
        props.orientation ?? 'center',
        props.dashed && 'dashed',
        !!props['slot:default'] && 'with-text',
        props.plain && 'plain',
        props.className,
      )}
      style={props.style}
    >
      {props.children && <span className="ja-divider-text">{props.children}</span>}
    </div>
  );
}
