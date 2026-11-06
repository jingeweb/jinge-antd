import { For, cx, expose, onMount, onUnmount, ref, vm, watch } from 'jinge';

import './style.scss';
import type { TreeKey, TreeNode, TreeProps } from './common';

import {
  AntDesignLoadingOutlined,
  AntDesignCaretDownOutlined,
  AntDesignCaretRightOutlined,
  AntDesignMinusOutlined,
  AntDesignCheckOutlined,
} from '../_icon';
import { createHierarchy, pathId, type HierarchyEntry } from '../_util/hierarchy';
import { treeChecks } from './check';
export type * from './common';
type Row = HierarchyEntry<TreeNode> & {
  expanded: boolean;
  selected: boolean;
  checked: boolean | 'mixed';
  active: boolean;
};
export function Tree(props: TreeProps) {
  const expandedControl = props.expandedKeys !== undefined,
    selectedControl = props.selectedKeys !== undefined,
    checkedControl = props.checkedKeys !== undefined;
  let expanded = [...new Set(props.defaultExpandedKeys ?? [])],
    selected = [...new Set(props.defaultSelectedKeys ?? [])],
    checked = [...new Set(props.defaultCheckedKeys ?? [])];
  const state = vm({ rows: [] as Row[], active: '', empty: true });
  const root = ref<HTMLDivElement>();
  let disposed = false,
    frame = 0,
    queued = false,
    prefix = '',
    lastType = 0;
  const model = createHierarchy<TreeNode>({
    roots: () => props.treeData,
    key: (node) => node.key,
    label: (node) => node.label,
    disabled: (node) => !!node.disabled,
    checkDisabled: (node) => !!node.disableCheckbox,
    lazy: (node) => node.isLeaf === false,
    unique: true,
    loader: () => props.loadData,
    change: rebuild,
    error: (error, node) => props['on:loadError']?.(error, node),
  });
  function sources() {
    return {
      expanded: expandedControl ? (props.expandedKeys ?? []) : expanded,
      selected: selectedControl ? (props.selectedKeys ?? []) : selected,
      checked: checkedControl ? (props.checkedKeys ?? []) : checked,
    };
  }
  function autoLoad() {
    if (queued || disposed) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (disposed) return;
      for (const row of state.rows)
        if (
          row.expanded &&
          row.lazy &&
          !row.loading &&
          !row.error &&
          !row.disabled &&
          !props.disabled
        )
          model.load(row.id);
    });
  }
  function rebuild() {
    if (disposed) return;
    const previous = model.entries,
      hadFocus = !!root.value?.contains(document.activeElement),
      source = sources();
    const { roots, entries } = model.refresh(),
      checks = treeChecks(roots, source.checked, !!props.checkStrictly);
    const visible = new Set<string>(),
      query = props.filter?.trim() ?? '';
    if (query)
      for (const entry of entries.values())
        if (
          props.filterNode
            ? props.filterNode(query, entry.node)
            : entry.label.toLowerCase().includes(query.toLowerCase())
        ) {
          let current: HierarchyEntry<TreeNode> | undefined = entry;
          while (current) {
            visible.add(current.id);
            current = current.parent ? entries.get(current.parent) : undefined;
          }
        }
    const rows: Row[] = [];
    function visit(nodes: HierarchyEntry<TreeNode>[]) {
      for (const entry of nodes) {
        if (query && !visible.has(entry.id)) continue;
        const open =
          entry.branch &&
          (source.expanded.includes(entry.key) ||
            (!!query && entry.children.some((child) => visible.has(child.id))));
        rows.push({
          ...entry,
          disabled: !!props.disabled || entry.disabled,
          checkDisabled: !!props.disabled || entry.checkDisabled,
          expanded: open,
          selected: source.selected.includes(entry.key),
          checked: checks.half.has(entry.key) ? 'mixed' : checks.full.has(entry.key),
          active: false,
        });
        if (open) visit(entry.children);
      }
    }
    visit(roots);
    let active = state.active;
    while (active && !rows.some((row) => row.id === active && !row.disabled))
      active = previous.get(active)?.parent ?? '';
    if (!active) active = rows.find((row) => !row.disabled)?.id ?? '';
    state.active = active;
    for (const row of rows) row.active = row.id === active;
    state.rows = rows;
    state.empty = !rows.length;
    if (hadFocus) focusLater();
    autoLoad();
  }
  function element(id: string) {
    return [...(root.value?.querySelectorAll<HTMLElement>('[role=treeitem]') ?? [])].find(
      (el) => el.dataset.treeId === id,
    );
  }
  function focusLater() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (!root.value?.contains(document.activeElement) && document.activeElement !== document.body)
        return;
      const target = element(state.active);
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView?.({ block: 'nearest' });
      } else root.value?.focus();
    });
  }
  function activate(id: string, focus = true) {
    const row = state.rows.find((item) => item.id === id && !item.disabled);
    if (!row) return;
    state.active = id;
    for (const item of state.rows) item.active = item.id === id;
    if (focus) {
      const target = element(id);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView?.({ block: 'nearest' });
    }
  }
  function expand(row: Row, event: Event) {
    if (row.disabled || !row.branch) return;
    const keys = sources().expanded,
      next = row.expanded
        ? keys.filter((key) => key !== row.key)
        : [...new Set([...keys, row.key])];
    if (!expandedControl) expanded = next;
    props['on:expand']?.([...next], { node: row.node, expanded: !row.expanded }, event);
    rebuild();
  }
  function select(row: Row, event: Event) {
    if (row.disabled || props.selectable === false || row.node.selectable === false) return;
    const keys = sources().selected,
      next = props.multiple
        ? keys.includes(row.key)
          ? keys.filter((key) => key !== row.key)
          : [...keys, row.key]
        : [row.key];
    if (!selectedControl) selected = [...next];
    props['on:select']?.([...next], { node: row.node, selected: next.includes(row.key) }, event);
    rebuild();
  }
  function check(row: Row, event: Event) {
    if (!props.checkable || row.checkDisabled) return;
    const checks = treeChecks(model.roots, sources().checked, !!props.checkStrictly),
      next = new Set(checks.keys),
      target = !checks.full.has(row.key);
    if (target) next.add(row.key);
    else {
      function remove(entry: HierarchyEntry<TreeNode>) {
        next.delete(entry.key);
        if (!props.checkStrictly)
          for (const child of entry.children) if (!child.checkDisabled) remove(child);
      }
      remove(row);
      if (!props.checkStrictly) {
        let parent = row.parent ? model.entries.get(row.parent) : undefined;
        while (parent && !parent.checkDisabled) {
          next.delete(parent.key);
          parent = parent.parent ? model.entries.get(parent.parent) : undefined;
        }
      }
    }
    const result = treeChecks(model.roots, [...next], !!props.checkStrictly);
    if (!checkedControl) checked = result.keys;
    props['on:check']?.(
      [...result.keys],
      { node: row.node, checked: target, halfCheckedKeys: result.halfKeys },
      event,
    );
    rebuild();
  }
  function key(row: Row, event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (row.disabled || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const rows = state.rows.filter((item) => !item.disabled),
      index = rows.findIndex((item) => item.id === row.id);
    if (
      ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(
        event.key,
      )
    )
      event.preventDefault();
    if (event.key === 'ArrowDown') activate(rows[Math.min(rows.length - 1, index + 1)]?.id ?? '');
    else if (event.key === 'ArrowUp') activate(rows[Math.max(0, index - 1)]?.id ?? '');
    else if (event.key === 'Home') activate(rows[0]?.id ?? '');
    else if (event.key === 'End') activate(rows.at(-1)?.id ?? '');
    else if (event.key === 'ArrowRight') {
      if (row.lazy && (row.expanded || row.error)) {
        model.load(row.id);
        return;
      }
      if (row.branch && !row.expanded) expand(row, event);
      else activate(rows.find((item) => item.parent === row.id)?.id ?? row.id);
    } else if (event.key === 'ArrowLeft') {
      if (row.expanded) expand(row, event);
      else if (row.parent) activate(row.parent);
    } else if (event.key === ' ') {
      if (props.checkable) check(row, event);
      else select(row, event);
    } else if (event.key === 'Enter') {
      if (props.selectable === false || row.node.selectable === false) expand(row, event);
      else select(row, event);
    } else if (event.key.length === 1) {
      const now = event.timeStamp;
      prefix = now - lastType > 700 ? event.key : prefix + event.key;
      lastType = now;
      const ordered = [...rows.slice(index + 1), ...rows.slice(0, index + 1)];
      activate(
        ordered.find((item) => item.label.toLowerCase().startsWith(prefix.toLowerCase()))?.id ??
          row.id,
      );
    }
  }
  model.refresh();
  if (props.defaultExpandAll && !expandedControl)
    expanded = [...model.entries.values()]
      .filter((entry) => entry.branch)
      .map((entry) => entry.key);
  rebuild();
  for (const name of ['treeData', 'expandedKeys', 'selectedKeys', 'checkedKeys'] as const)
    watch(props, name, rebuild, { deep: true });
  for (const name of [
    'disabled',
    'multiple',
    'selectable',
    'checkable',
    'checkStrictly',
    'filter',
    'filterNode',
    'loadData',
  ] as const)
    watch(props, name, rebuild);
  onMount(rebuild);
  onUnmount(() => {
    disposed = true;
    model.dispose();
    cancelAnimationFrame(frame);
  });
  expose({
    focus: (key?: TreeKey) => {
      const id = key === undefined ? state.active : pathId([key]);
      activate(id);
      if (!state.rows.length) root.value?.focus();
    },
    blur: () => {
      if (root.value?.contains(document.activeElement))
        (document.activeElement as HTMLElement).blur();
    },
  });
  return (
    <div
      ref={root}
      id={props.id}
      role="tree"
      aria-label={props.ariaLabel ?? '树'}
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      aria-disabled={props.disabled}
      aria-multiselectable={props.multiple || props.checkable || undefined}
      tabIndex={state.active ? -1 : 0}
      className={cx('ja-tree', props.size ?? 'md', props.className)}
      style={props.style}
    >
      {state.empty && (
        <div role="status" className="ja-tree-empty">
          {props.emptyText ?? '暂无数据'}
        </div>
      )}
      <For loop={state.rows} key="id">
        {(each) => (
          <div
            role="treeitem"
            data-tree-id={each.data.id}
            tabIndex={each.data.active ? 0 : -1}
            aria-label={each.data.label}
            aria-level={each.data.level}
            aria-posinset={each.data.pos}
            aria-setsize={each.data.size}
            aria-expanded={each.data.branch ? each.data.expanded : undefined}
            aria-selected={
              props.selectable !== false && each.data.node.selectable !== false
                ? each.data.selected
                : undefined
            }
            aria-checked={props.checkable ? each.data.checked : undefined}
            aria-disabled={each.data.disabled}
            aria-busy={each.data.loading || undefined}
            className={cx(
              'ja-tree-row',
              each.data.selected && 'selected',
              each.data.disabled && 'disabled',
            )}
            style={`padding-inline-start:${(each.data.level - 1) * 20}px`}
            on:focus={() => activate(each.data.id, false)}
            on:keyDown={(event) => key(each.data, event)}
            on:click={(event) => {
              activate(each.data.id);
              select(each.data, event);
            }}
          >
            {each.data.branch ? (
              <button
                type="button"
                tabIndex={-1}
                className="ja-tree-switch"
                aria-label={`${each.data.expanded ? '收起' : '展开'} ${each.data.label}`}
                disabled={each.data.disabled}
                on:mouseDown={(event) => event.preventDefault()}
                on:click={(event) => {
                  event.stopPropagation();
                  activate(each.data.id);
                  expand(each.data, event);
                }}
              >
                {each.data.loading ? (
                  <AntDesignLoadingOutlined className="ja-icon-spin" />
                ) : each.data.expanded ? (
                  <AntDesignCaretDownOutlined />
                ) : (
                  <AntDesignCaretRightOutlined />
                )}
              </button>
            ) : (
              <span className="ja-tree-switch" aria-hidden="true" />
            )}
            {props.checkable && (
              <span
                aria-hidden="true"
                className={cx(
                  'ja-tree-check',
                  each.data.checked && 'checked',
                  each.data.checkDisabled && 'disabled',
                )}
                on:click={(event) => {
                  event.stopPropagation();
                  activate(each.data.id);
                  check(each.data, event);
                }}
              >
                {each.data.checked === 'mixed' ? (
                  <AntDesignMinusOutlined />
                ) : each.data.checked ? (
                  <AntDesignCheckOutlined />
                ) : null}
              </span>
            )}
            <span className="ja-tree-title">
              {props['slot:title']
                ? props['slot:title']({ node: each.data.node })
                : each.data.label}
            </span>
            {each.data.error && (
              <span className="ja-tree-error" role="alert">
                {each.data.error}
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={each.data.disabled}
                  aria-label={`重试加载 ${each.data.label}`}
                  on:click={(event) => {
                    event.stopPropagation();
                    model.load(each.data.id);
                  }}
                >
                  重试
                </button>
              </span>
            )}
          </div>
        )}
      </For>
    </div>
  );
}
