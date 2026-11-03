import {
  For,
  type JNode,
  type WithPropSlot,
  bootstrap,
  destroyComponent,
  onMount,
  vm,
} from 'jinge';

import {
  createNoticeStore,
  type NoticeInstance,
  type NoticeType,
  type NoticeUpdateOptions,
} from '../_util/notice';
import { NoticeCard } from '../_util/notice-view';
import { z } from '../_util/z';

export type MessageOptions = WithPropSlot<'content', JNode> & {
  duration?: number;
  className?: string;
  style?: string;
  closable?: boolean;
  pauseOnHover?: boolean;
  'on:close'?: () => void;
};
export type MessageUpdateOptions = Omit<NoticeUpdateOptions, 'title'>;
export type MessageType = NoticeType;
export interface MessageInstance extends Omit<NoticeInstance, 'update'> {
  update(options: MessageUpdateOptions): void;
}
export interface MessageContainerConfig {
  paddingTop?: number;
  paddingLeft?: number;
  paddingRight?: number;
  maxCount?: number;
}
const containerConfig = vm<MessageContainerConfig>({
  paddingTop: 16,
  paddingLeft: 0,
  paddingRight: 0,
  maxCount: 5,
});
interface MessageService {
  store: ReturnType<typeof createNoticeStore>;
  destroy(): void;
}
let current: MessageService | undefined;
function getService() {
  if (current) return current;
  const container = document.createElement('div');
  document.body.append(container);
  const store = createNoticeStore(
    4000,
    () => containerConfig.maxCount,
    () => {
      queueMicrotask(() => {
        if (current === service && !store.items.length) {
          current = undefined;
          service.destroy();
        }
      });
    },
  );
  function MessageContainer() {
    const state = vm({ zIndex: z.currentIndex + 100 });
    onMount(() =>
      z.watchMessageZ((value) => {
        state.zIndex = value;
      }),
    );
    return (
      <div
        className="ja-message-container"
        data-ja-notices
        role="region"
        aria-label="全局提示"
        style={`z-index:${state.zIndex};padding-top:${containerConfig.paddingTop ?? 0}px;padding-left:${containerConfig.paddingLeft ?? 0}px;padding-right:${containerConfig.paddingRight ?? 0}px`}
      >
        <For loop={store.items} key="id">
          {(each) => <NoticeCard kind="message" record={each.data} />}
        </For>
      </div>
    );
  }
  const host = bootstrap(MessageContainer, container);
  const service: MessageService = {
    store,
    destroy() {
      destroyComponent(host);
      container.remove();
    },
  };
  current = service;
  return service;
}
function show(type: NoticeType, content: string | MessageOptions): MessageInstance {
  return getService().store.show({
    ...(typeof content === 'string' ? { content } : content),
    type,
  });
}
export const message = {
  configContainer(config: MessageContainerConfig) {
    Object.assign(containerConfig, config);
    current?.store.trim();
  },
  show,
  success: (options: string | MessageOptions) => show('success', options),
  error: (options: string | MessageOptions) => show('error', options),
  info: (options: string | MessageOptions) => show('info', options),
  warning: (options: string | MessageOptions) => show('warning', options),
  loading: (options: string | MessageOptions) => show('loading', options),
  clear() {
    current?.store.clear();
  },
};
