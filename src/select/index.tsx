import './style.scss';
import { Dropdown, type DropdownOption } from '../dropdown';

import { type WithEvents, cx, isUndefined, vm, watch } from 'jinge';

export function Select<T>(
  props: {
    options: DropdownOption<T>[];
    size?: 'lg' | 'sm' | 'md';
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    value?: T;
  } & WithEvents<{
    change?: (value: T) => void;
  }>,
) {
  const notCtrl = isUndefined(props.value);
  const state = vm({
    open: false,
    value: props.value,
    selectOption: undefined as DropdownOption<T> | undefined,
  });
  function upV(v?: T) {
    state.value = v;
    v !== undefined && (state.selectOption = props.options.find((opt) => opt.value === v));
  }
  watch(props, 'value', upV, { immediate: true });
  watch(props, 'options', () => {
    // options 变化后也要更新下 selectOption
    upV(state.value);
  });

  return (
    <Dropdown
      options={props.options}
      on:change={(v) => {
        if (notCtrl) {
          upV(v);
        }
        props['on:change']?.(v);
      }}
      open={state.open}
      on:openChange={(v) => {
        state.open = v;
      }}
    >
      <button
        disabled={props.disabled}
        className={cx('ja-select', props.size ?? 'md', props.className)}
        on:click={() => {
          state.open = true;
        }}
      >
        {state.selectOption?.label ?? props.placeholder ?? ''}
      </button>
    </Dropdown>
  );
}
