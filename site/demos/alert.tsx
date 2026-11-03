import { vm } from 'jinge';
import { Alert, Button, Space } from 'jinge-antd';

export function AlertExample() {
  const state = vm({ visible: true, retries: 0 });
  return (
    <Space direction="vertical" style="width:100%">
      <Alert
        title="系统通知"
        description="关闭后可通过按钮恢复。"
        closable
        visible={state.visible}
        on:visibleChange={(visible) => {
          state.visible = visible;
        }}
      />
      <Button
        on:click={() => {
          state.visible = true;
        }}
      >
        恢复系统通知
      </Button>
      <Alert type="success" title="保存成功" role="none" />
      <Alert type="warning" title="请确认账号信息" banner role="none" />
      <Alert
        type="error"
        title="保存失败"
        description={`已重试 ${state.retries} 次，请检查网络后重试。`}
        slot:action={
          <Button
            size="sm"
            on:click={() => {
              state.retries++;
            }}
          >
            重试保存
          </Button>
        }
      />
    </Space>
  );
}
