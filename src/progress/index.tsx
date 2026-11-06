import { type JNode, type WithSlots, cx } from 'jinge';

import './style.scss';
import { AntDesignCheckOutlined, AntDesignCloseOutlined } from '../_icon';

export type ProgressStatus = 'normal' | 'active' | 'success' | 'exception';
export interface ProgressInfo {
  percent: number;
  status: ProgressStatus;
}
export type ProgressProps = {
  percent?: number;
  type?: 'line' | 'circle';
  status?: ProgressStatus;
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trailColor?: string;
  showInfo?: boolean;
  format?: (percent: number, status: ProgressStatus) => string;
  ariaLabel?: string;
  valueText?: string;
  className?: string;
  style?: string;
} & WithSlots<{ info?: (info: ProgressInfo) => JNode }>;
function percent(value: number = 0) {
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value)) * 100) / 100 : 0;
}
function status(value: ProgressStatus | undefined, progress: number | undefined) {
  return value ?? (percent(progress) >= 100 ? 'success' : 'normal');
}
function infoText(
  value: number | undefined,
  state: ProgressStatus | undefined,
  format: ProgressProps['format'],
) {
  if (format) return format(percent(value), status(state, value));
  return `${percent(value)}%`;
}
function accessibleValue(
  value: number | undefined,
  state: ProgressStatus | undefined,
  format: ProgressProps['format'],
) {
  if (format) return format(percent(value), status(state, value));
  const resolved = status(state, value);
  return `${percent(value)}%${resolved === 'success' ? '（完成）' : resolved === 'exception' ? '（失败）' : ''}`;
}
function stroke(value: number | undefined, size: ProgressProps['size']) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(1, Math.min(20, value))
    : size === 'sm'
      ? 4
      : size === 'lg'
        ? 12
        : 8;
}
function radius(value: number | undefined, size: ProgressProps['size']) {
  return 50 - stroke(value, size) / 2;
}
function rootStyle(
  style: string | undefined,
  color: string | undefined,
  trail: string | undefined,
  type: ProgressProps['type'],
  width: number | undefined,
  size: ProgressProps['size'],
) {
  const diameter =
    width !== undefined && Number.isFinite(width)
      ? Math.max(48, Math.min(512, width))
      : size === 'sm'
        ? 80
        : size === 'lg'
          ? 160
          : 120;
  return `${style ?? ''};${color ? `--ja-progress-color:${color};` : ''}${trail ? `--ja-progress-trail:${trail};` : ''}${type === 'circle' ? `width:${diameter}px` : ''}`;
}
function ProgressInfoView(props: {
  percent?: number;
  status?: ProgressStatus;
  format?: ProgressProps['format'];
}) {
  return (
    <>
      {!props.format &&
        (status(props.status, props.percent) === 'success' ? (
          <AntDesignCheckOutlined />
        ) : status(props.status, props.percent) === 'exception' ? (
          <AntDesignCloseOutlined />
        ) : null)}
      {infoText(props.percent, props.status, props.format)}
    </>
  );
}
export function Progress(props: ProgressProps) {
  return (
    <div
      className={cx(
        'ja-progress',
        props.type ?? 'line',
        props.size ?? 'md',
        status(props.status, props.percent),
        props.className,
      )}
      style={rootStyle(
        props.style,
        props.strokeColor,
        props.trailColor,
        props.type,
        props.width,
        props.size,
      )}
      role="progressbar"
      aria-label={props.ariaLabel ?? '进度'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent(props.percent)}
      aria-valuetext={props.valueText ?? accessibleValue(props.percent, props.status, props.format)}
    >
      {props.type === 'circle' ? (
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle
            className="ja-progress-trail"
            cx="50"
            cy="50"
            r={radius(props.strokeWidth, props.size)}
            fill="none"
            stroke-width={stroke(props.strokeWidth, props.size)}
          />
          <circle
            className="ja-progress-path"
            opacity={percent(props.percent) === 0 ? 0 : 1}
            cx="50"
            cy="50"
            r={radius(props.strokeWidth, props.size)}
            fill="none"
            stroke-width={stroke(props.strokeWidth, props.size)}
            pathLength="100"
            stroke-dasharray={`${percent(props.percent)} 100`}
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
      ) : (
        <div
          className="ja-progress-track"
          style={`height:${stroke(props.strokeWidth, props.size)}px`}
        >
          <div className="ja-progress-bar" style={`width:${percent(props.percent)}%`} />
        </div>
      )}
      {props.showInfo !== false && (
        <div className="ja-progress-info">
          {props['slot:info']?.({
            percent: percent(props.percent),
            status: status(props.status, props.percent),
          }) ?? (
            <ProgressInfoView percent={props.percent} status={props.status} format={props.format} />
          )}
        </div>
      )}
    </div>
  );
}
