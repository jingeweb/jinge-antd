import { vm } from 'jinge';
import { Button, Space, Steps } from 'jinge-antd';
export function StepsExample() {
  const state = vm({ current: 1, error: false, vertical: false });
  return (
    <Space direction="vertical" style="width:100%">
      <Steps
        ariaLabel="发布流程"
        current={state.current}
        status={state.error ? 'error' : 'process'}
        direction={state.vertical ? 'vertical' : 'horizontal'}
        on:change={(index) => {
          state.current = index;
          state.error = false;
        }}
        items={[
          { key: 'draft', title: '填写信息', description: '输入项目基本信息' },
          { key: 'review', title: '审核确认', description: '确认成员与权限' },
          { key: 'publish', title: '发布上线', description: '等待管理员授权', disabled: true },
        ]}
      />
      <Space wrap>
        <Button
          on:click={() => {
            state.error = !state.error;
          }}
        >
          切换错误状态
        </Button>
        <Button
          on:click={() => {
            state.vertical = !state.vertical;
          }}
        >
          切换步骤方向
        </Button>
      </Space>
      <output>当前步骤：{state.current + 1}</output>
    </Space>
  );
}
export function StepsCompleteExample() {
  return (
    <Steps
      size="sm"
      current={3}
      ariaLabel="归档流程"
      items={[
        { key: 'submitted', title: '提交申请' },
        { key: 'approved', title: '审核通过' },
        { key: 'archived', title: '归档完成' },
      ]}
    />
  );
}
