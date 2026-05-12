import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  vm,
} from 'jinge';

import {
  type ConfirmCallback,
  type ConfirmContext,
  createContextOnConfirm,
  useConfirmContext,
} from '../_util';
import { z } from '../_util/z';
import { Button } from '../button';
import { Floating, type FloatingDuration, type FloatingPlacement } from '../floating';
import { AntDesignExclamationCircleFilled } from '../icon';

export const POPCONFIRM_CONTEXT = Symbol('popconfirmContext');
export type PopconfirmContext = ConfirmContext<unknown> & {};

/**
 * 监听弹窗的 confirm 按钮点击。会在 onUnmount 中自动取消监听。
 */
export const onPopconfirmConfirm = createContextOnConfirm(POPCONFIRM_CONTEXT);
export function Popconfirm(
  props: {
    className?: string;
    delay?: FloatingDuration;
    placement?: FloatingPlacement;
    confirmText?: string;
    cancelText?: string;
    content?: string;
  } & WithChildren<JNode> &
    WithPropSlot<'title', JNode> &
    WithSlots<{ content?: JNode }> &
    WithEvents<{
      confirm?: ConfirmCallback<void>;
      cancel?: () => void;
    }>,
) {
  const zIndex = z.getPopoverZ();
  const state = vm({
    isOpen: false,
    submitting: false,
  });

  const confirmContext = useConfirmContext(POPCONFIRM_CONTEXT, () => props['on:confirm']?.());

  async function handleConfirm() {
    await confirmContext.handleConfirm({
      onSubmittingChange(submitting) {
        state.submitting = submitting;
      },
      onSubmitted(preventClose, _result) {
        if (!preventClose) {
          state.isOpen = false;
        }
      },
    });
  }
  return (
    <Floating
      zIndex={zIndex}
      delay={props.delay}
      open={state.isOpen}
      on:openChange={(v) => {
        state.isOpen = v;
      }}
      dismissable={false}
      triggerMethod="click"
      offset={10}
      placement={props.placement}
      slot:trigger={props.children}
      className={cx('ja-popconfirm', props.className)}
    >
      <div className="ja-popconfirm-title">
        <span className="ja-popconfirm-icon">
          <AntDesignExclamationCircleFilled />
        </span>
        {props['slot:title'] ?? <span>{props.title}</span>}
      </div>
      {props['slot:content'] && (
        <div className="ja-popconfirm-content">{props['slot:content']}</div>
      )}
      {props.content && <div className="ja-popconfirm-content">{props.content}</div>}
      <div className="ja-popconfirm-footer">
        <Button
          size="sm"
          on:click={() => {
            props['on:cancel']?.();
            state.isOpen = false;
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
