import { vm } from 'jinge';
import { Button, Result, type ResultStatus, Space } from 'jinge-antd';

export function ResultExample() {
  const state = vm({ status: 'success' as ResultStatus, retries: 0 });
  return (
    <Space direction="vertical" style="width:100%">
      <label>
        处理结果{' '}
        <select
          aria-label="处理结果"
          value={state.status}
          on:change={(event) => {
            state.status = (event.target as HTMLSelectElement).value as ResultStatus;
          }}
        >
          <option value="success">成功</option>
          <option value="info">信息</option>
          <option value="warning">警告</option>
          <option value="error">失败</option>
          <option value="403">403</option>
          <option value="404">404</option>
          <option value="500">500</option>
        </select>
      </label>
      <Result
        status={state.status}
        slot:extra={
          <Button
            type="primary"
            on:click={() => {
              state.retries++;
              state.status = 'success';
            }}
          >
            重试操作
          </Button>
        }
      >
        任务编号：EX-2026-001。结果详情和下一步操作由业务提供。
      </Result>
      <span role="status">已重试 {state.retries} 次</span>
    </Space>
  );
}
