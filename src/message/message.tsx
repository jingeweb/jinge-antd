import {
  AntDesignCheckCircleFilled,
  AntDesignCloseCircleFilled,
  AntDesignExclamationCircleFilled,
  AntDesignInfoCircleFilled,
} from '../icon';
import { z } from '../_util/z';
import {
  type AnyFn,
  Dynamic,
  type FC,
  type JNode,
  TransitionGroup,
  type WithPropSlot,
  bootstrap,
  cx,
  expose,
  isString,
  onMount,
  uid,
  vm,
} from 'jinge';
import { LoadingOutlined } from '../loading';

export type MessageOptions = WithPropSlot<'content', JNode> & {
  duration?: number;
  'on:close'?: () => void;
};

export interface MessageContainerConfig {
  paddingTop?: number;
  paddingLeft?: number;
  paddingRight?: number;
}

const containerConfig: MessageContainerConfig = {
  paddingLeft: 0,
  paddingTop: 0,
  paddingRight: 0
};

function configContainer(config: MessageContainerConfig) {
  Object.assign(containerConfig, config);
}

export interface MessageUpdateOptions {
  type?: MessageConfig['type'];
  content?: string;
  // 'slot:content'?: JNode; // 暂时不支持更新插槽，待jinge-compiler支持。
  duration?: number;
}

type MessageConfig = WithPropSlot<'content', JNode> & {
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  _id: string;
  _p?: Promise<void>;
  _r?: AnyFn;
  _onClose?: () => void;
  _tm: number;
};

export interface MessageInstance {
  close: () => void;
  update: (options: MessageUpdateOptions) => void;
  waitClose: () => Promise<void>;
}

let messageContainer: MessageContainerInstance | undefined = undefined;

function initMessageContainer() {
  const $dv = document.createElement('div');
  document.body.appendChild($dv);
  messageContainer = bootstrap(MessageContainerComponent, $dv);
}

function clearAll() {
  messageContainer?.clear();
}

interface MessageContainerInstance {
  show: (type: MessageConfig['type'], message: string | MessageOptions) => MessageInstance;
  clear: () => void;
}
function MessageContainerComponent() {
  const containerStyle = `padding-top:${containerConfig.paddingTop ?? 0}px;padding-left:${containerConfig.paddingLeft ?? 0}px;padding-right:${containerConfig.paddingRight ?? 0}px;`
  const state = vm({
    messages: [] as MessageConfig[],
    zIndex: 0,
  });
  onMount(() => {
    return z.watchMessageZ((messageZ) => (state.zIndex = messageZ));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: options.content as any,
      'slot:content': options['slot:content'],
      _id: uid(),
      _onClose: options['on:close'],
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

  const icons: Record<string, FC> = vm({
    loading: LoadingOutlined,
    info: AntDesignInfoCircleFilled,
    error: AntDesignCloseCircleFilled,
    warning: AntDesignExclamationCircleFilled,
    success: AntDesignCheckCircleFilled,
  });

  return (
    <div className='ja-message-container' style={`z-index: ${state.zIndex};${containerStyle}`}>
      <TransitionGroup
        enterClass='ja-enter'
        enterActiveClass='ja-enter-active'
        leaveClass='ja-leave'
        leaveActiveClass='ja-leave-active'
        loop={state.messages}
        key='_id'
      >
        {(each) => (
          <div className='ja-message'>
            <Dynamic fc={icons[each.data.type]} className={cx('icon', each.data.type)} />
            <div className='content'>{each.data.content}</div>
          </div>
        )}
      </TransitionGroup>
    </div>
  );
}

function innerShow(type: MessageConfig['type'], options: string | MessageOptions) {
  if (!messageContainer) {
    initMessageContainer();
  }
  return messageContainer!.show(type, options);
}

function showSuccess(options: MessageOptions): MessageInstance;
function showSuccess(content: string): MessageInstance;
function showSuccess(contentOrOptions: string | MessageOptions): MessageInstance {
  return innerShow('success', contentOrOptions);
}

function showError(options: MessageOptions): MessageInstance;
function showError(content: string): MessageInstance;
function showError(contentOrOptions: string | MessageOptions): MessageInstance {
  return innerShow('error', contentOrOptions);
}

function showInfo(options: MessageOptions): MessageInstance;
function showInfo(content: string): MessageInstance;
function showInfo(contentOrOptions: string | MessageOptions): MessageInstance {
  return innerShow('info', contentOrOptions);
}

function showWarning(options: MessageOptions): MessageInstance;
function showWarning(content: string): MessageInstance;
function showWarning(contentOrOptions: string | MessageOptions): MessageInstance {
  return innerShow('warning', contentOrOptions);
}

function showLoading(options: MessageOptions): MessageInstance;
function showLoading(content: string): MessageInstance;
function showLoading(contentOrOptions: string | MessageOptions): MessageInstance {
  return innerShow('loading', contentOrOptions);
}

const message = {
  configContainer,
  success: showSuccess,
  error: showError,
  info: showInfo,
  loading: showLoading,
  warning: showWarning,
  show: innerShow,
  clear: clearAll,
};

export { message };
