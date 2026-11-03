import type {
  ColumnType,
  FilterValue,
  TableKey,
  TableProps,
  TableSorter,
  TableRecord,
  TableRowSelection,
} from './common';
export function rowKey<T>(row: T, key: TableProps<T>['rowKey']): TableKey {
  const value = typeof key === 'function' ? key(row) : row[key];
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    (typeof value === 'number' && !Number.isFinite(value))
  )
    throw new Error('Table rowKey must produce a unique string or finite number');
  return value;
}
export function cellText<T>(row: T, column: ColumnType<T>): string {
  const value = column.dataIndex === undefined ? undefined : row[column.dataIndex];
  return value === null ||
    value === undefined ||
    typeof value === 'object' ||
    typeof value === 'function'
    ? '—'
    : String(value);
}
export function queryData<T>(
  data: T[],
  columns: ColumnType<T>[],
  filters: Record<string, FilterValue[]>,
  sorter: TableSorter,
  remote?: boolean,
): T[] {
  if (remote) return [...data];
  const result = data.filter((row) =>
    columns.every((column) => {
      const values = filters[column.key];
      return (
        !values?.length ||
        values.some((value) =>
          column.onFilter
            ? column.onFilter(value, row)
            : column.dataIndex !== undefined && row[column.dataIndex] === value,
        )
      );
    }),
  );
  const column = columns.find((column) => column.key === sorter.columnKey);
  if (sorter.order && typeof column?.sorter === 'function') {
    const compare = column.sorter;
    result.sort((a, b) => {
      const order = compare(a, b);
      return Number.isFinite(order) ? order * (sorter.order === 'descend' ? -1 : 1) : 0;
    });
  }
  return result;
}
export function hasKey(keys: TableKey[], key: TableKey) {
  return keys.includes(key);
}
export function copyFilters(filters: Record<string, FilterValue[]>) {
  return Object.fromEntries(Object.entries(filters).map(([key, values]) => [key, [...values]]));
}
export function columnStyle<T>(
  column: ColumnType<T>,
  columns: ColumnType<T>[],
  utilities: number,
): string {
  let style =
    column.width && column.width > 0
      ? `width:${column.width}px;min-width:${column.width}px;`
      : column.fixed
        ? 'width:120px;min-width:120px;'
        : '';
  style += `text-align:${column.align ?? 'left'};`;
  const index = columns.findIndex((item) => item.key === column.key);
  if (column.fixed === 'left')
    style += `left:${
      utilities * 48 +
      columns
        .slice(0, index)
        .filter((item) => item.fixed === 'left')
        .reduce((offset, item) => offset + (item.width && item.width > 0 ? item.width : 120), 0)
    }px;`;
  if (column.fixed === 'right')
    style += `right:${columns
      .slice(index + 1)
      .filter((item) => item.fixed === 'right')
      .reduce((offset, item) => offset + (item.width && item.width > 0 ? item.width : 120), 0)}px;`;
  return style;
}
export function filterSelected(values: FilterValue[] | undefined, value: FilterValue) {
  return values?.includes(value) ?? false;
}
export function pageSelectionFlag<T>(
  rows: TableRecord<T>[],
  selected: TableKey[],
  loading: boolean | undefined,
  selection: TableRowSelection<T> | undefined,
  flag: 'all' | 'mixed' | 'disabled',
) {
  const keys = rows
    .filter((row) => !loading && !selection?.disabled && !selection?.getDisabled?.(row.data))
    .map((row) => row.key);
  const count = keys.filter((key) => selected.includes(key)).length;
  return flag === 'all'
    ? keys.length > 0 && count === keys.length
    : flag === 'mixed'
      ? count > 0 && count < keys.length
      : keys.length === 0;
}
