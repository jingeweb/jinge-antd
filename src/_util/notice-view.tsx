import { Dynamic, type FC, cx, onMount, ref, registerEvent } from 'jinge';

import { Button } from '../button';
import {
  AntDesignCheckCircleFilled,
  AntDesignCloseCircleFilled,
  AntDesignExclamationCircleFilled,
  AntDesignInfoCircleFilled,
  AntDesignCloseOutlined,
} from '../icon';
import { LoadingOutlined } from '../loading';
import { type NoticeRecord, type NoticeType } from './notice';

const icons: Record<NoticeType, FC> = {
  loading: LoadingOutlined,
  info: AntDesignInfoCircleFilled,
  error: AntDesignCloseCircleFilled,
  warning: AntDesignExclamationCircleFilled,
  success: AntDesignCheckCircleFilled,
};
function noticeIcon(type: NoticeType | undefined) {
  return icons[type ?? 'info'];
}
export function NoticeCard(props: { record: NoticeRecord; kind: 'message' | 'notification' }) {
  const element = ref<HTMLDivElement>();
  onMount(() => {
    const stopIn = registerEvent(element.value!, 'focusin', () => props.record.pause('focus'));
    const stopOut = registerEvent(element.value!, 'focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !element.value!.contains(event.relatedTarget))
        props.record.resume('focus');
    });
    return () => {
      stopIn();
      stopOut();
    };
  });
  return (
    <div
      ref={element}
      className={cx(`ja-${props.kind}`, props.record.options.className)}
      style={props.record.options.style}
      role={props.record.options.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      on:mouseEnter={() => {
        if (props.record.options.pauseOnHover) props.record.pause('hover');
      }}
      on:mouseLeave={() => props.record.resume('hover')}
    >
      {props.record.options['slot:icon'] ? (
        <span className={cx('icon', props.record.options.type)}>
          {props.record.options['slot:icon']}
        </span>
      ) : (
        <Dynamic
          fc={noticeIcon(props.record.options.type)}
          className={cx('icon', props.record.options.type)}
        />
      )}
      <div className="ja-notice-main">
        {props.kind === 'notification' &&
          (props.record.options.title || props.record.options['slot:title']) && (
            <div className="ja-notification-title">
              {props.record.options['slot:title'] ?? props.record.options.title}
            </div>
          )}
        <div className="content">
          {props.record.options['slot:content'] ?? props.record.options.content}
        </div>
        {props.record.options['slot:actions'] && (
          <div className="ja-notification-actions">{props.record.options['slot:actions']}</div>
        )}
      </div>
      {props.record.options.closable && (
        <Button
          type="text"
          size="sm"
          className="ja-notice-close"
          ariaLabel={props.kind === 'notification' ? '关闭通知' : '关闭提示'}
          slot:icon={<AntDesignCloseOutlined />}
          on:click={() => props.record.instance.close()}
        />
      )}
    </div>
  );
}
