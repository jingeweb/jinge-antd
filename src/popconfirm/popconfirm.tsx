import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  vm,
  watch,
} from 'jinge';

import { AntDesignExclamationCircleFilled } from '../_icon';
import {
  type ConfirmCallback,
  type ConfirmContext,
  createContextOnConfirm,
  useConfirmContext,
} from '../_util';
import { z } from '../_util/z';
import { Button } from '../button';
import { Floating, type FloatingDuration, type FloatingPlacement } from '../floating';

export const POPCONFIRM_CONTEXT = Symbol('popconfirmContext');
export type PopconfirmContext = ConfirmContext<unknown>;
export const onPopconfirmConfirm = createContextOnConfirm(POPCONFIRM_CONTEXT);
export type PopconfirmProps = {
  className?: string;
  style?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  dismissable?: boolean;
  keyboard?: boolean;
  placement?: FloatingPlacement;
  delay?: FloatingDuration;
  confirmText?: string;
  cancelText?: string;
  content?: string;
} & WithChildren<JNode> &
  WithPropSlot<'title', JNode> &
  WithSlots<{ content?: JNode; icon?: JNode }> &
  WithEvents<{
    confirm?: ConfirmCallback<void>;
    cancel?: () => void;
    openChange?(open: boolean): void;
    error?(error: unknown): void;
  }>;

export function Popconfirm(props: PopconfirmProps) {
  const controlled = props.open !== undefined;
  const zIndex = z.getPopoverZ();
  const state = vm({ open: props.open ?? props.defaultOpen ?? false, submitting: false });
  const confirm = useConfirmContext(POPCONFIRM_CONTEXT, () => props['on:confirm']?.());
  function setOpen(open: boolean) {
    if (!controlled) state.open = open;
    props['on:openChange']?.(open);
  }
  watch(props, 'open', (open) => {
    if (controlled) state.open = !!open;
  });
  watch(state, 'open', (open) => {
    if (!open) {
      confirm.invalidate();
      state.submitting = false;
    }
  });
  async function handleConfirm() {
    await confirm.handleConfirm({
      onSubmittingChange: (value) => {
        state.submitting = value;
      },
      onSubmitted: (preventClose) => {
        if (!preventClose) setOpen(false);
      },
      onError: (error) => {
        if (props['on:error']) props['on:error'](error);
        else console.error(error);
      },
    });
  }
  return (
    <Floating
      zIndex={zIndex}
      autoFocus
      role="dialog"
      ariaLabel="操作确认"
      delay={props.delay}
      open={state.open}
      disabled={props.disabled}
      on:openChange={(open) => {
        if (!state.submitting) setOpen(open);
      }}
      dismissable={!state.submitting && !!props.dismissable}
      keyboard={!state.submitting && props.keyboard !== false}
      triggerMethod={state.submitting ? 'none' : 'click'}
      offset={10}
      placement={props.placement}
      slot:trigger={props.children}
      style={props.style}
      className={cx('ja-popconfirm', props.className)}
    >
      <div className="ja-popconfirm-title">
        <span className="ja-popconfirm-icon">
          {props['slot:icon'] ?? <AntDesignExclamationCircleFilled />}
        </span>
        {props['slot:title'] ?? <span>{props.title}</span>}
      </div>
      {(props['slot:content'] || props.content) && (
        <div className="ja-popconfirm-content">{props['slot:content'] ?? props.content}</div>
      )}
      <div className="ja-popconfirm-footer">
        <Button
          size="sm"
          disabled={state.submitting}
          on:click={() => {
            props['on:cancel']?.();
            setOpen(false);
          }}
        >
          {props.cancelText ?? '取 消'}
        </Button>
        <Button
          type="primary"
          size="sm"
          disabled={state.submitting}
          loading={state.submitting}
          on:click={handleConfirm}
        >
          {props.confirmText ?? '确 认'}
        </Button>
      </div>
    </Floating>
  );
}
