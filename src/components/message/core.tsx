import { z } from './z';
import {
  type AnyFn,
  TransitionGroup,
  bootstrap,
  cx,
  expose,
  isString,
  setImmediate,
  uid,
  vm,
} from 'jinge';

export interface MessageOptions {
  content: string;
  duration?: number;
  onClose?: () => void;
}

export interface MessageUpdateOptions {
  type?: MessageConfig['type'];
  content?: string;
  duration?: number;
}

interface MessageConfig {
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  content: string;
  _id: string;
  _p?: Promise<void>;
  _r?: AnyFn;
  _onClose?: () => void;
  _tm: number;
}
export interface MessageInstance {
  close: () => void;
  update: (options: MessageUpdateOptions) => void;
  waitClose: () => Promise<void>;
}

let messageContainer: MessageContainerInstance;
interface MessageContainerInstance {
  show: (type: MessageConfig['type'], message: string | MessageOptions) => MessageInstance;
  clear: () => void;
}
function MessageContainerComponent() {
  const state = vm({
    messages: [] as MessageConfig[],
  });
  const store = new Map<string, MessageConfig>();
  function close(message: MessageConfig) {
    if (message._r === undefined) {
      return;
    }
    store.delete(message._id);
    window.clearTimeout(message._tm);
    const idx = state.messages.indexOf(message);
    if (idx >= 0) state.messages.splice(idx, 1);
    message._onClose?.();
    message._r();
  }
  function update(message: MessageConfig, options: MessageUpdateOptions) {
    if (options.type !== undefined) {
      message.type = options.type;
    }
    if (options.content !== undefined) {
      message.content = options.content;
    }
    if (options.duration !== undefined) {
      window.clearTimeout(message._tm);
      if (options.duration > 0) {
        message._tm = window.setTimeout(() => close(message), options.duration);
      }
    }
  }
  function clear() {
    state.messages.length = 0;
    const mcs = [...store.values()];
    store.clear();
    mcs.forEach(close);
  }
  function show(type: MessageConfig['type'], contentOrOptions: string | MessageOptions) {
    const options: MessageOptions = {
      ...(isString(contentOrOptions) ? { content: contentOrOptions } : contentOrOptions),
    };
    const message: MessageConfig = vm({
      type,
      content: options.content,
      _id: uid(),
      _onClose: options.onClose,
      _p: undefined,
      _r: undefined,
      _tm: 0,
    });

    message._p = new Promise<void>((resolve) => {
      message._r = resolve;
    }).then(() => {
      message._r = undefined;
    });

    if (options.duration !== 0) {
      message._tm = window.setTimeout(() => close(message), options.duration ?? 4000);
    }

    state.messages.push(message);

    return {
      close: () => close(message),
      update: (options) => update(message, options),
      waitClose: async () => {
        if (message._r === undefined) return;
        await message._p;
      },
    } as MessageInstance;
  }
  expose({
    clear,
    show,
  });

  const icMap: Record<MessageConfig['type'], string> = vm({
    info: 'icon-[ant-design--info-circle-filled] text-gray-500',
    error: 'icon-[ant-design--close-circle-filled] text-error',
    success: 'icon-[ant-design--check-circle-filled] text-success',
    warning: 'icon-[ant-design--exclamation-circle-filled] text-warning',
    loading: 'icon-[ant-design--loading-outlined] animate-spin text-blue-500',
  });
  return (
    <div
      className='pointer-events-none fixed top-0 left-1/2 -translate-x-1/2'
      style={`z-index: ${z.currentIndex}`}
    >
      <TransitionGroup
        enterClass='transform-[translateY(0)] opacity-100'
        enterActiveClass='ease-in'
        leaveClass='transform-[translateY(-80%)] opacity-0'
        leaveActiveClass='ease-out'
        loop={state.messages}
        key='_id'
      >
        {(each) => (
          <div className='mt-4 flex items-center rounded-lg bg-white px-4 py-2 text-black/85 shadow-xl transition-[transform,opacity] duration-300 will-change-transform'>
            <span
              className={cx('icon mr-2 text-base', each.data.type, icMap[each.data.type])}
            ></span>
            <div className='content'>{each.data.content}</div>
          </div>
        )}
      </TransitionGroup>
    </div>
  );
}

function showSuccess(options: MessageOptions): MessageInstance;
function showSuccess(content: string): MessageInstance;
function showSuccess(contentOrOptions: string | MessageOptions): MessageInstance {
  return messageContainer.show('success', contentOrOptions);
}

function showError(options: MessageOptions): MessageInstance;
function showError(content: string): MessageInstance;
function showError(contentOrOptions: string | MessageOptions): MessageInstance {
  return messageContainer.show('error', contentOrOptions);
}

function showInfo(options: MessageOptions): MessageInstance;
function showInfo(content: string): MessageInstance;
function showInfo(contentOrOptions: string | MessageOptions): MessageInstance {
  return messageContainer.show('info', contentOrOptions);
}

function showWarning(options: MessageOptions): MessageInstance;
function showWarning(content: string): MessageInstance;
function showWarning(contentOrOptions: string | MessageOptions): MessageInstance {
  return messageContainer.show('warning', contentOrOptions);
}

function showLoading(options: MessageOptions): MessageInstance;
function showLoading(content: string): MessageInstance;
function showLoading(contentOrOptions: string | MessageOptions): MessageInstance {
  return messageContainer.show('loading', contentOrOptions);
}

const message = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  loading: showLoading,
  warning: showWarning,
};

export { message };

function initMessageContainer() {
  const $dv = document.createElement('div');
  document.body.appendChild($dv);
  messageContainer = bootstrap(MessageContainerComponent, $dv);
}
if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    // dev 模式下需要延迟初始化，保证编译器在文件末尾插入的 HMR 相关代码先执行。
    setImmediate(() => initMessageContainer());
  } else {
    initMessageContainer();
  }
}
