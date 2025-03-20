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
import { z } from '../_util/z';

export function Modal(
  props: {
    open?: boolean;
    closable?: boolean;
    className?: string;
    maskClassName?: string;
    showMask?: boolean;
    closeWhenMaskClick?: boolean;
    footer?: boolean;
  } & WithSlots<{
    default: JNode;
    footer?: JNode;
  }> &
    WithPropSlot<'title', JNode> &
    WithEvents<{
      openChange?(open: boolean): void;
      afterClose?(): void;
    }> &
    WithExpose<{
      close(): void;
    }>,
) {
  // 是否是受控模式
  const ctrlOpt = !isUndefined(props.open);
  const state = vm({
    /** 非受控模式下默认自动打开弹窗 */
    open: ctrlOpt ? !!props.open : true,
  });

  watch(props, 'open', (v) => {
    state.open = !!v;
  });

  onMount(() => {
    return z.increment();
  });

  function close() {
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
          enterClass='opacity-100'
          enterActiveClass='transition-[opacity] duration-[0.2s]'
          leaveActiveClass='transition-[opacity] duration-[0.2s]'
          leaveClass='opacity-0'
          destroyAfterLeave
        >
          <div
            className={cx('ja-modal-mask', props.maskClassName)}
            style={`z-index:${z.currentIndex}`}
            on:click={() => {
              if (props.closeWhenMaskClick !== false) {
                close();
              }
            }}
          ></div>
        </Transition>
      )}
      <Transition
        isEnter={state.open}
        appear
        enterClass='ja-enter'
        enterActiveClass='ja-enter-active'
        leaveActiveClass='ja-leave-active'
        leaveClass='ja-leave'
        destroyAfterLeave
        on:afterLeave={() => {
          props['on:afterClose']?.();
        }}
      >
        <div className={cx(props.className, 'ja-modal')} style={`z-index:${z.currentIndex + 1}`}>
          <div className='ja-modal-title'>
            <span>{props['slot:title'] ?? props.title}</span>
            {props.closable !== false && (
              <button
                on:click={() => {
                  close();
                }}
              >
                X
              </button>
            )}
          </div>
          <div className='ja-modal-content'>{props.children}</div>
          <div className='ja-modal-footer'>
            <button>取消</button>
            <button>确认</button>
          </div>
        </div>
      </Transition>
    </>
  );
}
