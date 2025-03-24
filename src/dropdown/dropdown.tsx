import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithPropSlot,
  cx,
  vm,
  watch,
} from 'jinge';
import { Floating } from '../floating';
import { z } from '../_util/z';

interface InnerDropdownOption<T> {
  value: T;
  label?: string;
  'slot:label'?: JNode;
}
export type DropdownOption<T> = {
  value: T;
} & WithPropSlot<'label', JNode>;

export function Dropdown<T>(
  props: {
    value?: T;
    style?: string;
    className?: string;
    options: DropdownOption<T>[];
  } & WithChildren<JNode> &
    WithEvents<{
      change?: (v: T, evt: Event) => void;
    }>,
) {
  const zIndex = z.getDropdownZ();
  const state = vm({
    value: props.value,
    open: false,
  });

  watch(props, 'value', (v) => {
    state.value = v;
  });

  return (
    <Floating
      zIndex={zIndex}
      style={props.style}
      className={cx('ja-dropdown', props.className)}
      slot:trigger={props.children}
      open={state.open}
      on:openChange={(v) => {
        state.open = v;
      }}
      placement='bottom'
    >
      {props.options.map((option: InnerDropdownOption<T>) => (
        <button
          on:click={(evt) => {
            state.value = option.value;
            props['on:change']?.(option.value, evt);
            state.open = false;
          }}
          className={cx('ja-dropdown-item', state.value === option.value && 'ja-active')}
          key={option.value}
        >
          {option['slot:label'] ?? option.label}
        </button>
      ))}
    </Floating>
  );
}
