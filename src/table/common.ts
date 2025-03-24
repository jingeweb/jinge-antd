import type { JNode, WithPropSlot } from 'jinge';

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
  key: keyof T | string;
  width?: number;
} & WithPropSlot<'title', (column: ColumnProps<T>) => JNode> &
  (
    | {
        'slot:render': (cell: CellProps<T>) => JNode;
        dataIndex?: never;
      }
    | {
        'slot:render'?: never;
        dataIndex: keyof T;
      }
  );

export interface TableProps<T> {
  rowKey: keyof T;
  className?: string;
  bordered?: boolean;
  columns: ColumnType<T>[];
  data?: T[];
}
