import { cx, JNode } from 'jinge';
import { TableProps } from './common';

export function Table<T>(props: TableProps<T>) {
  return (
    <table className={cx('ja-table', props.className)}>
      <thead>
        <tr>
          {props.columns.map((column, index) => (
            <th key='key' style={column.width === undefined ? '' : `${column.width}px`}>
              {column['slot:title']?.({
                define: column,
                index,
              }) ?? column['title']}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data?.map((rowData, rowIndex) => (
          <tr key={props.rowKey}>
            {props.columns.map((column, columnIndex) => (
              <td key='key'>
                {column['slot:render']?.({
                  data: rowData,
                  columnDefine: column,
                  rowIndex,
                  columnIndex,
                }) ?? (rowData[column.dataIndex as keyof T] as JNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
