import './style.scss';
import { type JNode, type WithOptChildren, cx } from 'jinge';

export type BadgeStatus = 'default' | 'success' | 'processing' | 'error' | 'warning';
export type BadgeProps = {
  count?: number | string;
  overflowCount?: number;
  showZero?: boolean;
  dot?: boolean;
  status?: BadgeStatus;
  text?: string;
  color?: string;
  size?: 'sm' | 'md';
  offset?: [number, number];
  title?: string;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode>;
function countValue(count: number | string | undefined) {
  return typeof count === 'string'
    ? count
    : typeof count === 'number' && Number.isFinite(count)
      ? Math.max(0, Math.floor(count))
      : 0;
}
function badgeVisible(
  count: number | string | undefined,
  dot?: boolean,
  showZero?: boolean,
  status?: BadgeStatus,
) {
  return (
    !!status ||
    !!dot ||
    (typeof countValue(count) === 'string'
      ? countValue(count) !== ''
      : Number(countValue(count)) > 0 || !!showZero)
  );
}
function displayCount(count: number | string | undefined, overflow: number | undefined) {
  const value = countValue(count);
  const limit =
    overflow !== undefined && Number.isFinite(overflow) && overflow >= 0
      ? Math.floor(overflow)
      : 99;
  return typeof value === 'number' && value > limit ? `${limit}+` : String(value);
}
function badgeLabel(
  count: number | string | undefined,
  dot: boolean | undefined,
  status: BadgeStatus | undefined,
  label: string | undefined,
) {
  if (label) return label;
  if (status)
    return {
      default: '默认',
      success: '成功',
      processing: '进行中',
      error: '错误',
      warning: '警告',
    }[status];
  return dot ? '有新消息' : `${countValue(count)}${typeof count === 'string' ? '' : ' 条'}`;
}
function indicatorStyle(color: string | undefined, offset: [number, number] | undefined) {
  return `${color ? `--ja-badge-color:${color};` : ''}right:${-(offset?.[0] ?? 0)}px;top:${offset?.[1] ?? 0}px`;
}
export function Badge(props: BadgeProps) {
  return (
    <span
      className={cx('ja-badge', !!props['slot:default'] && 'with-child', props.className)}
      style={props.style}
    >
      {props['slot:default'] && props.children}
      {badgeVisible(props.count, props.dot, props.showZero, props.status) && (
        <span
          className={cx(
            'ja-badge-indicator',
            (props.dot || props.status) && 'dot',
            props.status,
            props.size ?? 'md',
          )}
          role="status"
          aria-atomic="true"
          aria-label={badgeLabel(props.count, props.dot, props.status, props.ariaLabel)}
          title={
            props.title ??
            (props.dot || props.status
              ? badgeLabel(props.count, props.dot, props.status, props.ariaLabel)
              : String(countValue(props.count)))
          }
          style={indicatorStyle(props.color, props.offset)}
        >
          {props.dot || props.status ? '' : displayCount(props.count, props.overflowCount)}
        </span>
      )}
      {props.text && <span className="ja-badge-status-text">{props.text}</span>}
    </span>
  );
}
