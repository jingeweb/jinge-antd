import {
  For,
  type JNode,
  type WithEvents,
  type WithPropSlot,
  type WithSlots,
  cx,
  ref,
  uid,
  vm,
  watch,
} from 'jinge';

import './style.scss';
import { AntDesignRightOutlined } from '../_icon';

export type CollapseItem = { key: string; disabled?: boolean; content?: string } & WithPropSlot<
  'label',
  JNode
> &
  WithSlots<{ content?: JNode; extra?: JNode }>;
export type CollapseProps = {
  items: CollapseItem[];
  activeKeys?: string[];
  defaultActiveKeys?: string[];
  accordion?: boolean;
  disabled?: boolean;
  destroyOnHidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  ghost?: boolean;
  className?: string;
  style?: string;
} & WithEvents<{ change?(activeKeys: string[]): void }>;

function normalize(keys: string[] | undefined, items: CollapseItem[], accordion?: boolean) {
  const available = new Set(items.map((item) => item.key));
  const result = [...new Set(keys ?? [])].filter((key) => available.has(key));
  return accordion ? result.slice(0, 1) : result;
}
function isActive(keys: string[], key: string) {
  return keys.includes(key);
}

function CollapsePanel(
  props: {
    item: CollapseItem;
    open: boolean;
    disabled?: boolean;
    destroyOnHidden?: boolean;
  } & WithEvents<{ toggle(key: string): void; navigate(event: KeyboardEvent): void }>,
) {
  const id = `ja-collapse-${uid()}`;
  const state = vm({ seen: props.open });
  watch(props, 'open', (open) => {
    if (open) state.seen = true;
  });
  return (
    <div className={cx('ja-collapse-panel', props.open && 'open')}>
      <div className="ja-collapse-header">
        <button
          type="button"
          id={`${id}-trigger`}
          className="ja-collapse-trigger"
          disabled={props.disabled || props.item.disabled}
          aria-expanded={props.open}
          aria-controls={`${id}-content`}
          on:click={() => {
            if (!props.disabled && !props.item.disabled) props['on:toggle'](props.item.key);
          }}
          on:keyDown={props['on:navigate']}
        >
          <span className="ja-collapse-arrow" aria-hidden="true">
            <AntDesignRightOutlined />
          </span>
          <span className="ja-collapse-label">{props.item['slot:label'] ?? props.item.label}</span>
        </button>
        {props.item['slot:extra'] && (
          <div className="ja-collapse-extra">{props.item['slot:extra']}</div>
        )}
      </div>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className="ja-collapse-content"
        hidden={!props.open}
      >
        {(props.open || (!props.destroyOnHidden && state.seen)) && (
          <div className="ja-collapse-body">{props.item['slot:content'] ?? props.item.content}</div>
        )}
      </div>
    </div>
  );
}

export function Collapse(props: CollapseProps) {
  const controlled = props.activeKeys !== undefined;
  const state = vm({
    keys: normalize(props.activeKeys ?? props.defaultActiveKeys, props.items, props.accordion),
  });
  const element = ref<HTMLDivElement>();
  function sync() {
    const next = normalize(
      controlled ? props.activeKeys : state.keys,
      props.items,
      props.accordion,
    );
    if (next.length !== state.keys.length || next.some((key, index) => key !== state.keys[index]))
      state.keys = next;
  }
  watch(
    props,
    'activeKeys',
    () => {
      if (controlled) sync();
    },
    { deep: true },
  );
  watch(props, 'items', sync, { deep: true });
  watch(props, 'accordion', sync);
  function toggle(key: string) {
    if (props.disabled) return;
    const active = state.keys.includes(key);
    const next = props.accordion
      ? active
        ? []
        : [key]
      : active
        ? state.keys.filter((value) => value !== key)
        : [...state.keys, key];
    if (!controlled) state.keys = next;
    props['on:change']?.([...next]);
  }
  function navigate(event: KeyboardEvent) {
    if (
      !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const buttons = [
      ...element.value!.querySelectorAll<HTMLButtonElement>(
        ':scope > .ja-collapse-panel > .ja-collapse-header > .ja-collapse-trigger:not(:disabled)',
      ),
    ];
    const index = buttons.indexOf(event.currentTarget as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }
  return (
    <div
      ref={element}
      className={cx(
        'ja-collapse',
        props.size ?? 'md',
        props.bordered === false && 'borderless',
        props.ghost && 'ghost',
        props.className,
      )}
      style={props.style}
    >
      <For loop={props.items} key="key">
        {(each) => (
          <CollapsePanel
            item={each.data}
            open={isActive(state.keys, each.data.key)}
            disabled={props.disabled}
            destroyOnHidden={props.destroyOnHidden}
            on:toggle={toggle}
            on:navigate={navigate}
          />
        )}
      </For>
    </div>
  );
}
