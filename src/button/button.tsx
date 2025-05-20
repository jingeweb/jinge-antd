import { LoadingOutlined } from '../loading';
import {
  type JNode,
  type MouseEventHandler,
  type WithEvents,
  type WithOptChildren,
  type WithSlots,
  cx,
} from 'jinge';

export function Button(
  props: {
    className?: string;
    size?: 'lg' | 'sm';
    type?: 'primary' | 'link' | 'default' | 'text';
    loading?: boolean;
    disabled?: boolean;
  } & WithOptChildren<JNode> &
    WithSlots<{
      icon?: JNode;
    }> &
    WithEvents<{
      click?: MouseEventHandler<HTMLButtonElement>;
    }>,
) {
  const onlyIcon = !!props['slot:icon'] && !props['slot:default'];

  return (
    <button
      className={cx(
        'ja-button',
        onlyIcon && 'only-icon',
        props.size,
        props.type ?? 'default',
        props.className,
        (props.loading ?? props.disabled) && 'disabled',
      )}
      disabled={props.loading ?? props.disabled}
      on:click={(evt) => {
        props['on:click']?.(evt);
      }}
    >
      {props.loading ? <LoadingOutlined /> : props['slot:icon']}
      {props.children}
    </button>
  );
}
