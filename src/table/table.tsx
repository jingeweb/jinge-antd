import { For, cx, uid } from 'jinge';

import type { ColumnType, FilterValue, TableProps, TableSorter } from './common';

import {
  AntDesignUpOutlined,
  AntDesignDownOutlined,
  AntDesignSwapOutlined,
  AntDesignPlusOutlined,
  AntDesignMinusOutlined,
} from '../_icon';
import { Checkbox } from '../checkbox';
import { Pagination } from '../pagination';
import { Radio } from '../radio';
import { Select } from '../select';
import { pageSelectionFlag, cellText, columnStyle, hasKey } from './data';
import { useTableLayout } from './layout';
import { useTable } from './use-table';
function Title<T>(props: { column: ColumnType<T>; index: number }) {
  return (
    <>
      {props.column['slot:title']?.({ define: props.column, index: props.index }) ??
        props.column.title}
    </>
  );
}
function Cell<T>(props: { column: ColumnType<T>; data: T; rowIndex: number; columnIndex: number }) {
  return (
    <>
      {props.column['slot:render']?.({
        data: props.data,
        rowIndex: props.rowIndex,
        columnIndex: props.columnIndex,
        columnDefine: props.column,
      }) ?? cellText(props.data, props.column)}
    </>
  );
}
function emptyText(text?: string) {
  return text ?? '暂无数据';
}
function sortDirection(sorter: TableSorter, key: string) {
  return sorter.columnKey === key
    ? sorter.order === 'ascend'
      ? 'ascending'
      : 'descending'
    : 'none';
}
function utilities<T>(props: TableProps<T>) {
  return Number(!!props.rowSelection) + Number(!!props['slot:expandedRowRender']);
}
function leftFixed<T>(columns: ColumnType<T>[]) {
  return columns.some((column) => column.fixed === 'left');
}
function Filter<T>(props: {
  column: ColumnType<T>;
  values?: FilterValue[];
  disabled?: boolean;
  change(values: FilterValue[]): void;
}) {
  function options(filters: { value: FilterValue; text: string }[] | undefined) {
    return (filters ?? []).map((filter) => ({ value: filter.value, label: filter.text }));
  }
  return (
    <>
      {props.column.filterMultiple ? (
        <Select
          mode="multiple"
          className="ja-table-filter"
          size="sm"
          showSearch={false}
          ariaLabel={`筛选 ${props.column.title ?? props.column.key}`}
          value={props.values ?? []}
          options={options(props.column.filters)}
          disabled={props.disabled}
          allowClear
          placeholder="全部"
          on:change={(values) => props.change(values)}
        />
      ) : (
        <Select
          className="ja-table-filter"
          size="sm"
          ariaLabel={`筛选 ${props.column.title ?? props.column.key}`}
          value={props.values?.[0] ?? null}
          options={options(props.column.filters)}
          disabled={props.disabled}
          allowClear
          placeholder="全部"
          on:change={(value) => props.change(value === undefined ? [] : [value])}
        />
      )}
    </>
  );
}

