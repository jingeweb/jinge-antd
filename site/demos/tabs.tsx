import { vm } from 'jinge';
import { Button, Input, Space, Tabs } from 'jinge-antd';

export function TabsExample() {
  const state = vm({ active: 'overview', vertical: false, destroy: false, draft: '' });
  const options = [
    {
      key: 'overview',
      label: '项目概览',
      'slot:content': (
        <Input
          ariaLabel="项目备注"
          placeholder="切换面板后保留备注"
          value={state.draft}
          on:change={(value) => {
            state.draft = value;
          }}
        />
      ),
    },
    { key: 'members', label: '成员管理', content: '成员列表与权限配置。' },
    { key: 'billing', label: '账单（无权限）', disabled: true },
  ];
  return (
    <Space direction="vertical" style="width:100%">
      <Space wrap>
        <Button
          on:click={() => {
            state.vertical = !state.vertical;
          }}
        >
          切换横纵布局
        </Button>
        <Button
          on:click={() => {
            state.destroy = !state.destroy;
          }}
        >
          切换销毁模式
        </Button>
      </Space>
      <Tabs
        activeKey={state.active}
        ariaLabel="项目详情"
        orientation={state.vertical ? 'vertical' : 'horizontal'}
        destroyOnHidden={state.destroy}
        on:change={(key) => {
          state.active = key;
        }}
        options={options}
      />
      <output>
        当前标签：{state.active}；内容销毁：{state.destroy ? '开启' : '关闭'}
      </output>
    </Space>
  );
}
export function TabsVariantsExample() {
  return (
    <Tabs
      type="card"
      size="sm"
      activation="manual"
      ariaLabel="报表时间范围"
      defaultActiveKey={7}
      options={[
        { key: 1, label: '今日', content: '今日报表。' },
        { key: 7, label: '近七日', content: '近七日报表。' },
        { key: 30, label: '近三十日', content: '近三十日报表。' },
      ]}
    />
  );
}
