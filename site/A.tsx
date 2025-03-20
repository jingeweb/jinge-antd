import { autoUpdate } from '@floating-ui/dom';
import { type JNode, Portal, type Props, Transition } from 'jinge';

export function A(
  props: Props<{
    children: JNode;
  }>,
) {
  autoUpdate;
  return (
    <Portal>
      <Transition isEnter={true}>
        <div>{props.children}</div>
      </Transition>
    </Portal>
  );
}
