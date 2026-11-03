import { vm } from 'jinge';
import {
  Button,
  type ColumnType,
  type SortOrder,
  Space,
  Table,
  type TableRowSelection,
  Tag,
} from 'jinge-antd';
type User = { id: number; name: string; age: number; team: string; note: string };
const users: User[] = [
  { id: 1, name: 'Ada', age: 30, team: '平台', note: '负责权限与工作空间。' },
  { id: 2, name: 'Grace', age: 24, team: '业务', note: '本记录不允许勾选。' },
  { id: 3, name: 'Linus', age: 38, team: '平台', note: '负责基础设施。' },
  { id: 4, name: 'Margaret', age: 32, team: '业务', note: '负责项目交付。' },
  { id: 5, name: 'Alan', age: 28, team: '平台', note: '负责数据服务。' },
  { id: 6, name: 'Barbara', age: 34, team: '业务', note: '负责体验优化。' },
];
function selectedText(keys: (string | number)[] | undefined) {
  return keys?.join(', ') || '无';
}
export function TableExample() {
  const state = vm({ rows: [...users], loading: false, edited: '尚未操作', query: '初始列表' });
  const selection = vm<TableRowSelection<User>>({
    selectedRowKeys: [],
    getDisabled: (row) => row.id === 2,
    'on:change': (keys) => {
      selection.selectedRowKeys = keys;
    },
  });
  const columns: ColumnType<User>[] = [
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      fixed: 'left',
      'slot:render': (cell) => <strong>{cell.data.name}</strong>,
    },
    { key: 'age', title: '年龄', dataIndex: 'age', width: 90, sorter: (a, b) => a.age - b.age },
    {
      key: 'team',
      title: '团队',
      dataIndex: 'team',
      width: 110,
      filters: [
        { text: '平台', value: '平台' },
        { text: '业务', value: '业务' },
      ],
    },
    { key: 'note', title: '说明', dataIndex: 'note', ellipsis: true },
    {
      key: 'action',
      title: '操作',
      width: 110,
      fixed: 'right',
      'slot:render': (cell) => (
        <Button
          size="sm"
          type="link"
          on:click={() => {
            state.edited = cell.data.name;
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Space wrap>
        <Button
          on:click={() => {
            state.loading = !state.loading;
          }}
        >
          切换表格加载
        </Button>
        <Button
          on:click={() => {
            selection.selectedRowKeys = [];
          }}
        >
          清空选择
        </Button>
        <Button
          on:click={() => {
            state.rows = state.rows.length ? [] : [...users];
          }}
        >
          切换空数据
        </Button>
      </Space>
      <Table
        rowKey="id"
        ariaLabel="团队成员"
        caption="工作空间成员"
        columns={columns}
        data={state.rows}
        size="sm"
        bordered
        loading={state.loading}
        rowSelection={selection}
        scroll={{ x: 800, y: 300 }}
        pagination={{
          defaultPageSize: 3,
          pageSizeOptions: [3, 5, 10],
          showSizeChanger: true,
          showTotal: true,
        }}
        slot:expandedRowRender={(row) => (
          <div>
            <Tag color="processing">成员详情</Tag> {row.data.name}：{row.data.note}
          </div>
        )}
        on:change={(change) => {
          state.query = `${change.action}，第 ${change.pagination.current} 页`;
        }}
      />
      <output>
        已选：{selectedText(selection.selectedRowKeys)}；最近查看：{state.edited}；{state.query}
      </output>
    </Space>
  );
}
function mockServer(page: number, size: number, order?: SortOrder) {
  const result = [...users];
  if (order) result.sort((a, b) => (a.age - b.age) * (order === 'ascend' ? 1 : -1));
  return result.slice((page - 1) * size, page * size);
}
export function TableRemoteExample() {
  const state = vm({ page: 1, size: 2, order: null as SortOrder | null, rows: mockServer(1, 2) });
  const columns = vm<ColumnType<User>[]>([
    { key: 'name', title: '姓名', dataIndex: 'name' },
    { key: 'age', title: '年龄', dataIndex: 'age', sorter: true, sortOrder: null },
  ]);
  return (
    <Table
      rowKey="id"
      ariaLabel="远程成员"
      columns={columns}
      data={state.rows}
      remote
      size="sm"
      pagination={{
        current: state.page,
        pageSize: state.size,
        total: users.length,
        showTotal: true,
      }}
      on:change={(change) => {
        state.page = change.pagination.current;
        state.size = change.pagination.pageSize;
        state.order = change.sorter.order ?? null;
        columns[1].sortOrder = state.order;
        state.rows = mockServer(state.page, state.size, change.sorter.order);
      }}
    />
  );
}
