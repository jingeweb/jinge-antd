import { vm } from 'jinge';
import { Button, Dropdown, Space } from 'jinge-antd';
export function DropdownExample() {
  const state = vm({ action: '尚未操作', view: 'table' });
  return (
    <Space direction="vertical">
      <Dropdown
        options={[
          { value: 'edit', label: '编辑' },
          { value: 'copy', label: '复制' },
          { value: 'divider', type: 'divider' },
          { value: 'delete', label: '删除', danger: true },
          { value: 'archive', label: '归档（不可用）', disabled: true },
        ]}
        on:change={(value) => {
          state.action = value;
        }}
      >
        <Button>更多操作</Button>
      </Dropdown>
      <Dropdown
        value={state.view}
        selectable
        closeOnSelect={false}
        options={[
          { value: 'table', label: '表格视图' },
          { value: 'cards', label: '卡片视图' },
        ]}
        on:change={(value) => {
          state.view = value;
        }}
      >
        <Button>显示选项</Button>
      </Dropdown>
      <output aria-live="polite">
        最近操作：{state.action}；视图：{state.view}
      </output>
    </Space>
  );
}