export function Table<T>(props: TableProps<T>) {
  const { state, paginate, sort, filter, disabled, selectRow, selectPage, expandable, expand } =
    useTable(props);
  const table = useTableLayout();
  const id = `ja-table-${uid()}`,
    radioName = `${id}-select`;
  function detailId(key: string | number) {
    return `${id}-detail-${typeof key}-${encodeURIComponent(String(key))}`;
  }
  return (
    <div
      className={cx('ja-table-container', props.className)}
      style={props.style}
      aria-busy={!!props.loading}
    >
      {props.loading && (
        <div className="ja-table-loading" role="status">
          {props.loadingText ?? '加载中'}
        </div>
      )}
      <div
        className="ja-table-scroll"
        role="region"
        aria-label={`${props.ariaLabel ?? '数据表格'}滚动区域`}
        tabIndex={props.scroll?.x || props.scroll?.y ? 0 : undefined}
        style={props.scroll?.y ? `max-height:${props.scroll.y}px` : undefined}
      >
        <table
          ref={table}
          aria-label={props.ariaLabel ?? '数据表格'}
          className={cx(
            'ja-table',
            props.size ?? 'lg',
            props.bordered && 'bordered',
            !!props.scroll?.y && 'sticky-header',
          )}
          style={props.scroll?.x ? `min-width:${props.scroll.x}px` : undefined}
        >
          {props.caption && <caption>{props.caption}</caption>}
          <thead>
            <tr>
              {props.rowSelection && (
                <th
                  scope="col"
                  className={cx('ja-table-utility', leftFixed(props.columns) && 'fixed-left')}
                  style="left:0px"
                >
                  {props.rowSelection.type === 'radio' ? (
                    <span className="ja-table-sr">选择</span>
                  ) : (
                    <Checkbox
                      ariaLabel="全选当前页"
                      checked={pageSelectionFlag(
                        state.rows,
                        state.selected,
                        props.loading,
                        props.rowSelection,
                        'all',
                      )}
                      indeterminate={pageSelectionFlag(
                        state.rows,
                        state.selected,
                        props.loading,
                        props.rowSelection,
                        'mixed',
                      )}
                      disabled={
                        pageSelectionFlag(
                          state.rows,
                          state.selected,
                          props.loading,
                          props.rowSelection,
                          'disabled',
                        ) ||
                        props.loading ||
                        props.rowSelection.disabled
                      }
                      on:change={(checked) => selectPage(checked)}
                    />
                  )}
                </th>
              )}
              {props['slot:expandedRowRender'] && (
                <th
                  scope="col"
                  className={cx('ja-table-utility', leftFixed(props.columns) && 'fixed-left')}
                  style={`left:${props.rowSelection ? 48 : 0}px`}
                >
                  <span className="ja-table-sr">展开</span>
                </th>
              )}
              <For loop={props.columns} key="key">
                {(each) => (
                  <th
                    scope="col"
                    data-column-key={each.data.key}
                    className={cx(each.data.fixed && `fixed-${each.data.fixed}`)}
                    style={columnStyle(each.data, props.columns, utilities(props))}
                    aria-sort={
                      each.data.sorter ? sortDirection(state.sorter, each.data.key) : undefined
                    }
                  >
                    {each.data.sorter ? (
                      <button
                        type="button"
                        className="ja-table-sort"
                        aria-label={`排序 ${each.data.title ?? each.data.key}`}
                        disabled={props.loading}
                        on:click={() => sort(each.data)}
                      >
                        <Title column={each.data} index={each.index} />
                        <span aria-hidden="true">
                          {sortDirection(state.sorter, each.data.key) === 'ascending' ? (
                            <AntDesignUpOutlined />
                          ) : sortDirection(state.sorter, each.data.key) === 'descending' ? (
                            <AntDesignDownOutlined />
                          ) : (
                            <AntDesignSwapOutlined style="transform:rotate(90deg)" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <Title column={each.data} index={each.index} />
                    )}
                    {each.data.filters && (
                      <Filter
                        column={each.data}
                        values={state.filters[each.data.key]}
                        disabled={props.loading}
                        change={(values) => filter(each.data, values)}
                      />
                    )}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For loop={state.rows} key="key">
              {(each) => (
                <>
                  <tr
                    className={cx(
                      'ja-table-row',
                      hasKey(state.selected, each.data.key) && 'selected',
                      props.rowClassName?.(each.data.data, each.data.index),
                    )}
                  >
                    {props.rowSelection && (
                      <td
                        className={cx('ja-table-utility', leftFixed(props.columns) && 'fixed-left')}
                        style="left:0px"
                      >
                        {props.rowSelection.type === 'radio' ? (
                          <Radio
                            ariaLabel={`选择行 ${each.data.key}`}
                            name={radioName}
                            checked={hasKey(state.selected, each.data.key)}
                            disabled={disabled(each.data.data, props.loading, props.rowSelection)}
                            on:change={(checked) => selectRow(each.data, checked)}
                          />
                        ) : (
                          <Checkbox
                            ariaLabel={`选择行 ${each.data.key}`}
                            checked={hasKey(state.selected, each.data.key)}
                            disabled={disabled(each.data.data, props.loading, props.rowSelection)}
                            on:change={(checked) => selectRow(each.data, checked)}
                          />
                        )}
                      </td>
                    )}
                    {props['slot:expandedRowRender'] && (
                      <td
                        className={cx('ja-table-utility', leftFixed(props.columns) && 'fixed-left')}
                        style={`left:${props.rowSelection ? 48 : 0}px`}
                      >
                        {expandable(each.data.data) && (
                          <button
                            type="button"
                            className="ja-table-expand"
                            aria-label={`${hasKey(state.expanded, each.data.key) ? '收起' : '展开'}行 ${each.data.key}`}
                            aria-expanded={hasKey(state.expanded, each.data.key)}
                            aria-controls={detailId(each.data.key)}
                            disabled={props.loading}
                            on:click={() => expand(each.data)}
                          >
                            {hasKey(state.expanded, each.data.key) ? (
                              <AntDesignMinusOutlined />
                            ) : (
                              <AntDesignPlusOutlined />
                            )}
                          </button>
                        )}
                      </td>
                    )}
                    <For loop={props.columns} key="key">
                      {(cell) => (
                        <td
                          data-column-key={cell.data.key}
                          className={cx(
                            cell.data.fixed && `fixed-${cell.data.fixed}`,
                            cell.data.ellipsis && 'ellipsis',
                          )}
                          style={columnStyle(cell.data, props.columns, utilities(props))}
                        >
                          <Cell
                            column={cell.data}
                            data={each.data.data}
                            rowIndex={each.data.index}
                            columnIndex={cell.index}
                          />
                        </td>
                      )}
                    </For>
                  </tr>
                  {hasKey(state.expanded, each.data.key) && expandable(each.data.data) && (
                    <tr className="ja-table-expanded" id={detailId(each.data.key)}>
                      <td colSpan={props.columns.length + utilities(props)}>
                        {props['slot:expandedRowRender']?.({
                          data: each.data.data,
                          rowIndex: each.data.index,
                        })}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </For>
            {state.rows.length === 0 && (
              <tr className="ja-table-empty">
                <td colSpan={Math.max(1, props.columns.length + utilities(props))}>
                  {props['slot:empty'] ?? emptyText(props.emptyText)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {props.pagination && (
        <Pagination
          total={state.total}
          current={state.page}
          pageSize={state.pageSize}
          ariaLabel={props.pagination.ariaLabel ?? '表格分页'}
          disabled={props.loading || props.pagination.disabled}
          size={props.pagination.size}
          simple={props.pagination.simple}
          showTotal={props.pagination.showTotal}
          showSizeChanger={props.pagination.showSizeChanger}
          showQuickJumper={props.pagination.showQuickJumper}
          pageSizeOptions={props.pagination.pageSizeOptions}
          hideOnSinglePage={props.pagination.hideOnSinglePage}
          on:change={paginate}
        />
      )}
    </div>
  );
}
