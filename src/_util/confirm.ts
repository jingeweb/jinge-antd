import { context, isObject, isPromise, onUnmount } from 'jinge';

export type ConfirmCallbackResult<Result> =
  | void
  | false
  | {
      result: Result;
    };
export type ConfirmCallback<Result> = () =>
  | ConfirmCallbackResult<Result>
  | Promise<ConfirmCallbackResult<Result>>;

export interface ConfirmContext<Result> {
  onConfirm(listener: ConfirmCallback<Result>): () => void;
}
export function createContextOnConfirm<Result>(contextKey: symbol) {
  return function onModalConfirm(listener: ConfirmCallback<Result>) {
    const ctx = context<ConfirmContext<Result>>(contextKey);
    ctx && onUnmount(ctx.onConfirm(listener));
  };
}

export function useConfirmContext<Result>(contextKey: symbol, confirmFn?: ConfirmCallback<Result>) {
  const onConfirmFns = new Set<ConfirmCallback<Result>>();
  confirmFn && onConfirmFns.add(confirmFn);

  context<ConfirmContext<Result>>(contextKey, {
    onConfirm(listener) {
      onConfirmFns.add(listener);
      return () => onConfirmFns.delete(listener);
    },
  });

  async function handleConfirm(options: {
    onSubmittingChange(submitting: boolean): void;
    onSubmitted(preventClose: boolean, resultValue?: Result | undefined): void;
  }) {
    const listeners = [...onConfirmFns.values()];
    let preventClose = false;
    let result = undefined;
    for await (const listener of listeners) {
      const x = listener();
      if (isPromise<ConfirmCallbackResult<Result>>(x)) {
        options.onSubmittingChange(true);
        try {
          const ret = await x;
          if (ret === false) {
            preventClose = true;
            break;
          } else if (isObject(ret)) {
            result = ret.result;
          }
        } catch (ex) {
          console.error(ex);
          preventClose = true;
          break;
        }
      } else if (x === false) {
        preventClose = true;
        break;
      } else if (isObject(x)) {
        result = x.result;
      }
    }
    options.onSubmittingChange(false);
    options.onSubmitted(preventClose, preventClose ? undefined : result);
  }

  return {
    onConfirmFns,
    handleConfirm,
  };
}
