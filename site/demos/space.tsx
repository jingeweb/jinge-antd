import { vm } from 'jinge';
import { Space, Flex, Button } from 'jinge-antd';

export function SpaceExample() {
  const state = vm({ vertical: false });
  return (
    <div className="demo-stack">
      <Button
        on:click={() => {
          state.vertical = !state.vertical;
        }}
      >
        切换排列方向
      </Button>
      <Space direction={state.vertical ? 'vertical' : 'horizontal'} size="md" wrap>
        <Button type="primary">新增</Button>
        <Button>导出</Button>
        <Button>更多操作</Button>
      </Space>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <span>左侧内容</span>
        <Button>右侧操作</Button>
      </Flex>
    </div>
  );
}
