import {
  type JNode,
  type WithChildren,
  type WithEvents,
  cx,
  onMount,
  ref,
  registerEvent,
} from 'jinge';

import type { FloatingRole } from './common';

/** Lifecycle belongs to the mounted panel, including when If destroys it before an animation completes. */
export function FloatingPanel(
  props: {
    id: string;
    role: FloatingRole;
    ariaLabel?: string;
    ariaMultiselectable?: boolean;
    className?: string;
    style?: string;
    motion?: boolean;
  } & WithChildren<JNode> &
    WithEvents<{
      mount(el: HTMLDivElement): void;
      unmount(): void;
      blur(event: FocusEvent): void;
      enter(): void;
      leave(evt: MouseEvent): void;
    }>,
) {
  const element = ref<HTMLDivElement>();
  onMount(() => {
    const stopFocus = registerEvent(element.value!, 'focusout', props['on:blur']);
    props['on:mount'](element.value!);
    return () => {
      stopFocus();
      props['on:unmount']();
    };
  });
  return (
    <div
      ref={element}
      id={props.id}
      tabIndex={-1}
      role={props.role}
      aria-label={props.ariaLabel}
      aria-multiselectable={props.ariaMultiselectable}
      className={cx('ja-floating', props.motion !== false && 'ja-floating-motion', props.className)}
      style={props.style}
      on:mouseEnter={props['on:enter']}
      on:mouseLeave={props['on:leave']}
    >
      {props.children}
    </div>
  );
}
