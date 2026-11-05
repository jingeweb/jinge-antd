import './style.scss';
import { For, type JNode, type WithOptChildren, cx, vm, watch } from 'jinge';

export type SkeletonDimension = number | string;
export type SkeletonBlockProps = {
  width?: SkeletonDimension;
  height?: SkeletonDimension;
  shape?: 'rect' | 'round' | 'circle';
  active?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: string;
};
function dimension(value: SkeletonDimension | undefined, fallback: string) {
  return typeof value === 'number'
    ? `${Number.isFinite(value) ? Math.max(0, value) : 0}px`
    : (value ?? fallback);
}
export function SkeletonBlock(props: SkeletonBlockProps) {
  return (
    <span
      className={cx(
        'ja-skeleton-block',
        props.shape ?? 'rect',
        props.active && 'active',
        props.className,
      )}
      style={`${props.style ?? ''};width:${dimension(props.width, '100%')};height:${dimension(props.height, '16px')}`}
      aria-hidden={props.ariaLabel ? undefined : 'true'}
      role={props.ariaLabel ? 'status' : undefined}
      aria-label={props.ariaLabel}
    />
  );
}
export type SkeletonProps = {
  loading?: boolean;
  active?: boolean;
  avatar?: boolean;
  avatarSize?: number;
  avatarShape?: 'circle' | 'square';
  title?: boolean;
  titleWidth?: SkeletonDimension;
  rows?: number;
  widths?: SkeletonDimension[];
  loadingText?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode>;
function rowCount(rows: number = 3) {
  return Number.isFinite(rows) ? Math.max(0, Math.min(20, Math.floor(rows))) : 3;
}
function lines(rows: number | undefined) {
  return Array.from({ length: rowCount(rows) }, (_, index) => ({ key: index }));
}
function lineWidth(
  widths: SkeletonDimension[] | undefined,
  index: number,
  rows: number | undefined,
) {
  return widths?.[index] ?? (index === rowCount(rows) - 1 ? '60%' : '100%');
}
function avatarSize(size: number = 40) {
  return Number.isFinite(size) && size > 0 ? size : 40;
}
export function Skeleton(props: SkeletonProps) {
  const state = vm({ seen: props.loading === false });
  watch(props, 'loading', (loading) => {
    if (loading === false) state.seen = true;
  });
  return (
    <div
      className={cx('ja-skeleton', props.active && 'active', props.className)}
      style={props.style}
      aria-busy={props.loading !== false ? 'true' : undefined}
    >
      {props.loading !== false && (
        <div
          className="ja-skeleton-placeholder"
          role="status"
          aria-label={props.loadingText ?? '加载中'}
        >
          {props.avatar && (
            <SkeletonBlock
              className="ja-skeleton-avatar"
              width={avatarSize(props.avatarSize)}
              height={avatarSize(props.avatarSize)}
              shape={props.avatarShape === 'square' ? 'rect' : 'circle'}
            />
          )}
          <div className="ja-skeleton-text">
            {props.title !== false && (
              <SkeletonBlock
                className="ja-skeleton-title"
                width={props.titleWidth ?? '38%'}
                height={20}
              />
            )}
            <For loop={lines(props.rows)} key="key">
              {(each) => (
                <SkeletonBlock
                  className="ja-skeleton-line"
                  width={lineWidth(props.widths, each.data.key, props.rows)}
                />
              )}
            </For>
          </div>
        </div>
      )}
      {props['slot:default'] && state.seen && (
        <div className="ja-skeleton-content" hidden={props.loading !== false}>
          {props.children}
        </div>
      )}
    </div>
  );
}
