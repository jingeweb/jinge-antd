import { type JNode, type WithEvents, type WithPropSlot, bootstrap, destroyComponent } from 'jinge';
import { Modal } from './modal';

export interface ModalInstance<Result> {
  close: (result?: Result) => void;
  waitForClose: () => Promise<Result | undefined>;
}
export type ShowModalOptions<Result> = {
  closable?: boolean;
  showMask?: boolean;
  closeWhenMaskClick?: boolean;
  size?: 'sm' | 'lg';
  confirmText?: string;
  confirmValue?: Result;
  cancelText?: string;
  cancelValue?: Result;
  className?: string;
} & WithPropSlot<'title', JNode> &
  WithPropSlot<'content', JNode> &
  WithEvents<{
    afterClose?(result?: Result): void;
  }>;

function showModal<Result = unknown>(options: ShowModalOptions<Result>) {
  const $dv = document.createElement('div');
  document.body.appendChild($dv);
  let resFn: ((result: Result | undefined) => void) | undefined = undefined;
  let closeP: Promise<Result | undefined> | undefined = new Promise((res) => (resFn = res));
  const host = bootstrap(Modal<Result>, $dv, {
    title: options.title,
    'slot:title': options['slot:title'],
    closable: options.closable,
    className: options.className,
    closeWhenMaskClick: options.closeWhenMaskClick,
    showMask: options.showMask,
    confirmText: options.confirmText,
    confirmValue: options.confirmValue,
    cancelText: options.cancelText,
    cancelValue: options.cancelValue,
    'slot:default': options['slot:content'] ?? options.content,
    'on:afterClose': (result) => {
      destroyComponent(host);
      resFn?.(result);
      resFn = undefined;
      closeP = undefined;
      options['on:afterClose']?.(result);
    },
  });
  async function waitForClose() {
    if (!closeP) return;
    return await closeP;
  }
  return {
    close: (result) => host?.close(result),
    waitForClose,
  } as ModalInstance<Result>;
}

export const modal = {
  show: showModal,
};
