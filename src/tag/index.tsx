import './style.scss';
import {
  type JNode,
  type WithChildren,
  type WithSlots,
  type WithEvents,
  cx,
  vm,
  watch,
} from 'jinge';

import { AntDesignCloseOutlined } from '../_icon';
export type TagColor = 'default' | 'success' | 'processing' | 'error' | 'warning';
export type TagProps = {
  className?: string;
  style?: string;
  color?: TagColor;
  bordered?: boolean;
  closable?: boolean;
  disabled?: boolean;
  closeLabel?: string;
  visible?: boolean;
  defaultVisible?: boolean;
} & WithChildren<JNode> &
  WithSlots<{ icon?: JNode }> &
  WithEvents<{ close?(event: MouseEvent): void; visibleChange?(visible: boolean): void }>;
export function Tag(props: TagProps) {
  const controlled = props.visible !== undefined;
  const state = vm({ visible: props.visible ?? props.defaultVisible ?? true });
  watch(props, 'visible', (value) => {
    if (controlled) state.visible = !!value;
  });
  function close(event: MouseEvent) {
    event.stopPropagation();
    if (props.disabled || !state.visible) return;
    props['on:close']?.(event);
    if (event.defaultPrevented) return;
    if (!controlled) state.visible = false;
    props['on:visibleChange']?.(false);
  }
  return (
    <>
      {state.visible && (
        <span
          className={cx(
            'ja-tag',
            props.className,
            props.color ?? 'default',
            props.bordered === false && 'borderless',
            props.disabled && 'disabled',
          )}
          style={props.style}
        >
          {props['slot:icon'] && <span className="ja-tag-icon">{props['slot:icon']}</span>}
          <span className="ja-tag-content">{props.children}</span>
          {props.closable && (
            <button
              type="button"
              className="ja-tag-close"
              aria-label={props.closeLabel ?? '移除标签'}
              disabled={props.disabled}
              on:click={close}
            >
              <AntDesignCloseOutlined />
            </button>
          )}
        </span>
      )}
    </>
  );
}
