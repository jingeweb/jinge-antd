import { type JNode, Portal, Transition, type WithChildren } from 'jinge';

export function A(props: WithChildren<JNode>) {
  return (
    <Portal>
      <Transition isEnter={true}>
        <div>{props.children}</div>
      </Transition>
    </Portal>
  );
}
