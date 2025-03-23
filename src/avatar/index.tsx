import { type JNode, type WithSlots, cx } from 'jinge';

export function Avatar(
  props: {
    size?: 'small' | 'large';
    className?: string;
  } & WithSlots<{
    icon?: JNode;
  }>,
) {
  return <div className={cx(props.className)}></div>;
}
