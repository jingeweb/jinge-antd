import './style.scss';
import { cx } from 'jinge';

import { AntDesignLoadingOutlined } from '../icon';

export function LoadingOutlined(props: { className?: string; style?: string }) {
  return (
    <span style={props.style} className={cx('ja-loading', props.className)}>
      <AntDesignLoadingOutlined />
    </span>
  );
}
