import type { JNode, WithEvents, WithPropSlot, WithSlots } from 'jinge';

import type { PaginationProps } from '../pagination';
export type TableKey = string | number;
export type SortOrder = 'ascend' | 'descend';
export type FilterValue = string | number;
export interface CellProps<T> {
  data: T;
  columnIndex: number;
  rowIndex: number;
  columnDefine: ColumnType<T>;
}
export interface ColumnProps<T> {
  define: ColumnType<T>;
  index: number;
}
export type ColumnType<T> = {
  key: string;
  dataIndex?: keyof T;
  width?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  sortOrder?: SortOrder | null;
  defaultSortOrder?: SortOrder;
  filters?: { text: string; value: FilterValue }[];
  filteredValue?: FilterValue[] | null;
  defaultFilteredValue?: FilterValue[];
  filterMultiple?: boolean;
  onFilter?(value: FilterValue, row: T): boolean;
  'slot:render'?: (cell: CellProps<T>) => JNode;
} & WithPropSlot<'title', (column: ColumnProps<T>) => JNode>;
export type TablePagination = Omit<PaginationProps, 'on:change' | 'on:pageSizeChange'>;
export type TableRowSelection<T> = {
  type?: 'checkbox' | 'radio';
  selectedRowKeys?: TableKey[];
  defaultSelectedRowKeys?: TableKey[];
  preserveSelectedRowKeys?: boolean;
  disabled?: boolean;
  getDisabled?(row: T): boolean;
  'on:change'?(keys: TableKey[], rows: T[]): void;
};
export type TableSorter = { columnKey?: string; order?: SortOrder };
export type TableChange<T> = {
  action: 'paginate' | 'sort' | 'filter';
  pagination: { current: number; pageSize: number; total: number };
  sorter: TableSorter;
  filters: Record<string, FilterValue[]>;
  currentData: T[];
};
export type TableProps<T> = {
  rowKey: Extract<keyof T, string> | ((row: T) => TableKey);
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: string;
  bordered?: boolean;
  columns: ColumnType<T>[];
  data?: T[];
  caption?: string;
  ariaLabel?: string;
  emptyText?: string;
  loading?: boolean;
  loadingText?: string;
  remote?: boolean;
  pagination?: false | TablePagination;
  rowSelection?: TableRowSelection<T>;
  scroll?: { x?: number; y?: number };
  expandedRowKeys?: TableKey[];
  defaultExpandedRowKeys?: TableKey[];
  rowExpandable?(row: T): boolean;
  rowClassName?(row: T, index: number): string;
} & WithSlots<{
  empty?: JNode;
  expandedRowRender?: (row: { data: T; rowIndex: number }) => JNode;
}> &
  WithEvents<{
    change?(change: TableChange<T>): void;
    expand?(expanded: boolean, row: T): void;
    expandedRowsChange?(keys: TableKey[]): void;
  }>;
export type TableRecord<T> = { key: TableKey; data: T; index: number };
