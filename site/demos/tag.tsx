import { vm } from 'jinge';
import { Button, Tag, Space, AntDesignInfoCircleFilled } from 'jinge-antd';

export function TagExample() {
  const state = vm({ visible: true, closed: 0 });
  return (
    <Space direction="vertical">
      <Space wrap>
        <Tag>默认</Tag>
        <Tag color="success">已完成</Tag>
        <Tag color="processing" slot:icon={<AntDesignInfoCircleFilled />}>
          处理中
        </Tag>
        <Tag color="error">失败</Tag>
        <Tag color="warning" bordered={false}>
          待确认
        </Tag>
      </Space>
      <Space wrap>
        <Tag
          closable
          visible={state.visible}
          on:visibleChange={(visible) => {
            state.visible = visible;
          }}
          on:close={() => {
            state.closed++;
          }}
        >
          可移除筛选
        </Tag>
        <Tag closable closeLabel="尝试移除固定标签" on:close={(event) => event.preventDefault()}>
          固定标签
        </Tag>
        <Tag closable disabled>
          不可移除
        </Tag>
        <Button
          on:click={() => {
            state.visible = true;
          }}
        >
          恢复筛选标签
        </Button>
      </Space>
      <span role="status">已移除 {state.closed} 次</span>
    </Space>
  );
}
