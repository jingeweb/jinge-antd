import { LoadingOutlined } from '../loading';
import {
  type JNode,
  type MouseEventHandler,
  type WithEvents,
  type WithOptChildren,
  WithSlots,
  cx,
} from 'jinge';

export function Button(
  props: {
    className?: string;
    size?: 'lg' | 'sm';
    type?: 'primary' | 'link';
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
  return (
    <button
      className={cx(
        'ja-button',
        props.className,
        props.size,
        (props.loading || props.disabled) && 'disabled',
      )}
      disabled={props.loading || props.disabled}
      on:click={(evt) => {
        props['on:click']?.(evt);
      }}
    >
      {props.loading ? <LoadingOutlined /> : props['slot:icon']}
      {props.children}
    </button>
  );
}
