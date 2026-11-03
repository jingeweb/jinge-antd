import { vm } from 'jinge';
import { Button, Pagination, Space } from 'jinge-antd';
export function PaginationExample() {
  const state = vm({ current: 3, size: 10, total: 247, disabled: false });
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Pagination
        total={state.total}
        current={state.current}
        pageSize={state.size}
        ariaLabel="用户列表分页"
        showSizeChanger
        showQuickJumper
        showTotal
        disabled={state.disabled}
        on:change={(page, size) => {
          state.current = page;
          state.size = size;
        }}
      />
      <Space wrap>
        <Button
          on:click={() => {
            state.total = state.total === 247 ? 12 : 247;
          }}
        >
          切换数据总量
        </Button>
        <Button
          on:click={() => {
            state.disabled = !state.disabled;
          }}
        >
          切换分页禁用
        </Button>
      </Space>
      <output>
        第 {state.current} 页，每页 {state.size} 条
      </output>
      <Pagination total={80} defaultCurrent={2} size="sm" simple ariaLabel="精简分页" />
    </Space>
  );
}
