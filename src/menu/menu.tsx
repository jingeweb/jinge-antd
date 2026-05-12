import {
  type JNode,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  vm,
  watch,
} from 'jinge';

interface InnerMenuOption<T> {
  value: T;
  label?: string;
  'slot:label'?: JNode;
  'slot:icon'?: JNode;
}
export type MenuOption<T> = {
  value: T;
} & WithPropSlot<'label', JNode> &
  WithSlots<{
    icon?: JNode;
  }>;

export function Menu<T>(
  props: {
    value?: T;
    style?: string;
    className?: string;
    options: MenuOption<T>[];
  } & WithEvents<{
    change?: (v: T, evt: Event) => void;
  }>,
) {
  const state = vm({
    value: props.value,
  });

  watch(props, 'value', (v) => {
    state.value = v;
  });

  return (
    <div className={cx('ja-menu', props.className)}>
      {props.options.map((option: InnerMenuOption<T>) => (
        <button
          on:click={(evt) => {
            state.value = option.value;
            props['on:change']?.(option.value, evt);
          }}
          className={cx('ja-menu-item', state.value === option.value && 'ja-active')}
          key={option.value}
        >
          {option['slot:icon']}
          <span className="ja-menu-item-label"> {option['slot:label'] ?? option.label}</span>
        </button>
      ))}
    </div>
  );
}
