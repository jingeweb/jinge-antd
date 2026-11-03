import './style.scss';
import { Dynamic, type JNode, type WithOptChildren, type WithSlots, cx, uid } from 'jinge';

import { type FeedbackStatus, statusIcon } from '../_util/status-icon';

export type ResultStatus = FeedbackStatus | '403' | '404' | '500';
export type ResultProps = {
  status?: ResultStatus;
  title?: string;
  subTitle?: string;
  showIcon?: boolean;
  announce?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ title?: JNode; subTitle?: JNode; icon?: JNode; extra?: JNode }>;
const titles: Record<ResultStatus, string> = {
  success: '操作成功',
  info: '提示',
  warning: '请检查操作',
  error: '操作失败',
  '403': '无权访问',
  '404': '页面不存在',
  '500': '服务器错误',
};
const subtitles: Partial<Record<ResultStatus, string>> = {
  '403': '请联系管理员确认访问权限。',
  '404': '请检查地址或返回上一页。',
  '500': '请稍后重试或联系管理员。',
};
function resultTitle(title: string | undefined, status: ResultStatus = 'info') {
  return title ?? titles[status];
}
function resultSubtitle(title: string | undefined, status: ResultStatus = 'info') {
  return title ?? subtitles[status] ?? '';
}
function isCode(status: ResultStatus | undefined) {
  return status === '403' || status === '404' || status === '500';
}
function icon(status: ResultStatus = 'info') {
  return statusIcon(status === '403' || status === '404' || status === '500' ? 'info' : status);
}
export function Result(props: ResultProps) {
  const titleId = `ja-result-title-${uid()}`;
  return (
    <section
      className={cx('ja-result', `status-${props.status ?? 'info'}`, props.className)}
      style={props.style}
      role={props.announce ? 'status' : undefined}
      aria-atomic={props.announce ? 'true' : undefined}
      aria-labelledby={
        props['slot:title'] || resultTitle(props.title, props.status) ? titleId : undefined
      }
      aria-label={
        props['slot:title'] || resultTitle(props.title, props.status)
          ? undefined
          : (props.ariaLabel ?? '操作结果')
      }
    >
      {props.showIcon !== false && (
        <div className="ja-result-icon" aria-hidden="true">
          {props['slot:icon'] ? (
            props['slot:icon']
          ) : isCode(props.status) ? (
            <span className="ja-result-code">{props.status}</span>
          ) : (
            <Dynamic fc={icon(props.status)} />
          )}
        </div>
      )}
      {(props['slot:title'] || resultTitle(props.title, props.status)) && (
        <div id={titleId} className="ja-result-title">
          {props['slot:title'] ? (
            props['slot:title']
          ) : (
            <h2>{resultTitle(props.title, props.status)}</h2>
          )}
        </div>
      )}
      {(props['slot:subTitle'] || resultSubtitle(props.subTitle, props.status)) && (
        <div className="ja-result-subtitle">
          {props['slot:subTitle']
            ? props['slot:subTitle']
            : resultSubtitle(props.subTitle, props.status)}
        </div>
      )}
      {props['slot:extra'] && <div className="ja-result-extra">{props['slot:extra']}</div>}
      {props['slot:default'] && <div className="ja-result-content">{props.children}</div>}
    </section>
  );
}
