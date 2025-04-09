import { type JNode, type WithChildren, type WithEvents, cx, isUndefined, vm, watch } from 'jinge';
import { Floating } from '../floating';
import { z } from '../_util/z';
import { Menu, type MenuOption } from '../menu';

export function Dropdown<T>(
  props: {
    open?: boolean;
    value?: T;
    style?: string;
    className?: string;
    options: MenuOption<T>[];
  } & WithChildren<JNode> &
    WithEvents<{
      change?: (v: T, evt: Event) => void;
      openChange?: (open: boolean) => void;
    }>,
) {
  const notCtrl = isUndefined(props.open);
  const zIndex = z.getDropdownZ();
  const state = vm({
    open: !!props.open,
  });

  watch(props, 'open', (v) => {
    state.open = !!v;
  });

  return (
    <Floating
      zIndex={zIndex}
      style={props.style}
      className={cx('ja-dropdown', props.className)}
      slot:trigger={props.children}
      open={state.open}
      on:openChange={(v) => {
        if (notCtrl) {
          state.open = v;
        }
        props['on:openChange']?.(v);
      }}
      placement='bottom'
    >
      <Menu
        options={props.options}
        on:change={(v, evt) => {
          props['on:change']?.(v, evt);
          if (notCtrl) {
            state.open = false;
          }
          props['on:openChange']?.(false);
        }}
        value={props.value}
      />
    </Floating>
  );
}
