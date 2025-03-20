import { type JNode, type WithEvents, type WithPropSlot, bootstrap, destroyComponent } from 'jinge';
import { Modal } from './modal';

export interface ModalInstance {
  close: () => void;
  waitForClose: () => Promise<void>;
}
export type ShowModalOptions = {
  closable?: boolean;
  showMask?: boolean;
  closeWhenMaskClick?: boolean;
  size?: 'sm' | 'lg';
} & WithPropSlot<'title', JNode> &
  WithPropSlot<'content', JNode> &
  WithEvents<{
    afterClose?(): void;
  }>;

function showModal(options: ShowModalOptions) {
  const $dv = document.createElement('div');
  document.body.appendChild($dv);
  let resFn: (() => void) | undefined = undefined;
  const closeP = new Promise<void>((res) => (resFn = res));
  const host = bootstrap(Modal, $dv, {
    title: options.title,
    'slot:title': options['slot:title'],
    closable: options.closable,
    closeWhenMaskClick: options.closeWhenMaskClick,
    showMask: options.showMask,
    'slot:default': options['slot:content'] ?? options.content,
    'on:afterClose': () => {
      destroyComponent(host);
      resFn?.();
      resFn = undefined;
      options['on:afterClose']?.();
    },
  });
  async function waitForClose() {
    if (!resFn) return;
    await closeP;
  }
  return {
    close: () => host?.close(),
    waitForClose,
  };
}

export const modal = {
  show: showModal,
};
