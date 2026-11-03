import { vm } from 'jinge';
import { Button, Card, Space } from 'jinge-antd';

export function CardExample() {
  const state = vm({ loading: false, actions: 0 });
  return (
    <Space direction="vertical" style="width:100%">
      <Card
        title="客户资料"
        loading={state.loading}
        slot:extra={
          <Button
            size="sm"
            on:click={() => {
              state.loading = !state.loading;
            }}
          >
            切换加载
          </Button>
        }
        slot:cover={
          <div style="padding:16px 24px;background:#e6f4ff;color:#0958d9">企业客户 · 上海</div>
        }
        slot:actions={
          <Button
            on:click={() => {
              state.actions++;
            }}
          >
            记录操作
          </Button>
        }
      >
        <p>张三 · 已签约客户</p>
        <label>
          备注 <input aria-label="卡片备注" placeholder="切换加载后保留输入" />
        </label>
      </Card>
      <span role="status">已操作 {state.actions} 次</span>
      <Card size="sm" bordered={false} hoverable ariaLabel="紧凑摘要">
        无标题、无边框的紧凑卡片。hoverable 只提供视觉反馈，操作应使用明确的按钮或链接。
      </Card>
    </Space>
  );
}
