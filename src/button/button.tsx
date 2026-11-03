import {
  type JNode,
  type MouseEventHandler,
  type WithEvents,
  type WithOptChildren,
  type WithSlots,
  type WithExpose,
  context,
  cx,
  expose,
  ref,
} from 'jinge';

import { LoadingOutlined } from '../loading';
import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext, type ButtonSize } from './common';

export type ButtonProps = {
  id?: string;
  className?: string;
  style?: string;
  size?: ButtonSize;
  type?: 'primary' | 'link' | 'default' | 'text';
  htmlType?: 'button' | 'submit' | 'reset';
  shape?: 'default' | 'circle' | 'round';
  danger?: boolean;
  ghost?: boolean;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  title?: string;
  tabIndex?: number;
  ariaLabel?: string;
  ariaDescribedby?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ icon?: JNode }> &
  WithEvents<{ click?: MouseEventHandler<HTMLButtonElement> }> &
  WithExpose<{ focus(): void; blur(): void }>;

export function Button(props: ButtonProps) {
  const group = context<ButtonGroupContext | undefined>(BUTTON_GROUP_CONTEXT);
  const element = ref<HTMLButtonElement>();
  expose({ focus: () => element.value?.focus(), blur: () => element.value?.blur() });
  return (
    <button
      ref={element}
      id={props.id}
      type={props.htmlType ?? 'button'}
      name={props.name}
      value={props.value}
      title={props.title}
      tabIndex={props.tabIndex}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedby}
      aria-busy={props.loading || undefined}
      className={cx(
        'ja-button',
        !!props['slot:icon'] && !props['slot:default'] && 'only-icon',
        props.size ?? group?.size ?? 'md',
        props.type ?? 'default',
        props.shape,
        props.danger && 'danger',
        props.ghost && 'ghost',
        props.block && 'block',
        props.className,
        (props.loading || props.disabled || group?.disabled) && 'disabled',
      )}
      style={props.style}
      disabled={props.loading || props.disabled || group?.disabled}
      on:click={(evt) => {
        if (props.loading || props.disabled || group?.disabled) return;
        props['on:click']?.(evt);
      }}
    >
      {props.loading ? <LoadingOutlined /> : props['slot:icon']}
      {props.children}
    </button>
  );
}
