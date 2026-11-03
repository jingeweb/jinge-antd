import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithExpose,
  type WithPropSlot,
  type WithSlots,
  Portal,
  expose,
  onUnmount,
  uid,
  vm,
  watch,
} from 'jinge';

import { DialogFrame } from '../_util/dialog';
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type DrawerProps<Result = unknown> = {
  open?: boolean;
  defaultOpen?: boolean;
  placement?: DrawerPlacement;
  size?: 'sm' | 'md' | 'lg';
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: string;
  maskClassName?: string;
  showMask?: boolean;
  closeWhenMaskClick?: boolean;
  closable?: boolean;
  keyboard?: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  ariaLabel?: string;
  describedBy?: string;
  footer?: boolean;
  motion?: boolean;
} & WithChildren<JNode> &
  WithSlots<{ footer?: JNode }> &
  WithPropSlot<'title', JNode> &
  WithEvents<{
    openChange?(open: boolean): void;
    afterClose?(result?: Result): void;
    cancel?(): void;
  }> &
  WithExpose<{ close(result?: Result): void }>;
export function Drawer<Result = unknown>(props: DrawerProps<Result>) {
  const controlled = props.open !== undefined;
  const state = vm({ open: props.open ?? props.defaultOpen ?? false });
  const titleId = `ja-drawer-title-${uid()}`;
  let disposed = false;
  let resultValue: Result | undefined;
  function close(result?: Result) {
    if (disposed || !state.open) return;
    resultValue = result;
    if (!controlled) state.open = false;
    props['on:openChange']?.(false);
  }
  watch(props, 'open', (open) => {
    if (!controlled) return;
    if (open && !state.open) resultValue = undefined;
    state.open = !!open;
  });
  onUnmount(() => {
    disposed = true;
  });
  expose({ close });
  return (
    <Portal>
      {state.open && (
        <DialogFrame
          kind="drawer"
          titleId={titleId}
          labelled={!!(props.title || props['slot:title'])}
          ariaLabel={props.ariaLabel}
          describedBy={props.describedBy}
          placement={props.placement}
          width={props.width ?? (props.size === 'sm' ? 256 : props.size === 'lg' ? 736 : 378)}
          height={props.height ?? 378}
          className={props.className}
          style={props.style}
          maskClassName={props.maskClassName}
          showMask={props.showMask}
          closeWhenMaskClick={props.closeWhenMaskClick}
          keyboard={props.keyboard}
          autoFocus={props.autoFocus}
          returnFocus={props.returnFocus}
          closable={props.closable}
          motion={props.motion}
          footer={props.footer}
          slot:title={props['slot:title'] ?? props.title}
          slot:footer={props['slot:footer']}
          on:cancel={() => {
            props['on:cancel']?.();
            close();
          }}
          on:hidden={() => {
            const result = resultValue;
            queueMicrotask(() => {
              if (!disposed) props['on:afterClose']?.(result);
            });
          }}
        >
          {props['slot:default'] && props.children}
        </DialogFrame>
      )}
    </Portal>
  );
}
