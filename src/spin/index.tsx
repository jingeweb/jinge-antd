import './style.scss';

import { cx } from 'jinge';

export function Spin(props: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={cx('ja-spin', props.className, props.size ?? 'md')}>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
