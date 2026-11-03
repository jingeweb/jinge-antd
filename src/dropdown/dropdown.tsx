import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithSlots,
  type ComponentHost,
  cx,
  getFirstDOM,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  vm,
  watch,
} from 'jinge';

import { z } from '../_util/z';
import { Floating, type FloatingPlacement, type FloatingTrigger } from '../floating';
import { Menu, type MenuOption, type MenuValue } from '../menu';
export type DropdownProps<T extends MenuValue = MenuValue> = {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  value?: T | null;
  defaultValue?: T;
  selectable?: boolean;
  closeOnSelect?: boolean;
  options?: MenuOption<T>[];
  triggerMethod?: FloatingTrigger;
  placement?: FloatingPlacement;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithChildren<JNode> &
  WithSlots<{ content?: JNode }> &
  WithEvents<{
    change?(value: T, event: Event): void;
    openChange?(open: boolean, event?: Event): void;
  }>;
export function Dropdown<T extends MenuValue>(props: DropdownProps<T>, host: ComponentHost) {
  const controlled = props.open !== undefined,
    controlledValue = props.value !== undefined;
  const state = vm({
    open: !!(props.open ?? props.defaultOpen) && !props.disabled,
    value: controlledValue ? (props.value ?? undefined) : props.defaultValue,
  });
  const menu = ref<typeof Menu>();
  const layer = z.getDropdownZ();
  let trigger: HTMLElement | undefined,
    originalDisabled: string | null = null,
    disposed = false,
    frame = 0;
  let edge: 'first' | 'last' = 'first',
    focusRequested = true;
  function blocked() {
    return (
      props.disabled ||
      trigger?.matches(':disabled') ||
      trigger?.getAttribute('aria-disabled') === 'true'
    );
  }
  function focusMenu() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed && state.open && !blocked()) menu.value?.focus(edge);
    });
  }
  function request(open: boolean, event?: Event) {
    if (disposed || (open && blocked()) || state.open === open) return;
    if (open) focusRequested = event?.type !== 'mouseenter' && event?.type !== 'focusin';
    if (!controlled) state.open = open;
    props['on:openChange']?.(open, event);
    if (open && focusRequested) focusMenu();
  }
  function select(value: T, event: Event) {
    if (props.disabled || props.loading) return;
    if (
      !controlledValue &&
      (props.selectable ?? (props.value !== undefined || props.defaultValue !== undefined))
    )
      state.value = value;
    props['on:change']?.(value, event);
    if (props.closeOnSelect !== false) {
      request(false, event);
      trigger?.focus();
    }
  }
  function dismiss(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
    request(false, event);
    // Tab's native default action starts from the trigger, so it can leave a body Portal normally.
    trigger?.focus();
  }
  function syncDisabled() {
    if (!trigger || disposed) return;
    if (props.disabled) trigger.setAttribute('aria-disabled', 'true');
    else if (originalDisabled === null) trigger.removeAttribute('aria-disabled');
    else trigger.setAttribute('aria-disabled', originalDisabled);
  }
  watch(props, 'open', (open) => {
    if (controlled) {
      state.open = !!open && !props.disabled;
      if (state.open && focusRequested) focusMenu();
    }
  });
  watch(props, 'value', (value) => {
    if (controlledValue) state.value = value ?? undefined;
  });
  watch(props, 'disabled', (disabled) => {
    syncDisabled();
    if (disabled) {
      request(false);
      state.open = false;
    } else if (controlled) state.open = !!props.open;
  });
  watch(props, 'loading', (loading) => {
    if (!loading && state.open && focusRequested) focusMenu();
  });
  onMount(() => {
    const target = getFirstDOM<Node>(host);
    if (!(target instanceof HTMLElement))
      throw new Error('Dropdown trigger must have a stable HTMLElement root.');
    trigger = target;
    originalDisabled = trigger.getAttribute('aria-disabled');
    syncDisabled();
    const stops = [
      registerEvent(
        trigger,
        'click',
        (event) => {
          if (blocked()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          } else edge = 'first';
        },
        true,
      ),
      registerEvent(trigger, 'keydown', (event) => {
        if (blocked()) {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) event.preventDefault();
          return;
        }
        if (event.isComposing) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          focusRequested = true;
          edge = event.key === 'ArrowUp' ? 'last' : 'first';
          if (state.open && focusRequested) focusMenu();
          else request(true, event);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          focusRequested = true;
          edge = 'first';
          request(!state.open, event);
        } else if (event.key === 'Tab' && state.open) {
          request(false, event);
        } else if (event.key === 'Escape' && state.open) {
          event.preventDefault();
          event.stopPropagation();
          request(false, event);
        }
      }),
    ];
    if (state.open && focusRequested) focusMenu();
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    if (trigger) {
      if (originalDisabled === null) trigger.removeAttribute('aria-disabled');
      else trigger.setAttribute('aria-disabled', originalDisabled);
    }
  });
  return (
    <Floating
      zIndex={layer}
      role="menu"
      ariaLabel={props.ariaLabel ?? '操作菜单'}
      open={state.open}
      disabled={props.disabled}
      className={cx('ja-dropdown', props.className)}
      style={props.style}
      slot:trigger={props.children}
      triggerMethod={props.triggerMethod ?? 'click'}
      placement={props.placement ?? 'bottom-start'}
      offset={4}
      on:openChange={request}
    >
      {props['slot:content'] ? (
        props['slot:content']
      ) : props.loading ? (
        <div role="status" className="ja-dropdown-status">
          {props.loadingText ?? '加载中…'}
        </div>
      ) : (
        <Menu
          ref={menu}
          rootRole="presentation"
          options={props.options ?? []}
          value={state.value ?? null}
          selectable={
            props.selectable ?? (props.value !== undefined || props.defaultValue !== undefined)
          }
          emptyText={props.emptyText ?? '暂无操作'}
          on:change={select}
          on:dismiss={dismiss}
        />
      )}
    </Floating>
  );
}
