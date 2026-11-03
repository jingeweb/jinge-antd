import { vm, watch } from 'jinge';

import type {
  ColumnType,
  FilterValue,
  SortOrder,
  TableChange,
  TableKey,
  TableProps,
  TableRecord,
  TableSorter,
} from './common';

import { clampPage, itemTotal, positiveInteger } from '../pagination/common';
import { copyFilters, hasKey, queryData, rowKey } from './data';
export function useTable<T>(props: TableProps<T>) {
  const initialPage = props.pagination || {};
  const controlledPage = initialPage.current !== undefined,
    controlledSize = initialPage.pageSize !== undefined;
  const controlledSort = props.columns.some((column) => column.sortOrder !== undefined);
  const controlledFilters = new Set(
    props.columns
      .filter((column) => column.filteredValue !== undefined)
      .map((column) => column.key),
  );
  const controlledSelection = props.rowSelection?.selectedRowKeys !== undefined;
  const controlledExpanded = props.expandedRowKeys !== undefined;
  const defaultSort = props.columns.find((column) => column.sorter && column.defaultSortOrder);
  const state = vm<{
    rows: TableRecord<T>[];
    currentData: T[];
    total: number;
    page: number;
    pageSize: number;
    sorter: TableSorter;
    filters: Record<string, FilterValue[]>;
    selected: TableKey[];
    expanded: TableKey[];
  }>({
    rows: [],
    currentData: [],
    total: 0,
    page: positiveInteger(initialPage.current ?? initialPage.defaultCurrent, 1),
    pageSize: positiveInteger(initialPage.pageSize ?? initialPage.defaultPageSize),
    sorter: { columnKey: defaultSort?.key, order: defaultSort?.defaultSortOrder },
    filters: Object.fromEntries(
      props.columns
        .filter((column) => column.defaultFilteredValue?.length)
        .map((column) => [column.key, [...column.defaultFilteredValue!]]),
    ),
    selected: [
      ...(props.rowSelection?.selectedRowKeys ?? props.rowSelection?.defaultSelectedRowKeys ?? []),
    ],
    expanded: [...(props.expandedRowKeys ?? props.defaultExpandedRowKeys ?? [])],
  });
  function sync() {
    const data = props.data ?? [],
      keys = new Set<TableKey>();
    const columns = new Set<string>();
    for (const column of props.columns) {
      if (columns.has(column.key)) throw new Error('Table column key must be unique');
      columns.add(column.key);
    }
    for (const row of data) {
      const key = rowKey(row, props.rowKey);
      if (keys.has(key)) throw new Error('Table rowKey must be unique');
      keys.add(key);
    }
    if (controlledSort) {
      const column = props.columns.find(
        (column) => column.sortOrder !== undefined && column.sortOrder && column.sorter,
      );
      state.sorter = column ? { columnKey: column.key, order: column.sortOrder as SortOrder } : {};
    } else if (
      !props.columns.some((column) => column.key === state.sorter.columnKey && column.sorter)
    )
      state.sorter = {};
    const filters: Record<string, FilterValue[]> = {};
    for (const column of props.columns) {
      const values = controlledFilters.has(column.key)
        ? column.filteredValue
        : state.filters[column.key];
      if (values?.length) filters[column.key] = [...new Set(values)];
    }
    state.filters = filters;
    const selected = controlledSelection
      ? (props.rowSelection?.selectedRowKeys ?? [])
      : state.selected;
    state.selected = [...new Set(selected)].filter(
      (key) => props.rowSelection?.preserveSelectedRowKeys || keys.has(key),
    );
    if (props.rowSelection?.type === 'radio') state.selected = state.selected.slice(0, 1);
    state.expanded = [
      ...new Set(controlledExpanded ? (props.expandedRowKeys ?? []) : state.expanded),
    ].filter((key) => keys.has(key));
    const pagination = props.pagination || {};
    if (controlledPage) state.page = positiveInteger(pagination.current, 1);
    if (controlledSize) state.pageSize = positiveInteger(pagination.pageSize);
    state.currentData = queryData(data, props.columns, state.filters, state.sorter, props.remote);
    state.total = props.remote
      ? itemTotal(pagination.total ?? data.length)
      : state.currentData.length;
    state.page = clampPage(state.page, state.total, state.pageSize);
    const offset = props.pagination && !props.remote ? (state.page - 1) * state.pageSize : 0;
    const page =
      props.pagination && !props.remote
        ? state.currentData.slice(offset, offset + state.pageSize)
        : state.currentData;
    state.rows = page.map((row, index) => ({
      key: rowKey(row, props.rowKey),
      data: row,
      index:
        (props.remote && props.pagination ? (state.page - 1) * state.pageSize : offset) + index,
    }));
  }
  watch(props, 'data', sync, { deep: true });
  watch(props, 'columns', sync, { deep: true });
  watch(props, 'pagination', sync, { deep: true });
  watch(props, 'rowSelection', sync, { deep: true });
  watch(props, 'expandedRowKeys', sync, { deep: true });
  watch(props, 'remote', sync);
  watch(props, 'rowKey', sync);
  // A static parent may pass VM objects through an ordinary props object (F08).
  // Observe the stable source objects directly as well as replaceable prop paths.
  if (props.data) watch(props.data, sync);
  watch(props.columns, sync);
  if (props.rowSelection) watch(props.rowSelection, sync);
  if (props.pagination) watch(props.pagination, sync);
  sync();
  function notify(
    action: TableChange<T>['action'],
    page: number,
    size: number,
    sorter = state.sorter,
    filters = state.filters,
  ) {
    const currentData = queryData(props.data ?? [], props.columns, filters, sorter, props.remote);
    const total = props.remote
      ? itemTotal((props.pagination || {}).total ?? props.data?.length ?? 0)
      : currentData.length;
    props['on:change']?.({
      action,
      pagination: { current: clampPage(page, total, size), pageSize: size, total },
      sorter: { ...sorter },
      filters: copyFilters(filters),
      currentData: [...currentData],
    });
  }
  function paginate(page: number, size: number) {
    if (props.loading) return;
    if (!controlledPage) state.page = page;
    if (!controlledSize) state.pageSize = size;
    sync();
    notify('paginate', page, size);
  }
  function sort(column: ColumnType<T>) {
    if (props.loading || !column.sorter) return;
    const order =
      state.sorter.columnKey !== column.key
        ? 'ascend'
        : state.sorter.order === 'ascend'
          ? 'descend'
          : state.sorter.order === 'descend'
            ? undefined
            : 'ascend';
    const sorter: TableSorter = order ? { columnKey: column.key, order } : {};
    if (!controlledSort) state.sorter = sorter;
    if (!controlledPage) state.page = 1;
    sync();
    notify('sort', 1, state.pageSize, sorter);
  }
  function filter(column: ColumnType<T>, values: FilterValue[]) {
    if (props.loading) return;
    const filters = copyFilters(state.filters);
    if (values.length) filters[column.key] = [...values];
    else delete filters[column.key];
    if (!controlledFilters.has(column.key)) state.filters = filters;
    if (!controlledPage) state.page = 1;
    sync();
    notify('filter', 1, state.pageSize, state.sorter, filters);
  }
  function disabled(row: T, loading = props.loading, selection = props.rowSelection) {
    return !!(loading || selection?.disabled || selection?.getDisabled?.(row));
  }
  function select(keys: TableKey[]) {
    const next = [...new Set(keys)];
    if (!controlledSelection) state.selected = next;
    props.rowSelection?.['on:change']?.(
      [...next],
      [...(props.data ?? [])].filter((row) => hasKey(next, rowKey(row, props.rowKey))),
    );
  }
  function selectRow(row: TableRecord<T>, checked: boolean) {
    if (disabled(row.data)) return;
    select(
      props.rowSelection?.type === 'radio'
        ? [row.key]
        : checked
          ? [...state.selected, row.key]
          : state.selected.filter((key) => key !== row.key),
    );
  }
  function pageKeys() {
    return state.rows.filter((row) => !disabled(row.data)).map((row) => row.key);
  }
  function selectPage(checked: boolean) {
    if (props.loading || props.rowSelection?.disabled) return;
    const keys = pageKeys();
    select(
      checked ? [...state.selected, ...keys] : state.selected.filter((key) => !keys.includes(key)),
    );
  }
  function expandable(row: T) {
    return !!props['slot:expandedRowRender'] && (props.rowExpandable?.(row) ?? true);
  }
  function expand(row: TableRecord<T>) {
    if (props.loading || !expandable(row.data)) return;
    const open = !hasKey(state.expanded, row.key);
    const keys = open
      ? [...state.expanded, row.key]
      : state.expanded.filter((key) => key !== row.key);
    if (!controlledExpanded) state.expanded = keys;
    props['on:expand']?.(open, row.data);
    props['on:expandedRowsChange']?.([...keys]);
  }
  return { state, paginate, sort, filter, disabled, selectRow, selectPage, expandable, expand };
}
