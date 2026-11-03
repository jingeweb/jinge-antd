import { context, isObject, isPromise, onUnmount } from 'jinge';

export type ConfirmCallbackResult<Result> = void | boolean | { result: Result };
export type ConfirmCallback<Result> = () =>
  | ConfirmCallbackResult<Result>
  | Promise<ConfirmCallbackResult<Result>>;
export interface ConfirmContext<Result> {
  onConfirm(listener: ConfirmCallback<Result>): () => void;
}
export function createContextOnConfirm(contextKey: symbol) {
  return function onModalConfirm<Result = unknown>(listener: ConfirmCallback<Result>) {
    const ctx = context<ConfirmContext<Result>>(contextKey);
    if (ctx) onUnmount(ctx.onConfirm(listener));
  };
}
export function useConfirmContext<Result>(contextKey: symbol, confirmFn?: ConfirmCallback<Result>) {
  const onConfirmFns = new Set<ConfirmCallback<Result>>();
  if (confirmFn) onConfirmFns.add(confirmFn);
  let active = true,
    running = false;
  let generation = 0;
  function invalidate() {
    generation++;
    running = false;
  }
  onUnmount(() => {
    active = false;
    onConfirmFns.clear();
  });
  context<ConfirmContext<Result>>(contextKey, {
    onConfirm(listener) {
      onConfirmFns.add(listener);
      return () => onConfirmFns.delete(listener);
    },
  });
  async function handleConfirm(options: {
    onSubmittingChange(submitting: boolean): void;
    onSubmitted(preventClose: boolean, resultValue?: Result): void;
    onError?(error: unknown): void;
  }) {
    if (!active || running) return;
    running = true;
    const transaction = generation;
    const current = () => active && transaction === generation;
    let preventClose = false;
    let result: Result | undefined;
    let submitting = false;
    // Freeze subscribers for this transaction; registrations during awaits run next time.
    const listeners = [...onConfirmFns];
    try {
      for (const listener of listeners) {
        if (!current()) return;
        let value = listener();
        if (isPromise<ConfirmCallbackResult<Result>>(value)) {
          if (!submitting) {
            submitting = true;
            options.onSubmittingChange(true);
          }
          value = await value;
        }
        if (!current()) return;
        if (value === false) {
          preventClose = true;
          break;
        }
        if (isObject(value)) result = value.result;
      }
    } catch (error) {
      preventClose = true;
      if (current()) {
        if (options.onError) options.onError(error);
        else console.error(error);
      }
    } finally {
      if (current()) {
        running = false;
        options.onSubmittingChange(false);
      }
    }
    if (current()) options.onSubmitted(preventClose, preventClose ? undefined : result);
  }
  return { onConfirmFns, handleConfirm, invalidate };
}
