import './style.scss';

import { AntDesignLoadingOutlined } from '../icon';
import { cx } from 'jinge';

export function LoadingOutlined(props: { className?: string; style?: string }) {
  return (
    <span style={props.style} className={cx('ja-loading', props.className)}>
      <AntDesignLoadingOutlined />
    </span>
  );
}
