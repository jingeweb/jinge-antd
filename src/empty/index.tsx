import './style.scss';
import {
  type JNode,
  type WithOptChildren,
  type WithSlots,
  type WithEvents,
  cx,
  vm,
  watch,
} from 'jinge';

export type EmptyProps = {
  image?: string | false;
  description?: string | false;
  size?: 'sm' | 'md';
  announce?: boolean;
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ image?: JNode; description?: JNode }> &
  WithEvents<{ error?(event: Event): void }>;
function Illustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="48"
      viewBox="0 0 64 48"
      focusable="false"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="44" rx="27" ry="3" fill="#f5f5f5" />
      <path d="M9 23 19 8h26l10 15v17H9Z" fill="#fafafa" stroke="#d9d9d9" />
      <path d="M9 23h15l4 6h8l4-6h15v17H9Z" fill="#f0f0f0" stroke="#d9d9d9" />
      <path d="M24 12h16M22 17h20" stroke="#e5e5e5" stroke-linecap="round" />
    </svg>
  );
}
export function Empty(props: EmptyProps) {
  const state = vm({ imageFailed: false });
  watch(props, 'image', () => {
    state.imageFailed = false;
  });
  return (
    <div
      className={cx('ja-empty', props.size ?? 'md', props.className)}
      style={props.style}
      role={props.announce ? 'status' : undefined}
      aria-atomic={props.announce ? 'true' : undefined}
    >
      {props.image !== false && (
        <div className="ja-empty-image" aria-hidden="true">
          {props['slot:image'] ? (
            props['slot:image']
          ) : props.image && !state.imageFailed ? (
            <img
              src={props.image}
              alt=""
              on:error={(event) => {
                state.imageFailed = true;
                props['on:error']?.(event);
              }}
            />
          ) : (
            <Illustration />
          )}
        </div>
      )}
      {props.description !== false && (
        <div className="ja-empty-description">
          {props['slot:description']
            ? props['slot:description']
            : (props.description ?? '暂无数据')}
        </div>
      )}
      {props['slot:default'] && <div className="ja-empty-footer">{props.children}</div>}
    </div>
  );
}
