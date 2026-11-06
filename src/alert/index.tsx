import './style.scss';
import {
  Dynamic,
  type JNode,
  type WithPropSlot,
  type WithSlots,
  type WithEvents,
  cx,
  vm,
  watch,
} from 'jinge';

import { AntDesignCloseOutlined } from '../_icon';
import { statusIcon, type FeedbackStatus } from '../_util/status-icon';

export type AlertType = FeedbackStatus;
export type AlertProps = {
  type?: AlertType;
  description?: string;
  showIcon?: boolean;
  closable?: boolean;
  closeLabel?: string;
  visible?: boolean;
  defaultVisible?: boolean;
  banner?: boolean;
  role?: 'alert' | 'status' | 'none';
  className?: string;
  style?: string;
} & WithPropSlot<'title', JNode> &
  WithSlots<{ description?: JNode; icon?: JNode; action?: JNode }> &
  WithEvents<{ close?(event: MouseEvent): void; visibleChange?(visible: boolean): void }>;
export function Alert(props: AlertProps) {
  const controlled = props.visible !== undefined;
  const state = vm({ visible: props.visible ?? props.defaultVisible ?? true });
  watch(props, 'visible', (value) => {
    if (controlled) state.visible = !!value;
  });
  function close(event: MouseEvent) {
    event.stopPropagation();
    if (!state.visible) return;
    props['on:close']?.(event);
    if (event.defaultPrevented) return;
    if (!controlled) state.visible = false;
    props['on:visibleChange']?.(false);
  }
  return (
    <>
      {state.visible && (
        <div
          className={cx(
            'ja-alert',
            props.type ?? 'info',
            props.banner && 'banner',
            props.className,
          )}
          style={props.style}
          role={
            props.role === 'none'
              ? undefined
              : (props.role ?? (props.type === 'error' ? 'alert' : 'status'))
          }
          aria-atomic={props.role === 'none' ? undefined : 'true'}
        >
          {props.showIcon !== false && (
            <span className="ja-alert-icon" aria-hidden="true">
              {props['slot:icon'] ? (
                props['slot:icon']
              ) : (
                <Dynamic fc={statusIcon(props.type ?? 'info')} />
              )}
            </span>
          )}
          <div className="ja-alert-main">
            <div className="ja-alert-title">{props['slot:title'] ?? props.title}</div>
            {(props.description || props['slot:description']) && (
              <div className="ja-alert-description">
                {props['slot:description'] ?? props.description}
              </div>
            )}
          </div>
          {props['slot:action'] && <div className="ja-alert-action">{props['slot:action']}</div>}
          {props.closable && (
            <button
              type="button"
              className="ja-alert-close"
              aria-label={props.closeLabel ?? '关闭提示'}
              on:click={close}
            >
              <AntDesignCloseOutlined />
            </button>
          )}
        </div>
      )}
    </>
  );
}
