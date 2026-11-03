import { onMount, onUnmount, ref, registerEvent, uid, vm, watch } from 'jinge';

import {
  type ComboBase,
  type ComboGroup,
  type ComboRow,
  type ComboState,
  type SelectOption,
  type SelectValue,
  optionId,
} from './common';

export function useCombo<T extends SelectValue>(
  props: ComboBase<T>,
  selected: () => T[],
  choose: (option: SelectOption<T>, event: Event) => void,
  editable: boolean,
) {
  const id = `ja-select-list-${uid()}`;
  const controlled = props.open !== undefined;
  const state = vm<ComboState<T>>({
    open: !props.disabled && !!(props.open ?? props.defaultOpen),
    query: '',
    rows: [],
    groups: [],
    active: '',
    width: 180,
  });
  const root = ref<HTMLSpanElement>();
  let disposed = false,
    scrollFrame = 0,
    typeBuffer = '',
    typeTime = 0;
  let observer: ResizeObserver | undefined;
  function scroll() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!disposed && state.open && state.active)
        document.getElementById(state.active)?.scrollIntoView?.({ block: 'nearest' });
    });
  }
  function rebuild() {
    const query = state.query.toLocaleLowerCase();
    const rows: ComboRow<T>[] = props.loading
      ? []
      : props.options
          .filter((option) => {
            if (!query || props.filterOption === false) return true;
            return typeof props.filterOption === 'function'
              ? props.filterOption(state.query, option)
              : `${option.label} ${option.value}`.toLocaleLowerCase().includes(query);
          })
          .map((option) => ({ ...option, id: optionId(id, option.value) }));
    const groups: ComboGroup<T>[] = [];
    for (const row of rows) {
      const groupKey = row.group === undefined ? 'ungrouped' : `group:${row.group}`;
      let group = groups.find((item) => item.key === groupKey);
      if (!group) {
        group = { key: groupKey, label: row.group, rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
    }
    state.rows = groups.flatMap((group) => group.rows);
    state.groups = groups;
    if (!rows.some((row) => row.id === state.active && !row.disabled)) {
      state.active =
        (
          rows.find((row) => !row.disabled && selected().includes(row.value)) ??
          rows.find((row) => !row.disabled)
        )?.id ?? '';
    }
    if (state.open) scroll();
  }
  function request(open: boolean, event?: Event) {
    if (disposed || (open && props.disabled) || open === state.open) return;
    if (!controlled) state.open = open;
    props['on:openChange']?.(open, event);
    if (open) {
      state.active = '';
      rebuild();
      measure();
    }
  }
  function query(value: string) {
    state.query = value;
    rebuild();
  }
  function measure() {
    if (disposed) return;
    const configured = props.popupWidth;
    state.width =
      Number.isFinite(configured) && configured! > 0
        ? configured!
        : Math.max(160, root.value?.getBoundingClientRect().width ?? 180);
  }
  function key(event: KeyboardEvent) {
    if (props.disabled || event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      event.stopPropagation();
      request(false, event);
      return;
    }
    if (event.key === 'Tab') {
      request(false, event);
      return;
    }
    const available = state.rows.filter((row) => !row.disabled);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!state.open) {
        request(true, event);
        return;
      }
      if (available.length) {
        const index = available.findIndex((row) => row.id === state.active);
        const next =
          (index + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length;
        state.active = available[next].id;
        scroll();
      }
    } else if (!editable && state.open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      state.active = (event.key === 'Home' ? available[0] : available.at(-1))?.id ?? '';
      scroll();
    } else if (event.key === 'Enter' || (!editable && event.key === ' ')) {
      if (state.open) {
        event.preventDefault();
        const option = available.find((row) => row.id === state.active);
        if (option && !props.loading) choose(option, event);
      } else if (!editable) {
        event.preventDefault();
        request(true, event);
      }
    } else if (
      !editable &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      typeBuffer = Date.now() - typeTime > 500 ? event.key : typeBuffer + event.key;
      typeTime = Date.now();
      request(true, event);
      state.active =
        available.find((row) =>
          row.label.toLocaleLowerCase().startsWith(typeBuffer.toLocaleLowerCase()),
        )?.id ?? state.active;
      scroll();
    }
  }
  watch(props, 'open', (open) => {
    if (controlled) {
      state.open = !!open && !props.disabled;
      if (state.open) {
        rebuild();
        measure();
      }
    }
  });
  watch(props, 'disabled', (disabled) => {
    if (disabled) {
      request(false);
      state.open = false;
    } else if (controlled) state.open = !!props.open;
  });
  watch(props, 'options', rebuild, { deep: true });
  watch(props, 'loading', rebuild);
  watch(props, 'filterOption', rebuild);
  watch(props, 'popupWidth', measure);
  rebuild();
  onMount(() => {
    measure();
    if (window.ResizeObserver && root.value) {
      observer = new window.ResizeObserver(measure);
      observer.observe(root.value);
    }
    const stop = root.value
      ? registerEvent(root.value, 'focusout', (event) => {
          if (!(event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget)))
            request(false, event);
        })
      : undefined;
    return stop;
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(scrollFrame);
    observer?.disconnect();
  });
  return { id, state, root, request, query, key, rebuild };
}
