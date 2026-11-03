import { onUnmount, vm, watch } from 'jinge';

import { navigationHref } from '../_util/navigation';
import { z } from '../_util/z';
import { type MenuOption, type MenuProps, type MenuValue, menuChildren, menuLabel } from './common';
type Entry<T extends MenuValue> = { option: MenuOption<T>; parent?: T; disabled: boolean };
export function useMenu<T extends MenuValue>(
  props: MenuProps<T>,
  root: () => HTMLElement | undefined,
) {
  const controlled = props.value !== undefined,
    controlledOpen = props.openKeys !== undefined;
  const mode = props.mode ?? 'vertical',
    layer = z.getDropdownZ();
  const state = vm({
    value: controlled ? (props.value ?? undefined) : props.defaultValue,
    open: [...(props.openKeys ?? props.defaultOpenKeys ?? [])],
    active: undefined as T | undefined,
    disabled: !!props.disabled,
  });
  let entries = new Map<T, Entry<T>>();
  const elements = new Map<T, () => HTMLElement | undefined>();
  let disposed = false,
    frame = 0,
    buffer = '',
    time = 0;
  function descendants(value: T, parent: T): boolean {
    let next = entries.get(value)?.parent;
    while (next !== undefined) {
      if (next === parent) return true;
      next = entries.get(next)?.parent;
    }
    return false;
  }
  function visible() {
    return [...entries.values()].filter((entry) => {
      if (entry.disabled || state.disabled) return false;
      let parent = entry.parent;
      while (parent !== undefined) {
        if (!state.open.includes(parent)) return false;
        parent = entries.get(parent)?.parent;
      }
      return true;
    });
  }
  function reconcile() {
    const next = new Map<T, Entry<T>>();
    function walk(options: MenuOption<T>[], parent?: T, disabled = false) {
      for (const option of options) {
        const blocked =
          disabled ||
          !!option.disabled ||
          (option.href !== undefined && navigationHref(option.href) === undefined);
        if (option.type !== 'group' && option.type !== 'divider')
          next.set(option.value, { option, parent, disabled: blocked });
        if (option.type !== 'divider')
          walk(option.children ?? [], option.type === 'group' ? parent : option.value, blocked);
      }
    }
    walk(props.options);
    entries = next;
    state.disabled = !!props.disabled;
    state.open = [...new Set(controlledOpen ? (props.openKeys ?? []) : state.open)].filter(
      (value) => menuChildren(entries.get(value)?.option.children) && !entries.get(value)?.disabled,
    );
    const candidates = visible();
    if (!candidates.some((entry) => entry.option.value === state.active))
      state.active = (
        candidates.find((entry) => entry.option.value === state.value) ?? candidates[0]
      )?.option.value;
  }
  function focus(value?: T) {
    cancelAnimationFrame(frame);
    frame = 0;
    if (
      !disposed &&
      value !== undefined &&
      visible().some((entry) => entry.option.value === value)
    ) {
      state.active = value;
      const element = elements.get(value)?.();
      if (element?.isConnected && !element.closest('[hidden]')) {
        element.focus();
        return;
      }
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (value !== undefined && visible().some((entry) => entry.option.value === value)) {
        state.active = value;
        elements.get(value)?.()?.focus();
      } else if (!visible().length) root()?.focus();
    });
  }
  function open(value: T, expanded: boolean, event?: Event) {
    const entry = entries.get(value);
    if (!entry || entry.disabled || state.disabled || !menuChildren(entry.option.children)) return;
    let keys = expanded
      ? [...state.open, value]
      : state.open.filter((key) => key !== value && !descendants(key, value));
    if (expanded && props.accordion) {
      const siblings = keys.filter(
        (key) => key !== value && entries.get(key)?.parent === entry.parent,
      );
      keys = keys.filter(
        (key) => !siblings.some((sibling) => key === sibling || descendants(key, sibling)),
      );
    }
    keys = [...new Set(keys)];
    if (!controlledOpen) {
      state.open = keys;
      if (!expanded && state.active !== undefined && descendants(state.active, value))
        state.active = value;
      reconcile();
    }
    props['on:openChange']?.(keys, event);
  }
  function activate(value: T, event: Event) {
    const entry = entries.get(value);
    if (!entry || state.disabled || entry.disabled) {
      event.preventDefault();
      return;
    }
    state.active = value;
    if (menuChildren(entry.option.children)) {
      open(value, !state.open.includes(value), event);
      return;
    }
    if (props.selectable !== false && !controlled) state.value = value;
    props['on:change']?.(value, event);
    if (mode === 'horizontal' && state.open.length) {
      let parent = entry.parent;
      while (parent !== undefined && entries.get(parent)?.parent !== undefined)
        parent = entries.get(parent)?.parent;
      if (!controlledOpen) {
        state.open = [];
        reconcile();
      }
      props['on:openChange']?.([], event);
      if (parent !== undefined) focus(parent);
    }
  }
  function firstChild(value: T, last = false) {
    const candidates = [...entries.values()].filter(
      (entry) => entry.parent === value && !entry.disabled,
    );
    return (last ? candidates.at(-1) : candidates[0])?.option.value;
  }
  function key(value: T, event: KeyboardEvent) {
    if (event.isComposing || state.disabled || event.ctrlKey || event.metaKey || event.altKey)
      return;
    if (frame && state.active !== undefined) value = state.active;
    const entry = entries.get(value);
    if (!entry || entry.disabled) return;
    if (event.key === 'Tab') {
      props['on:dismiss']?.(event);
      return;
    }
    const horizontalRoot = mode === 'horizontal' && entry.parent === undefined;
    const scope = visible().filter((item) => mode !== 'horizontal' || item.parent === entry.parent);
    const index = scope.findIndex((item) => item.option.value === value);
    if (
      (horizontalRoot && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
      (!horizontalRoot && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
    ) {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      focus(scope[(index + delta + scope.length) % scope.length]?.option.value);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focus((event.key === 'Home' ? scope[0] : scope.at(-1))?.option.value);
    } else if (
      (horizontalRoot && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) ||
      (!horizontalRoot && event.key === 'ArrowRight')
    ) {
      if (menuChildren(entry.option.children)) {
        event.preventDefault();
        open(value, true, event);
        focus(firstChild(value, event.key === 'ArrowUp'));
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      const parent = entry.parent ?? (state.open.includes(value) ? value : undefined);
      if (parent !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        open(parent, false, event);
        focus(parent);
      } else if (event.key === 'Escape') props['on:dismiss']?.(event);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      elements.get(value)?.()?.click();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      buffer = Date.now() - time > 500 ? event.key : buffer + event.key;
      time = Date.now();
      const query = buffer.split('').every((character) => character === buffer[0])
        ? buffer[0]
        : buffer;
      const ordered = [...scope.slice(index + 1), ...scope.slice(0, index + 1)];
      const found = ordered.find((item) =>
        menuLabel(item.option).toLocaleLowerCase().startsWith(query.toLocaleLowerCase()),
      );
      if (found) {
        event.preventDefault();
        focus(found.option.value);
      }
    }
  }
  watch(props, 'options', reconcile, { deep: true });
  watch(props, 'disabled', reconcile);
  watch(props, 'value', (value) => {
    if (controlled) {
      state.value = value ?? undefined;
      reconcile();
    }
  });
  watch(props, 'openKeys', reconcile, { deep: true });
  reconcile();
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    elements.clear();
  });
  return {
    state,
    mode,
    layer,
    activate,
    open,
    key,
    visible,
    focus,
    attach(value: T, target: () => HTMLElement | undefined) {
      elements.set(value, target);
      return () => {
        if (elements.get(value) === target) elements.delete(value);
      };
    },
  };
}
export type MenuController<T extends MenuValue> = ReturnType<typeof useMenu<T>>;
