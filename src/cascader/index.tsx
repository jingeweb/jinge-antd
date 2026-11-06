import { For, cx, expose, onMount, onUnmount, ref, registerEvent, uid, vm, watch } from 'jinge';

import './style.scss';
import type { CascaderOption, CascaderProps, CascaderValue } from './common';

import {
  AntDesignCloseOutlined,
  AntDesignDownOutlined,
  AntDesignRightOutlined,
  AntDesignLoadingOutlined,
} from '../_icon';
import { createHierarchy, pathId, type HierarchyEntry } from '../_util/hierarchy';
import { z } from '../_util/z';
import { Floating } from '../floating';
export type * from './common';
type Entry = HierarchyEntry<CascaderOption>;
type Row = Entry & { domId: string; fullLabel: string; selected: boolean; active: boolean };
type Column = { key: number; label: string; rows: Row[] };
function normalize(value: CascaderValue | null | undefined): CascaderValue | null {
  return value?.length ? [...value] : null;
}
function same(a: CascaderValue | null, b: CascaderValue | null) {
  return pathId(a ?? []) === pathId(b ?? []);
}
export function Cascader(props: CascaderProps) {
  const controlled = props.value !== undefined,
    controlledOpen = props.open !== undefined,
    initial = normalize(props.defaultValue),
    id = `ja-cascader-${uid()}`,
    layer = z.getDropdownZ();
  const state = vm({
    value: normalize(controlled ? props.value : initial),
    open: !props.disabled && !props.readOnly && !!(props.open ?? props.defaultOpen),
    query: '',
    text: '',
    columns: [] as Column[],
    active: '',
    pending: null as Row | null,
    invalid: false,
  });
  const input = ref<HTMLInputElement>(),
    button = ref<HTMLButtonElement>(),
    root = ref<HTMLSpanElement>(),
    validator = ref<HTMLSelectElement>();
  let browse: CascaderValue = [...(state.value ?? [])],
    disposed = false,
    blurFrame = 0,
    resetFrame = 0,
    scrollFrame = 0,
    composing = false,
    typeBuffer = '',
    typeTime = 0;
  let compositionCommit: string | undefined,
    loadQueued = false;
  let ownerForm: HTMLFormElement | null | undefined, stopReset: (() => void) | undefined;
  const model = createHierarchy<CascaderOption>({
    roots: () => props.options,
    key: (node) => node.value,
    label: (node) => node.label,
    disabled: (node) => !!node.disabled,
    lazy: (node) => node.isLeaf === false,
    loader: () => props.loadData,
    change: rebuild,
    error: (error, node) => props['on:loadError']?.(error, node),
  });
  function focus(options?: FocusOptions) {
    (input.value ?? button.value)?.focus(options);
  }
  function row(entry: Entry): Row {
    return {
      ...entry,
      domId: `${id}-${encodeURIComponent(entry.id)}`,
      fullLabel: entry.labels.join(' / '),
      selected: same(state.value, entry.path),
      active: false,
    };
  }
  function flat() {
    return state.columns.flatMap((column) => column.rows);
  }
  function rebuild() {
    if (disposed) return;
    const { entries, roots } = model.refresh();
    const labels = (state.value ?? []).map(
      (value, index) =>
        entries.get(pathId(state.value!.slice(0, index + 1)))?.label ?? String(value),
    );
    state.text = labels.join(' / ');
    const columns: Column[] = [];
    state.pending = null;
    if (state.query.trim()) {
      const terms = state.query.trim().toLowerCase().split(/\s+/);
      columns.push({
        key: 0,
        label: '搜索结果',
        rows: [...entries.values()]
          .filter(
            (entry) =>
              !entry.disabled &&
              (!entry.branch || props.changeOnSelect) &&
              terms.every((term) => entry.labels.join(' ').toLowerCase().includes(term)),
          )
          .map(row),
      });
    } else {
      let nodes = roots,
        level = 0;
      while (nodes.length) {
        columns.push({ key: level, label: `第 ${level + 1} 级选项`, rows: nodes.map(row) });
        const selected = nodes.find((entry) => entry.key === browse[level] && !entry.disabled);
        if (!selected) break;
        if (selected.lazy) {
          state.pending = row(selected);
          break;
        }
        nodes = selected.children;
        level++;
      }
    }
    state.columns = columns;
    const rows = flat();
    if (!rows.some((entry) => entry.id === state.active && !entry.disabled))
      state.active =
        (
          rows.find((entry) => entry.selected && !entry.disabled) ??
          columns.at(-1)?.rows.find((entry) => !entry.disabled)
        )?.id ?? '';
    for (const entry of rows) entry.active = entry.id === state.active;
    if (validator.value) validator.value.value = state.value ? 'chosen' : '';
    if (state.open) {
      scroll();
      if (
        state.pending &&
        !state.pending.loading &&
        !state.pending.error &&
        !loadQueued &&
        !props.disabled &&
        !props.readOnly
      ) {
        loadQueued = true;
        queueMicrotask(() => {
          loadQueued = false;
          if (
            !disposed &&
            state.open &&
            state.pending &&
            !state.pending.loading &&
            !state.pending.error
          )
            model.load(state.pending.id);
        });
      }
    }
  }
  function sync() {
    if (controlled) state.value = normalize(props.value);
    if (state.value) state.invalid = false;
    rebuild();
  }
  function scroll() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (disposed || !state.open) return;
      const entry = flat().find((item) => item.id === state.active);
      if (entry)
        document
          .getElementById(entry.domId)
          ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }
  function activate(id: string) {
    if (!flat().some((entry) => entry.id === id && !entry.disabled)) return;
    state.active = id;
    for (const entry of flat()) entry.active = entry.id === id;
    scroll();
  }
  function request(open: boolean, event?: Event) {
    if (disposed || (open && (props.disabled || props.readOnly)) || state.open === open) return;
    if (!controlledOpen) state.open = open;
    props['on:openChange']?.(open, event);
    if (controlledOpen) state.open = !props.disabled && !props.readOnly && !!props.open;
    state.query = '';
    browse = [...(state.value ?? [])];
    state.active = '';
    rebuild();
  }
  function publish(value: CascaderValue | null, event: Event) {
    if (props.disabled || props.readOnly) return;
    const next = normalize(value),
      nodes = (next ?? [])
        .map((_, index) => model.entries.get(pathId(next!.slice(0, index + 1)))?.node)
        .filter((node): node is CascaderOption => !!node);
    if (!controlled) state.value = next;
    try {
      props['on:change']?.(next ? [...next] : null, nodes, event);
    } finally {
      sync();
    }
  }
  function navigate(entry: Row, childFocus = false) {
    if (entry.disabled || props.disabled || props.readOnly) return;
    browse = [...entry.path];
    state.active = entry.id;
    rebuild();
    if (entry.lazy) model.load(entry.id);
    else if (childFocus) {
      const first = flat().find((item) => item.parent === entry.id && !item.disabled);
      if (first) activate(first.id);
    }
  }
  function choose(entry: Row, event: Event) {
    if (entry.disabled || props.disabled || props.readOnly) return;
    navigate(entry);
    if (!entry.branch || props.changeOnSelect) publish(entry.path, event);
    if (!entry.branch) {
      state.query = '';
      request(false, event);
    }
    focus();
  }
  function key(event: KeyboardEvent) {
    if (
      props.disabled ||
      props.readOnly ||
      composing ||
      event.isComposing ||
      event.altKey ||
      event.metaKey ||
      event.ctrlKey
    )
      return;
    if (event.key === 'Tab') {
      request(false, event);
      return;
    }
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      event.stopPropagation();
      request(false, event);
      focus();
      return;
    }
    const navigation = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (
      !navigation.includes(event.key) &&
      !(event.key === ' ' && !props.showSearch) &&
      !(event.key.length === 1 && !props.showSearch)
    )
      return;
    if (navigation.includes(event.key) || event.key === ' ') event.preventDefault();
    if (!state.open) {
      request(true, event);
      return;
    }
    const active = flat().find((entry) => entry.id === state.active),
      column = state.columns.find((item) => item.rows.some((entry) => entry.id === state.active)),
      rows = column?.rows.filter((entry) => !entry.disabled) ?? [],
      index = rows.findIndex((entry) => entry.id === state.active);
    if (event.key === 'ArrowDown') activate(rows[(index + 1) % rows.length]?.id ?? '');
    else if (event.key === 'ArrowUp')
      activate(rows[(index - 1 + rows.length) % rows.length]?.id ?? '');
    else if (event.key === 'Home') activate(rows[0]?.id ?? '');
    else if (event.key === 'End') activate(rows.at(-1)?.id ?? '');
    else if (active && event.key === 'ArrowRight' && active.branch) navigate(active, true);
    else if (active && event.key === 'ArrowLeft' && active.parent) {
      const parent = model.entries.get(active.parent);
      if (parent) {
        browse = parent.path.slice(0, -1);
        state.active = parent.id;
        rebuild();
      }
    } else if (active && (event.key === 'Enter' || event.key === ' ')) choose(active, event);
    else if (event.key.length === 1 && !props.showSearch) {
      const now = event.timeStamp;
      typeBuffer = now - typeTime > 700 ? event.key : typeBuffer + event.key;
      typeTime = now;
      const ordered = [...rows.slice(index + 1), ...rows.slice(0, index + 1)];
      activate(
        ordered.find((entry) => entry.label.toLowerCase().startsWith(typeBuffer.toLowerCase()))
          ?.id ?? state.active,
      );
    }
  }
  function search(event: Event) {
    if (!props.showSearch || props.disabled || props.readOnly) return;
    const query = input.value?.value ?? '';
    request(true, event);
    state.query = query;
    state.active = '';
    rebuild();
    if (!composing && !(event as InputEvent).isComposing) {
      if (compositionCommit === state.query) {
        compositionCommit = undefined;
        return;
      }
      compositionCommit = undefined;
      props['on:search']?.(state.query, event);
    }
  }
  function clear(event: MouseEvent) {
    event.stopPropagation();
    publish(null, event);
    state.query = '';
    browse = [];
    rebuild();
    focus();
  }
  function bindForm() {
    const form = validator.value?.form;
    if (form === ownerForm) return;
    stopReset?.();
    ownerForm = form;
    stopReset = form
      ? registerEvent(form, 'reset', (event) => {
          cancelAnimationFrame(resetFrame);
          resetFrame = requestAnimationFrame(() => {
            resetFrame = 0;
            if (disposed || event.defaultPrevented) return;
            if (!controlled) state.value = normalize(initial);
            state.invalid = false;
            state.query = '';
            state.open = false;
            browse = [...(state.value ?? [])];
            sync();
          });
        })
      : undefined;
  }
  function blur(event: FocusEvent) {
    cancelAnimationFrame(blurFrame);
    blurFrame = requestAnimationFrame(() => {
      blurFrame = 0;
      if (disposed) return;
      if (root.value?.contains(document.activeElement)) return;
      request(false, event);
      props['on:blur']?.(event);
    });
  }
  watch(
    props,
    'value',
    () => {
      if (controlled) {
        state.value = normalize(props.value);
        browse = [...(state.value ?? [])];
        sync();
      }
    },
    { deep: true },
  );
  watch(props, 'options', rebuild, { deep: true });
  watch(props, 'loadData', rebuild);
  watch(props, 'changeOnSelect', rebuild);
  watch(props, 'open', () => {
    if (controlledOpen) {
      state.open = !props.disabled && !props.readOnly && !!props.open;
      state.query = '';
      browse = [...(state.value ?? [])];
      rebuild();
    }
  });
  function disable() {
    if (props.disabled || props.readOnly) {
      state.open = false;
      state.query = '';
      rebuild();
    }
  }
  watch(props, 'disabled', disable);
  watch(props, 'readOnly', disable);
  watch(props, 'form', bindForm);
  rebuild();
  onMount(() => {
    const control = input.value ?? button.value!;
    const stops = [
      registerEvent(control, 'focus', (event) => props['on:focus']?.(event)),
      registerEvent(root.value!, 'focusout', blur),
      registerEvent(validator.value!, 'invalid', (event) => {
        event.preventDefault();
        state.invalid = true;
        focus();
      }),
    ];
    if (input.value) {
      input.value.setAttribute('autocomplete', 'off');
      stops.push(
        registerEvent(input.value, 'compositionstart', () => {
          composing = true;
        }),
        registerEvent(input.value, 'compositionend', (event) => {
          composing = false;
          compositionCommit = state.query;
          props['on:search']?.(state.query, event);
        }),
      );
    }
    bindForm();
    rebuild();
    if (props.autoFocus && !props.disabled) focus();
    return () => stops.forEach((stop) => stop());
  });
  onUnmount(() => {
    disposed = true;
    model.dispose();
    stopReset?.();
    for (const timer of [blurFrame, resetFrame, scrollFrame]) cancelAnimationFrame(timer);
  });
  expose({
    focus,
    blur: () => {
      (input.value ?? button.value)?.blur();
    },
  });
  return (
    <>
      <Floating
        id={id}
        role="listbox"
        ariaLabel="级联选项"
        zIndex={layer}
        open={state.open}
        disabled={props.disabled || props.readOnly}
        triggerMethod="none"
        placement="bottom-start"
        offset={4}
        autoFocus={false}
        returnFocus={false}
        className="ja-cascader-popup"
        on:openChange={request}
        slot:trigger={
          <span
            ref={root}
            className={cx(
              'ja-cascader',
              props.size ?? 'md',
              props.status,
              (props.ariaInvalid || state.invalid) && 'error',
              props.disabled && 'disabled',
              props.className,
            )}
            style={props.style}
          >
            {props.showSearch ? (
              <input
                ref={input}
                id={props.id}
                role="combobox"
                type="text"
                value={state.open ? state.query : state.text}
                placeholder={state.text || props.placeholder || '请选择'}
                disabled={props.disabled}
                readOnly={props.readOnly}
                aria-label={props.ariaLabel}
                aria-labelledby={props.ariaLabelledby}
                aria-describedby={props.ariaDescribedby}
                aria-invalid={
                  props.ariaInvalid || state.invalid || props.status === 'error' || undefined
                }
                aria-required={props.required}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-expanded={state.open}
                aria-controls={state.open ? id : undefined}
                aria-activedescendant={activeDomId(state.columns, state.active, state.open)}
                on:input={search}
                on:keyDown={key}
                on:click={(event) => request(true, event)}
              />
            ) : (
              <button
                ref={button}
                id={props.id}
                type="button"
                role="combobox"
                disabled={props.disabled}
                aria-readonly={props.readOnly}
                aria-label={props.ariaLabel}
                aria-labelledby={props.ariaLabelledby}
                aria-describedby={props.ariaDescribedby}
                aria-invalid={
                  props.ariaInvalid || state.invalid || props.status === 'error' || undefined
                }
                aria-required={props.required}
                aria-haspopup="listbox"
                aria-expanded={state.open}
                aria-controls={state.open ? id : undefined}
                aria-activedescendant={activeDomId(state.columns, state.active, state.open)}
                on:keyDown={key}
                on:click={(event) => {
                  request(!state.open, event);
                  focus();
                }}
              >
                {state.text || props.placeholder || '请选择'}
              </button>
            )}
            {props.allowClear && state.value && (
              <button
                type="button"
                className="ja-cascader-clear"
                aria-label="清空级联选择"
                disabled={props.disabled || props.readOnly}
                on:mouseDown={(event) => event.preventDefault()}
                on:click={clear}
              >
                <AntDesignCloseOutlined />
              </button>
            )}
            <span aria-hidden="true" className="ja-cascader-arrow">
              <AntDesignDownOutlined />
            </span>
          </span>
        }
      >
        <div className="ja-cascader-columns">
          <For loop={state.columns} key="key">
            {(column) => (
              <div role="group" aria-label={column.data.label} className="ja-cascader-column">
                <For loop={column.data.rows} key="id">
                  {(each) => (
                    <div
                      id={each.data.domId}
                      role="option"
                      aria-label={each.data.fullLabel}
                      aria-selected={each.data.selected}
                      aria-disabled={each.data.disabled}
                      className={cx(
                        'ja-cascader-option',
                        each.data.active && 'active',
                        each.data.selected && 'selected',
                        each.data.disabled && 'disabled',
                      )}
                      on:mouseDown={(event) => event.preventDefault()}
                      on:click={(event) => choose(each.data, event)}
                    >
                      <span>
                        {props['slot:option']
                          ? props['slot:option']({ option: each.data.node, path: each.data.path })
                          : each.data.label}
                      </span>
                      <span aria-hidden="true">
                        {each.data.loading ? (
                          <AntDesignLoadingOutlined className="ja-icon-spin" />
                        ) : each.data.branch ? (
                          <AntDesignRightOutlined />
                        ) : null}
                      </span>
                    </div>
                  )}
                </For>
                {column.data.rows.length === 0 && (
                  <div role="status" className="ja-cascader-empty">
                    {props.emptyText ?? '暂无选项'}
                  </div>
                )}
              </div>
            )}
          </For>
          {state.columns.length === 0 && (
            <div role="status" className="ja-cascader-empty">
              {props.emptyText ?? '暂无选项'}
            </div>
          )}
          {state.pending && (
            <div className="ja-cascader-pending">
              {state.pending.error ? (
                <div role="alert">
                  {state.pending.error}
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={props.disabled || props.readOnly}
                    aria-label={`重试加载 ${state.pending.label}`}
                    on:mouseDown={(event) => event.preventDefault()}
                    on:click={() => {
                      if (state.pending) model.load(state.pending.id);
                    }}
                  >
                    重试
                  </button>
                </div>
              ) : (
                <div role="status">加载中…</div>
              )}
            </div>
          )}
        </div>
      </Floating>
      <select
        ref={validator}
        className="ja-cascader-validator"
        tabIndex={-1}
        aria-hidden="true"
        required={props.required}
        disabled={props.disabled || props.readOnly}
        form={props.form}
        value={state.value ? 'chosen' : ''}
      >
        <option value="" />
        <option value="chosen" />
      </select>
      <input
        type="hidden"
        name={props.name}
        form={props.form}
        disabled={props.disabled}
        value={serialize(state.value)}
      />
    </>
  );
}
function serialize(value: CascaderValue | null) {
  return value ? JSON.stringify(value) : '';
}
function activeDomId(columns: Column[], active: string, open: boolean) {
  return open
    ? columns.flatMap((column) => column.rows).find((entry) => entry.id === active)?.domId
    : undefined;
}
