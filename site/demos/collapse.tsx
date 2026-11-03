import { vm } from 'jinge';
import { Button, Collapse, type CollapseItem, Space } from 'jinge-antd';

export function CollapseExample() {
  const state = vm({ keys: ['profile'], accordion: false, extra: 0 });
  const items: CollapseItem[] = [
    {
      key: 'profile',
      label: '客户信息',
      'slot:content': (
        <label>
          备注 <input aria-label="折叠面板备注" />
        </label>
      ),
      'slot:extra': (
        <Button
          size="sm"
          on:click={() => {
            state.extra++;
          }}
        >
          附加操作
        </Button>
      ),
    },
    { key: 'records', label: '联系记录', content: '2026-11-03：已完成首次联系。' },
    { key: 'advanced', label: '高级设置（禁用）', disabled: true, content: '需要管理员权限。' },
  ];
  return (
    <Space direction="vertical" style="width:100%">
      <label>
        <input
          type="checkbox"
          checked={state.accordion}
          on:change={(event) => {
            state.accordion = (event.target as HTMLInputElement).checked;
          }}
        />
        手风琴模式
      </label>
      <Collapse
        items={items}
        activeKeys={state.keys}
        accordion={state.accordion}
        on:change={(keys) => {
          state.keys = keys;
        }}
      />
      <span role="status">附加操作 {state.extra} 次</span>
    </Space>
  );
}
