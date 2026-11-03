import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithExpose,
  type WithPropSlot,
  type WithSlots,
  Portal,
  expose,
  onUnmount,
  uid,
  vm,
  watch,
} from 'jinge';

import {
  type ConfirmCallback,
  type ConfirmContext,
  createContextOnConfirm,
  useConfirmContext,
} from '../_util';
import { DialogFrame } from '../_util/dialog';
import { Button } from '../button';

export const MODAL_CONTEXT = Symbol('modalContext');
export type ModalContext = ConfirmContext<unknown>;
export const onModalConfirm = createContextOnConfirm(MODAL_CONTEXT);
export type ModalProps<Result = unknown> = {
  open?: boolean;
  defaultOpen?: boolean;
  closable?: boolean;
  className?: string;
  style?: string;
  maskClassName?: string;
  showMask?: boolean;
  closeWhenMaskClick?: boolean;
  keyboard?: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  ariaLabel?: string;
  describedBy?: string;
  width?: number | string;
  centered?: boolean;
  size?: 'sm' | 'md' | 'lg';
  motion?: boolean;
  footer?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmValue?: Result;
  cancelValue?: Result;
} & WithChildren<JNode> &
  WithSlots<{ footer?: JNode }> &
  WithPropSlot<'title', JNode> &
  WithEvents<{
    openChange?(open: boolean): void;
    afterClose?(result?: Result): void;
    confirm?: ConfirmCallback<Result>;
    cancel?(): void;
    error?(error: unknown): void;
  }> &
  WithExpose<{ close(result?: Result): void }>;

export function Modal<Result = unknown>(props: ModalProps<Result>) {
  const controlled = props.open !== undefined;
  const state = vm({ open: props.open ?? props.defaultOpen ?? true, submitting: false });
  const titleId = `ja-modal-title-${uid()}`;
  let resultValue: Result | undefined;
  let disposed = false;
  const confirm = useConfirmContext<Result>(MODAL_CONTEXT, () =>
    props['on:confirm']
      ? props['on:confirm']()
      : props.confirmValue !== undefined
        ? { result: props.confirmValue }
        : undefined,
  );
  function close(result?: Result) {
    if (disposed || !state.open) return;
    resultValue = result;
    if (!controlled) state.open = false;
    props['on:openChange']?.(false);
  }
  function cancel() {
    if (state.submitting) return;
    props['on:cancel']?.();
    close(props.cancelValue);
  }
  async function handleConfirm() {
    await confirm.handleConfirm({
      onSubmittingChange: (value) => {
        state.submitting = value;
      },
      onSubmitted: (preventClose, result) => {
        if (!preventClose) close(result);
      },
      onError: (error) => {
        if (props['on:error']) props['on:error'](error);
        else console.error(error);
      },
    });
  }
  watch(props, 'open', (open) => {
    if (!controlled) return;
    if (open && !state.open) resultValue = undefined;
    state.open = !!open;
  });
  watch(state, 'open', (open) => {
    if (!open) {
      confirm.invalidate();
      state.submitting = false;
    }
  });
  onUnmount(() => {
    disposed = true;
  });
  expose({ close });
  return (
    <Portal>
      {state.open && (
        <DialogFrame
          kind="modal"
          titleId={titleId}
          labelled={!!(props.title || props['slot:title'])}
          ariaLabel={props.ariaLabel}
          describedBy={props.describedBy}
          className={props.className}
          style={props.style}
          maskClassName={props.maskClassName}
          showMask={props.showMask}
          closeWhenMaskClick={props.closeWhenMaskClick}
          keyboard={props.keyboard}
          autoFocus={props.autoFocus}
          returnFocus={props.returnFocus}
          closable={props.closable}
          submitting={state.submitting}
          width={props.width ?? (props.size === 'sm' ? 360 : props.size === 'lg' ? 800 : 520)}
          centered={props.centered ?? true}
          motion={props.motion}
          footer={props.footer}
          on:cancel={cancel}
          on:hidden={() => {
            const result = resultValue;
            queueMicrotask(() => {
              if (!disposed) props['on:afterClose']?.(result);
            });
          }}
          slot:title={props['slot:title'] ?? props.title}
          slot:footer={
            props['slot:footer'] ?? (
              <>
                <Button disabled={state.submitting} on:click={cancel}>
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
              </>
            )
          }
        >
          {props['slot:default'] && props.children}
        </DialogFrame>
      )}
    </Portal>
  );
}
