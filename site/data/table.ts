import type { ComponentDoc } from './types';

import { TableExample, TableRemoteExample } from '../demos/table';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import source from '../demos/table.tsx?raw';
export const tableDoc: ComponentDoc = {
  id: 'table',
  name: 'Table',
  title: '表格',
  category: '数据展示',
  status: 'ready',
  description: '中后台列表，支持排序、筛选、跨页选择、分页、固定列与展开详情。',
  demos: [
    {
      id: 'table-basic',
      title: '团队成员列表',
      description: '本地排序筛选与分页、受控跨页选择、固定列、加载/空态、单元格操作和展开行。',
      render: TableExample,
      source,
    },
    {
      id: 'table-remote',
      title: '服务端参数与受控状态',
      description:
        '示例用内存函数模拟服务端：Table 只提交查询参数，不对已加载数据二次分页或排序；生产中可替换为业务请求并自行处理竞态。',
      render: TableRemoteExample,
      source,
    },
  ],
  api: [
    {
      name: 'rowKey / data / columns',
      type: 'keyof T | (row) => string | number / T[] / ColumnType<T>[]',
      description:
        '每行需要唯一且稳定的字符串或有限数字键；每列唯一字符串 key。缺失/重复行键、重复列键报错。数据和列改变时保持仍可见的 keyed 行及单元格身份。',
    },
    {
      name: 'column.dataIndex / slot:render / slot:title',
      type: 'keyof T / (CellProps<T>) => JNode / (ColumnProps<T>) => JNode',
      description:
        '文本字段或单元格插槽；插槽收到 data、rowIndex、columnIndex、columnDefine。标题插槽收到 define/index。rowIndex 为排序筛选后索引，分页时含偏移；远程时按当前页计算。插槽初始化固定。',
    },
    {
      name: 'column.width / align / ellipsis / fixed',
      type: 'number / left | center | right / boolean / left | right',
      description:
        '像素宽度、对齐、文本省略和固定列；固定列建议给 width，缺省按 120px 初始布局，之后按真实表头尺寸测量偏移。自定义交互内容不建议 ellipsis。',
    },
    {
      name: 'column.sorter / defaultSortOrder / sortOrder',
      type: 'boolean | (a,b) => number / ascend | descend / ascend | descend | null',
      description:
        '单列升序→降序→取消，比较函数稳定排序且不修改源数据。true 只提供请求按钮，供远程排序。sortOrder 初始化存在时为受控，null 清空；最多一列设置有效受控顺序。',
    },
    {
      name: 'column.filters / onFilter / filterMultiple',
      type: '{text,value}[] / (value,row) => boolean / boolean',
      default: 'filterMultiple=false',
      description:
        'Select 筛选；默认单选，支持多选及清空，同列多值 OR、不同列 AND。无 onFilter 时按 dataIndex 严格相等匹配。空数组代表全部。',
    },
    {
      name: 'column.filteredValue / defaultFilteredValue',
      type: '(string | number)[] | null / (string | number)[]',
      description:
        '受控/初始过滤值。受控父级拒绝请求时保持 Select 选择显示；结构同步不发 change。筛选/排序请求回到第 1 页。控制模式初始化固定。',
    },
    {
      name: 'pagination',
      type: 'false | TablePagination',
      default: 'false',
      description:
        '复用 Pagination；current/defaultCurrent、pageSize/defaultPageSize 独立控制，支持大小选择、总数、跳转/精简/隐藏单页。未启用时显示所有记录；本地总数使用过滤后条数。',
    },
    {
      name: 'remote / on:change',
      type: 'boolean / (TableChange<T>) => void',
      default: 'false',
      description:
        '远程模式不处理排序、过滤或分页切片，total 从 pagination 提供。事件包含 action、pagination、sorter、filters、currentData（过滤排序后、分页前的记录；远程为已加载记录）。父级负责接受请求、加载及过期请求取消。',
    },
    {
      name: 'rowSelection',
      type: 'TableRowSelection<T>',
      description:
        'type=checkbox/radio、selectedRowKeys/defaultSelectedRowKeys、disabled/getDisabled(row)、preserveSelectedRowKeys 与 on:change(keys,loadedRows)。全选仅当前页可选记录；跨页保留仍在 data 中的键。远程跨页可开启 preserveSelectedRowKeys，回调记录仅包含当前已加载项。',
    },
    {
      name: 'rowSelection.selectedRowKeys / on:change',
      type: '(string | number)[] / (keys,rows) => void',
      description:
        '初始化存在 selectedRowKeys 时受控，父级需接受新数组。回调数组为新数组，记录仍为业务对象。配置含响应式值和函数时请声明为稳定 VM（见示例），避免 F12 的内联对象回调编译问题。选择 type 初始化固定。',
    },
    {
      name: 'slot:expandedRowRender / rowExpandable',
      type: '(row: {data,rowIndex}) => JNode / (row) => boolean',
      description:
        '展开详情与逐行可展开判断；原生按钮提供 aria-expanded/controls。关闭立即销毁详情，跨销毁需要保留的值放业务 VM。分页隐藏行时详情也卸载。',
    },
    {
      name: 'expandedRowKeys / defaultExpandedRowKeys',
      type: '(string | number)[]',
      description:
        '受控/初始展开行；移除记录时清理，不保留未加载行。on:expand(open,row) 和 on:expandedRowsChange(keys) 发送请求。',
    },
    {
      name: 'scroll',
      type: '{ x?: number; y?: number }',
      description:
        '横向表格最小宽度、纵向滚动区最大高度；设置 y 后固定表头。固定列合计实际宽度应小于滚动区可见宽度，至少留一列不固定以容纳滚动内容；在表格自身滚动区内固定，不随窗口页面吸顶。',
    },
    {
      name: 'loading / loadingText / emptyText / slot:empty',
      type: 'boolean / string / string / JNode',
      default: 'false / 加载中 / 暂无数据',
      description:
        '加载期间保留数据、显示 status 和 aria-busy，并禁用排序、筛选、分页、选择及展开；业务单元格自定义操作仍由业务管理禁用。空态保留表头和跨全部列的提示。',
    },
    {
      name: 'caption / ariaLabel / rowClassName',
      type: 'string / string / (row,index) => string',
      description:
        '原生表格标题、可访问名称与行样式。保留 table/thead/th/tbody/td 语义，不伪装为 spreadsheet grid。',
    },
    {
      name: 'size / bordered / className / style',
      type: 'sm | md | lg / boolean / string / string',
      default: 'lg / false',
      description:
        '尺寸、边框与外框样式。className/style 现在作用于 ja-table-container，表格仍有 ja-table 类。',
    },
  ],
  notes: [
    '首轮为平面数据、单列排序、原生单/多选过滤、单选/多选行、基本分页与展开。分组表头、树表、合并单元格、汇总、列显隐面板、自定义筛选弹层、编辑、拖拽和虚拟化暂缓。',
    '控制模式、插槽和选择类型在初始化时确定。不要运行中替换插槽函数（F09）；普通字段、记录、顺序、查询值正常响应。复杂配置先放稳定 VM，避免编译器在含响应式字段的内联对象中提升回调局部参数（F12）。',
    '固定列偏移通过公开 DOM ref/ResizeObserver 测量，卸载清理；不改变框架、克隆插槽或接管 DOM 行渲染。大数据请服务端分页，暂不承诺虚拟列表性能。',
    '参考：https://ant.design/components/table/ 和 https://element-plus.org/en-US/component/table.html 。',
  ],
};
