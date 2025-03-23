import { context, isPromise, onUnmount } from 'jinge';

export type ConfirmCallback = () => void | boolean | Promise<void | boolean>;
export interface ConfirmContext {
  onConfirm(listener: ConfirmCallback): () => void;
}
export function createContextOnConfirm(contextKey: symbol) {
  return function onModalConfirm(listener: ConfirmCallback) {
    const ctx = context<ConfirmContext>(contextKey);
    ctx && onUnmount(ctx.onConfirm(listener));
  };
}

export function useConfirmContext(contextKey: symbol, confirmFn?: ConfirmCallback) {
  const onConfirmFns = new Set<ConfirmCallback>();
  confirmFn && onConfirmFns.add(confirmFn);

  context<ConfirmContext>(contextKey, {
    onConfirm(listener) {
      onConfirmFns.add(listener);
      return () => onConfirmFns.delete(listener);
    },
  });

  async function handleConfirm(options: {
    onSubmittingChange(submitting: boolean): void;
    onSubmitted(submitted: boolean): void;
  }) {
    const listeners = [...onConfirmFns.values()];
    let prevent = false;
    for await (const listener of listeners) {
      const x = listener();
      if (isPromise<boolean>(x)) {
        // state.submitting = true;
        options.onSubmittingChange(true);
        try {
          const ret = await x;
          if (ret === false) {
            prevent = true;
            continue;
          }
        } catch (_ex) {
          console.error(_ex);
          prevent = true;
          continue;
        }
      } else if (x === false) {
        prevent = true;
        continue;
      }
    }
    options.onSubmittingChange(false);
    // state.submitting = false;
    options.onSubmitted(!prevent);

    // if (!prevent) {
    //   close();
    // }
  }

  return {
    onConfirmFns,
    handleConfirm,
  };
}
