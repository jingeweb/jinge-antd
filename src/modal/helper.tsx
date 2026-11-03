import { type JNode, type WithPropSlot, bootstrap, destroyComponent } from 'jinge';

import { Modal, type ModalProps } from './modal';
export interface ModalInstance<Result> {
  close(result?: Result): void;
  waitForClose(): Promise<Result | undefined>;
}
export type ShowModalOptions<Result> = Omit<
  ModalProps<Result>,
  'open' | 'defaultOpen' | 'children' | 'slot:default' | 'ref'
> &
  WithPropSlot<'content', JNode>;
function showModal<Result = unknown>(options: ShowModalOptions<Result>): ModalInstance<Result> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let resolve!: (result: Result | undefined) => void;
  const closed = new Promise<Result | undefined>((done) => {
    resolve = done;
  });
  let finished = false;
  const host = bootstrap(Modal<Result>, container, {
    ...options,
    'slot:default': options['slot:content'] ?? options.content,
    'on:afterClose': (result) => {
      if (finished) return;
      finished = true;
      queueMicrotask(() => {
        destroyComponent(host);
        container.remove();
        resolve(result);
        options['on:afterClose']?.(result);
      });
    },
  });
  return {
    close(result) {
      if (!finished) host.close(result);
    },
    waitForClose: () => closed,
  };
}
export const modal = { show: showModal };
