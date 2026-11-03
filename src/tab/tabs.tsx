import {
  For,
  type JNode,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  onMount,
  onUnmount,
  ref,
  uid,
  vm,
  watch,
} from 'jinge';

export type TabOption<K = string | number> = {
  key: K;
  disabled?: boolean;
  content?: string;
  ariaLabel?: string;
} & WithPropSlot<'label', JNode> &
  WithSlots<{ icon?: JNode; content?: JNode }>;
export type TabsProps<K extends string | number = string | number> = {
  options: TabOption<K>[];
  activeKey?: K;
  defaultActiveKey?: K;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  activation?: 'automatic' | 'manual';
  destroyOnHidden?: boolean;
  type?: 'line' | 'card';
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithEvents<{ change?(activeKey: K): void }>;

function available<K>(options: TabOption<K>[], key?: K) {
  return options.some((item) => item.key === key && !item.disabled);
}
function stopKey<K>(options: TabOption<K>[], focused?: K, active?: K) {
  return available(options, focused)
    ? focused
    : available(options, active)
      ? active
      : options.find((item) => !item.disabled)?.key;
}
function TabPanel<K>(props: {
  item: TabOption<K>;
  active: boolean;
  id: string;
  destroyOnHidden?: boolean;
}) {
  const state = vm({ seen: props.active });
  watch(props, 'active', (active) => {
    if (active) state.seen = true;
  });
  return (
    <div
      role="tabpanel"
      id={`${props.id}-panel`}
      aria-labelledby={props.id}
      className="ja-tab-panel"
      tabIndex={0}
      hidden={props.active ? undefined : true}
    >
      {(props.active || (state.seen && !props.destroyOnHidden)) && (
        <div className="ja-tab-content">{props.item['slot:content'] ?? props.item.content}</div>
      )}
    </div>
  );
}

export function Tabs<K extends string | number>(props: TabsProps<K>) {
  const controlled = props.activeKey !== undefined;
  const initial = props.activeKey ?? props.defaultActiveKey;
  const state = vm<{ active?: K; focused?: K }>({
    active: available(props.options, initial)
      ? initial
      : controlled
        ? undefined
        : props.options.find((item) => !item.disabled)?.key,
  });
  const list = ref<HTMLDivElement>();
  const indicator = ref<HTMLDivElement>();
  const ids = new Map<K, string>();
  function tabId(key: K) {
    let id = ids.get(key);
    if (!id) {
      id = `ja-tab-${uid()}`;
      ids.set(key, id);
    }
    return id;
  }
  let frame = 0;
  let disposed = false;
  let resize: ResizeObserver | undefined;
  let mutation: MutationObserver | undefined;
  function measure() {
    frame = 0;
    if (disposed || !indicator.value || !list.value) return;
    const button = state.active === undefined ? null : document.getElementById(tabId(state.active));
    const style = indicator.value.style;
    if (!button || !list.value.contains(button)) {
      style.display = 'none';
      return;
    }
    style.display = '';
    if (props.orientation === 'vertical') {
      style.top = `${button.offsetTop}px`;
      style.height = `${button.offsetHeight}px`;
      style.left = '';
      style.width = '';
    } else {
      style.left = `${button.offsetLeft}px`;
      style.width = `${button.offsetWidth}px`;
      style.top = '';
      style.height = '';
    }
  }
  function schedule() {
    if (!disposed && !frame) frame = requestAnimationFrame(measure);
  }
  function sync() {
    const key = controlled ? props.activeKey : state.active;
    state.active = available(props.options, key)
      ? key
      : controlled
        ? undefined
        : props.options.find((item) => !item.disabled)?.key;
    if (!available(props.options, state.focused)) state.focused = undefined;
    schedule();
  }
  watch(props, 'activeKey', sync);
  watch(props, 'options', sync, { deep: true });
  watch(props, 'orientation', schedule);
  watch(state, 'active', schedule);
  function select(key: K) {
    if (props.disabled || !available(props.options, key) || state.active === key) return;
    if (!controlled) state.active = key;
    props['on:change']?.(key);
  }
  function navigate(event: KeyboardEvent, key: K) {
    if (props.disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(key);
      return;
    }
    const vertical = props.orientation === 'vertical';
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    if (![previous, next, 'Home', 'End'].includes(event.key)) return;
    const enabled = props.options.filter((item) => !item.disabled);
    if (!enabled.length) return;
    event.preventDefault();
    const index = enabled.findIndex((item) => item.key === key);
    const target =
      enabled[
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? enabled.length - 1
            : (index + (event.key === next ? 1 : -1) + enabled.length) % enabled.length
      ];
    state.focused = target.key;
    const button = document.getElementById(tabId(target.key));
    button?.focus();
    button?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    if (props.activation !== 'manual') select(target.key);
  }
  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') resize = new ResizeObserver(schedule);
    function observe() {
      resize?.disconnect();
      if (list.value) {
        resize?.observe(list.value);
        for (const button of list.value.querySelectorAll('[role=tab]'))
          resize?.observe(button, { box: 'border-box' });
      }
      schedule();
    }
    mutation = new window.MutationObserver(observe);
    mutation.observe(list.value!, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    observe();
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    mutation?.disconnect();
    resize?.disconnect();
    window.removeEventListener('resize', schedule);
    document.fonts?.removeEventListener('loadingdone', schedule);
  });
  return (
    <div
      className={cx(
        'ja-tabs',
        props.orientation ?? 'horizontal',
        props.type ?? 'line',
        props.size ?? 'md',
        props.centered && 'centered',
        props.className,
      )}
      style={props.style}
    >
      <div
        role="tablist"
        aria-label={props.ariaLabel ?? '标签页'}
        aria-orientation={props.orientation ?? 'horizontal'}
        className="ja-tab-list"
        ref={list}
      >
        <For loop={props.options} key="key">
          {(each) => (
            <button
              type="button"
              role="tab"
              id={tabId(each.data.key)}
              aria-controls={`${tabId(each.data.key)}-panel`}
              aria-label={each.data.ariaLabel}
              aria-selected={each.data.key === state.active}
              disabled={props.disabled || each.data.disabled}
              tabIndex={
                !props.disabled &&
                each.data.key === stopKey(props.options, state.focused, state.active)
                  ? 0
                  : -1
              }
              className={cx('ja-tab-item', each.data.key === state.active && 'active')}
              on:click={() => {
                state.focused = each.data.key;
                select(each.data.key);
              }}
              on:keyDown={(event) => navigate(event, each.data.key)}
            >
              {each.data['slot:icon'] && (
                <span className="ja-tab-icon" aria-hidden="true">
                  {each.data['slot:icon']}
                </span>
              )}
              {each.data['slot:label'] ?? each.data.label}
            </button>
          )}
        </For>
        <div className="indicator" ref={indicator} aria-hidden="true"></div>
      </div>
      <div className="ja-tab-panels">
        <For loop={props.options} key="key">
          {(each) => (
            <TabPanel
              item={each.data}
              active={each.data.key === state.active}
              id={tabId(each.data.key)}
              destroyOnHidden={props.destroyOnHidden}
            />
          )}
        </For>
      </div>
    </div>
  );
}
