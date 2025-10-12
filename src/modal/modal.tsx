import {
  type ConfirmCallback,
  type ConfirmContext,
  createContextOnConfirm,
  useConfirmContext,
} from '../_util';

import {
  type JNode,
  Transition,
  type WithEvents,
  type WithExpose,
  type WithPropSlot,
  type WithSlots,
  cx,
  expose,
  isUndefined,
  onMount,
  vm,
  watch,
} from 'jinge';

import { AntDesignCloseCircleOutlined } from '../icon';
import { Button } from '../button';
import { z } from '../_util/z';

export const MODAL_CONTEXT = Symbol('modalContext');
export type ModalContext = ConfirmContext<unknown> & {};

/**
 * 监听弹窗的 confirm 按钮点击。会在 onUnmount 中自动取消监听。
 */
export const onModalConfirm = createContextOnConfirm(MODAL_CONTEXT);

export function Modal<Result = unknown>(
  props: {
    open?: boolean;
    closable?: boolean;
    className?: string;
    maskClassName?: string;
    showMask?: boolean;
    closeWhenMaskClick?: boolean;
    footer?: boolean;
    confirmText?: string;
    cancelText?: string;
    confirmValue?: Result;
    cancelValue?: Result;
  } & WithSlots<{
    default: JNode;
    footer?: JNode;
  }> &
    WithPropSlot<'title', JNode> &
    WithEvents<{
      openChange?(open: boolean): void;
      afterClose?(result?: Result): void;
      confirm?: ConfirmCallback<Result>;
      cancel?(): void;
    }> &
    WithExpose<{
      close(result?: Result): void;
    }>,
) {
  // 是否是受控模式
  const ctrlOpt = !isUndefined(props.open);
  const state = vm({
    /** 非受控模式下默认自动打开弹窗 */
    open: ctrlOpt ? !!props.open : true,
    submitting: false,
  });

  const confirmValue = props.confirmValue;
  const cancelValue = props.cancelValue;
  let resultValue = cancelValue as Result | undefined;

  const confirmContext = useConfirmContext<Result>(MODAL_CONTEXT, () => {
    if (props['on:confirm']) {
      return props['on:confirm']();
    } else {
      return confirmValue !== undefined ? { result: confirmValue } : undefined;
    }
  });

  async function handleConfirm() {
    await confirmContext.handleConfirm({
      onSubmittingChange(submitting) {
        state.submitting = submitting;
      },
      onSubmitted(preventClose, result) {
        if (!preventClose) {
          close(result);
        }
      },
    });
  }

  watch(props, 'open', (v) => {
    state.open = !!v;
  });

  onMount(() => {
    return z.increment();
  });

  function close(result?: Result) {
    resultValue = result;
    if (ctrlOpt) {
      props['on:openChange']?.(false);
    } else {
      state.open = false;
    }
  }

  expose({
    close,
  });

  return (
    <>
      {props.showMask !== false && (
        <Transition
          isEnter={state.open}
          appear
          enterClass="opacity-100"
          enterActiveClass="transition-[opacity] duration-[0.2s]"
          leaveActiveClass="transition-[opacity] duration-[0.2s]"
          leaveClass="opacity-0"
          destroyAfterLeave
        >
          <div
            className={cx('ja-modal-mask', props.maskClassName)}
            style={`z-index:${z.currentIndex}`}
            on:click={() => {
              if (props.closeWhenMaskClick !== false) {
                close(cancelValue);
              }
            }}
          ></div>
        </Transition>
      )}
      <Transition
        isEnter={state.open}
        appear
        enterClass="ja-enter"
        enterActiveClass="ja-enter-active"
        leaveActiveClass="ja-leave-active"
        leaveClass="ja-leave"
        destroyAfterLeave
        on:afterLeave={() => {
          props['on:afterClose']?.(resultValue);
        }}
      >
        <div
          className={cx(props.className, 'ja-modal')}
          style={`z-index:${z.currentIndex + 1}`}
        >
          <div className="ja-modal-title">
            <span>{props['slot:title'] ?? props.title}</span>
            {props.closable !== false && (
              <button
                className="ja-close"
                on:click={() => {
                  close(cancelValue);
                }}
              >
                <AntDesignCloseCircleOutlined />
              </button>
            )}
          </div>
          <div className="ja-modal-content">{props.children}</div>
          <div className="ja-modal-footer">
            <Button
              on:click={() => {
                props['on:cancel']?.();
                close(cancelValue);
              }}
            >
              {props.cancelText ?? '取 消'}
            </Button>
            <Button
              type="primary"
              disabled={state.submitting}
              loading={state.submitting}
              on:click={handleConfirm}
            >
              {props.confirmText ?? '确 认'}
            </Button>
          </div>
        </div>
      </Transition>
    </>
  );
}
