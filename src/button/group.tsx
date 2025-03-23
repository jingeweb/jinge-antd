import type { JNode, WithChildren } from 'jinge';

export function ButtonGroup(
  props: {
    size: 'small' | 'large';
  } & WithChildren<JNode>,
) {
  return <div>{props.children}</div>;
}
