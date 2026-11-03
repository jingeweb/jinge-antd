import './style.scss';
import { cx } from 'jinge';

import { AntDesignLoadingOutlined } from '../icon';
export interface LoadingOutlinedProps {
  className?: string;
  style?: string;
  ariaLabel?: string;
}
export function LoadingOutlined(props: LoadingOutlinedProps) {
  return (
    <span
      style={props.style}
      className={cx('ja-loading', props.className)}
      role={props.ariaLabel ? 'status' : undefined}
      aria-label={props.ariaLabel}
      aria-hidden={props.ariaLabel ? undefined : true}
    >
      <AntDesignLoadingOutlined />
    </span>
  );
}
