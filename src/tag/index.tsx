import './style.scss';

import { type JNode, type WithChildren, cx } from "jinge";

export function Tag(props: {
  className?: string;
  color?: 'success' | 'processing' | 'error'
} & WithChildren<JNode>) {
  return <div className={cx('ja-tag', props.className, props.color)}>
    {props.children}
  </div>
}