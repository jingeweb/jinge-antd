import { vm } from 'jinge';
import { Button, Progress, Space } from 'jinge-antd';

export function ProgressExample() {
  const state = vm({ percent: 35, failed: false });
  return (
    <Space direction="vertical" style="width:100%">
      <Progress
        percent={state.percent}
        status={state.failed ? 'exception' : undefined}
        ariaLabel="上传进度"
      />
      <Space wrap>
        <Progress
          type="circle"
          percent={state.percent}
          status={state.failed ? 'exception' : undefined}
          ariaLabel="任务完成度"
        />
        <Progress
          type="circle"
          percent={75}
          size="sm"
          strokeColor="#722ed1"
          ariaLabel="自定义进度"
          slot:info={(info) => <span>{info.percent}/100</span>}
        />
      </Space>
      <Space wrap>
        <Button
          on:click={() => {
            state.percent = Math.min(100, state.percent + 25);
          }}
        >
          增加进度
        </Button>
        <Button
          on:click={() => {
            state.percent = 0;
            state.failed = false;
          }}
        >
          重置进度
        </Button>
        <Button
          on:click={() => {
            state.failed = !state.failed;
          }}
        >
          切换异常状态
        </Button>
      </Space>
    </Space>
  );
}
