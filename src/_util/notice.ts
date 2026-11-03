import { type JNode, type WithSlots, uid, vm } from 'jinge';

export type NoticeType = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type NoticePlacement = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type NoticeOptions = {
  type?: NoticeType;
  duration?: number;
  className?: string;
  style?: string;
  closable?: boolean;
  pauseOnHover?: boolean;
  placement?: NoticePlacement;
  'on:close'?: () => void;
  content?: string;
  title?: string;
} & WithSlots<{ content?: JNode; title?: JNode; icon?: JNode; actions?: JNode }>;
export interface NoticeUpdateOptions {
  type?: NoticeType;
  content?: string;
  title?: string;
  duration?: number;
  className?: string;
  style?: string;
  closable?: boolean;
  pauseOnHover?: boolean;
}
export interface NoticeInstance {
  close(): void;
  update(options: NoticeUpdateOptions): void;
  waitClose(): Promise<void>;
}
export interface NoticeRecord {
  id: string;
  options: NoticeOptions;
  instance: NoticeInstance;
  pause(reason: 'hover' | 'focus'): void;
  resume(reason: 'hover' | 'focus'): void;
}
export function createNoticeStore(
  defaultDuration: number,
  maxCount: () => number | undefined,
  onEmpty: () => void,
) {
  const items = vm<NoticeRecord[]>([]);
  const buckets = vm({
    topLeft: [] as NoticeRecord[],
    topRight: [] as NoticeRecord[],
    bottomLeft: [] as NoticeRecord[],
    bottomRight: [] as NoticeRecord[],
  });
  function trim() {
    const limit = maxCount();
    if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
      const excess = items.slice(0, Math.max(0, items.length - Math.max(1, Math.floor(limit))));
      for (const item of excess) item.instance.close();
    }
  }
  function show(options: NoticeOptions): NoticeInstance {
    let closed = false,
      timer = 0,
      started = 0;
    let remaining = normalizeDuration(options.duration ?? defaultDuration);
    const paused = new Set<string>();
    let resolve!: () => void;
    const waiting = new Promise<void>((done) => {
      resolve = done;
    });
    function clearTimer() {
      window.clearTimeout(timer);
      timer = 0;
    }
    function schedule() {
      clearTimer();
      if (!closed && !paused.size && remaining > 0) {
        started = Date.now();
        timer = window.setTimeout(close, remaining);
      }
    }
    function close() {
      if (closed) return;
      closed = true;
      clearTimer();
      paused.clear();
      const index = items.indexOf(record);
      if (index >= 0) items.splice(index, 1);
      if (record.options.placement) {
        const bucket = buckets[record.options.placement];
        const index = bucket.indexOf(record);
        if (index >= 0) bucket.splice(index, 1);
      }
      // Settle and detach before user callbacks, which may close again, throw or create a new notice.
      resolve();
      if (!items.length) onEmpty();
      try {
        record.options['on:close']?.();
      } catch (error) {
        console.error(error);
      }
    }
    const instance: NoticeInstance = {
      close,
      waitClose: () => waiting,
      update(patch) {
        if (closed) return;
        for (const key of [
          'type',
          'title',
          'content',
          'className',
          'style',
          'closable',
          'pauseOnHover',
        ] as const) {
          if (patch[key] !== undefined) Object.assign(record.options, { [key]: patch[key] });
        }
        if (patch.pauseOnHover === false) record.resume('hover');
        if (patch.duration !== undefined) {
          remaining = normalizeDuration(patch.duration);
          record.options.duration = patch.duration;
          schedule();
        }
      },
    };
    const record: NoticeRecord = vm({
      id: uid(),
      options: { ...options },
      instance,
      pause(reason: 'hover' | 'focus') {
        if (closed || paused.has(reason)) return;
        if (!paused.size && timer) remaining = Math.max(1, remaining - (Date.now() - started));
        paused.add(reason);
        clearTimer();
      },
      resume(reason: 'hover' | 'focus') {
        if (!paused.delete(reason) || closed) return;
        if (!paused.size) schedule();
      },
    });
    items.push(record);
    if (options.placement) buckets[options.placement].push(record);
    schedule();
    trim();
    return instance;
  }
  function clear() {
    const snapshot = [...items];
    for (const item of snapshot) item.instance.close();
  }
  return { items, buckets, show, clear, trim };
}
function normalizeDuration(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
