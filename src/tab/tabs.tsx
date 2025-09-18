import {
  type JNode,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  isUndefined,
  onMount,
  ref,
  vm,
  watch,
} from 'jinge';

export type TabOption<K> = {
  key: K;
} & WithPropSlot<'label', JNode> &
  WithSlots<{
    icon?: JNode;
  }>;

export function Tabs<K extends string | number>(
  props: {
    activeKey?: K;
    options: TabOption<K>[];
    className?: string;
  } & WithEvents<{
    change(activeKey: K): void;
  }>,
) {
  const notCtrl = isUndefined(props.activeKey);
  const container = ref<HTMLDivElement>();
  const indicator = ref<HTMLDivElement>();
  const state = vm<{
    active?: K;
  }>({
    active: props.activeKey ?? props.options[0]?.key,
  });
  watch(props, 'activeKey', (v) => {
    state.active = v;
  });

  function updateIndicator(v?: K) {
    if (!container.value || !indicator.value) return;
    const idx = props.options.findIndex((opt) => opt.key === v);
    const $el = container.value.children[idx] as HTMLDivElement;
    const sty = indicator.value.style;
    sty.width = `${$el.offsetWidth}px`;
    sty.left = `${$el.offsetLeft}px`;
  }

  watch(state, 'active', (v) => {
    updateIndicator(v);
  });

  onMount(() => {
    updateIndicator(state.active);
  });

  return (
    <div className={cx('ja-tabs', props.className)} ref={container}>
      {props.options.map((opt) => (
        <div
          on:click={() => {
            if (notCtrl) {
              state.active = opt.key;
            }
            props['on:change']?.(opt.key);
          }}
          className={cx('ja-tab-item', opt.key === state.active && 'active')}
          key={opt.key}
        >
          {opt['slot:label'] ?? opt.label}
        </div>
      ))}
      <div className='indicator' ref={indicator}></div>
    </div>
  );
}
