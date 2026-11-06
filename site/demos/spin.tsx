import { vm } from 'jinge';
import { Button, Spin, Space } from 'jinge-antd';

export function SpinExample() {
  const state = vm({ busy: false });
  return (
    <Space direction="vertical" style="width:100%">
      <Space size="lg">
        <Spin size="sm" />
        <Spin />
        <Spin
          size="lg"
          slot:indicator={
            <span
              className="icon-[ant-design--loading-outlined] animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          }
          tip="自定义图标"
        />
      </Space>
      <Button
        on:click={() => {
          state.busy = !state.busy;
        }}
      >
        切换加载遮罩
      </Button>
      <Spin spinning={state.busy} delay={200} tip="正在加载客户信息">
        <div style="padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <label>
            客户备注 <input aria-label="加载区域备注" />
          </label>
          <p>输入会保留；加载期间不可点击或 Tab 进入。</p>
        </div>
      </Spin>
    </Space>
  );
}
