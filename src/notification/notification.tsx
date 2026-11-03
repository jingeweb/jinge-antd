import {
  For,
  type JNode,
  type WithPropSlot,
  type WithSlots,
  bootstrap,
  destroyComponent,
  onMount,
  vm,
} from 'jinge';

import {
  createNoticeStore,
  type NoticeInstance,
  type NoticePlacement,
  type NoticeRecord,
  type NoticeType,
  type NoticeUpdateOptions,
} from '../_util/notice';
import { NoticeCard } from '../_util/notice-view';
import { z } from '../_util/z';
export type NotificationPlacement = NoticePlacement;
export type NotificationType = NoticeType;
export type NotificationOptions = {
  type?: NoticeType;
  placement?: NotificationPlacement;
  duration?: number;
  closable?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  style?: string;
  'on:close'?: () => void;
  content?: string;
} & WithPropSlot<'title', JNode> &
  WithSlots<{ content?: JNode; actions?: JNode; icon?: JNode }>;
export type NotificationInstance = NoticeInstance;
export type NotificationUpdateOptions = NoticeUpdateOptions;
export interface NotificationConfig {
  placement?: NotificationPlacement;
  duration?: number;
  maxCount?: number;
}
const config = vm<NotificationConfig>({ placement: 'topRight', duration: 4500, maxCount: 5 });
interface NotificationService {
  store: ReturnType<typeof createNoticeStore>;
  destroy(): void;
}
let current: NotificationService | undefined;
function NotificationStack(props: { records: NoticeRecord[]; placement: NotificationPlacement }) {
  return (
    <div className="ja-notification-stack" data-placement={props.placement}>
      <For loop={props.records} key="id">
        {(each) => <NoticeCard kind="notification" record={each.data} />}
      </For>
    </div>
  );
}
function getService() {
  if (current) return current;
  const container = document.createElement('div');
  document.body.append(container);
  const store = createNoticeStore(
    4500,
    () => config.maxCount,
    () => {
      queueMicrotask(() => {
        if (current === service && !store.items.length) {
          current = undefined;
          service.destroy();
        }
      });
    },
  );
  function NotificationContainer() {
    const state = vm({ zIndex: z.currentIndex + 100 });
    onMount(() =>
      z.watchMessageZ((value) => {
        state.zIndex = value;
      }),
    );
    return (
      <div
        className="ja-notification-container"
        data-ja-notices
        role="region"
        aria-label="通知"
        style={`z-index:${state.zIndex}`}
      >
        <NotificationStack records={store.buckets.topLeft} placement="topLeft" />
        <NotificationStack records={store.buckets.topRight} placement="topRight" />
        <NotificationStack records={store.buckets.bottomLeft} placement="bottomLeft" />
        <NotificationStack records={store.buckets.bottomRight} placement="bottomRight" />
      </div>
    );
  }
  const host = bootstrap(NotificationContainer, container);
  const service: NotificationService = {
    store,
    destroy() {
      destroyComponent(host);
      container.remove();
    },
  };
  current = service;
  return service;
}
function open(options: NotificationOptions): NotificationInstance {
  return getService().store.show({
    ...options,
    type: options.type ?? 'info',
    placement: options.placement ?? config.placement ?? 'topRight',
    duration: options.duration ?? config.duration ?? 4500,
    closable: options.closable ?? true,
    pauseOnHover: options.pauseOnHover ?? true,
  });
}
export const notification = {
  open,
  success: (options: NotificationOptions) => open({ ...options, type: 'success' }),
  error: (options: NotificationOptions) => open({ ...options, type: 'error' }),
  info: (options: NotificationOptions) => open({ ...options, type: 'info' }),
  warning: (options: NotificationOptions) => open({ ...options, type: 'warning' }),
  loading: (options: NotificationOptions) => open({ ...options, type: 'loading' }),
  config(options: NotificationConfig) {
    Object.assign(config, options);
    current?.store.trim();
  },
  clear() {
    current?.store.clear();
  },
};
