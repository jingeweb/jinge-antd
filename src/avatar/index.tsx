import {
  type JNode,
  type WithOptChildren,
  type WithSlots,
  type WithEvents,
  cx,
  vm,
  watch,
} from 'jinge';

import './style.scss';
import { AntDesignUserOutlined } from '../_icon';
export type AvatarSize = 'sm' | 'md' | 'lg' | number;
export type AvatarProps = {
  src?: string;
  srcSet?: string;
  alt?: string;
  ariaLabel?: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ icon?: JNode }> &
  WithEvents<{ error?(event: Event): void; load?(event: Event): void }>;
function avatarSize(size: AvatarSize | undefined) {
  if (typeof size === 'number') return Number.isFinite(size) && size > 0 ? size : 32;
  return size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
}
function avatarStyle(style: string | undefined, size: AvatarSize | undefined) {
  const pixels = avatarSize(size);
  return `${style ?? ''};width:${pixels}px;height:${pixels}px;font-size:${Math.max(12, pixels / 2)}px`;
}
function initial(alt: string | undefined) {
  return Array.from(alt?.trim() ?? '')[0];
}
export function Avatar(props: AvatarProps) {
  const state = vm({ failed: false });
  watch(props, 'src', () => {
    state.failed = false;
  });
  watch(props, 'srcSet', () => {
    state.failed = false;
  });
  return (
    <span
      role="img"
      aria-label={props.ariaLabel ?? props.alt ?? '头像'}
      className={cx('ja-avatar', props.shape ?? 'circle', props.className)}
      style={avatarStyle(props.style, props.size)}
    >
      {props.src && !state.failed ? (
        <img
          src={props.src}
          srcSet={props.srcSet}
          alt=""
          on:error={(event) => {
            state.failed = true;
            props['on:error']?.(event);
          }}
          on:load={props['on:load']}
        />
      ) : (
        <span className="ja-avatar-fallback" aria-hidden="true">
          {props.children ?? props['slot:icon'] ?? initial(props.alt) ?? <AntDesignUserOutlined />}
        </span>
      )}
    </span>
  );
}
