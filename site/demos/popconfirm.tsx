import { vm, onUnmount } from 'jinge';
import { Popconfirm, Button, Space } from 'jinge-antd';

export function PopconfirmExample() {
  const state = vm({ removed: 0 });
  let timer = 0;
  onUnmount(() => window.clearTimeout(timer));
  function remove() {
    return new Promise<void>((resolve) => {
      timer = window.setTimeout(() => {
        state.removed++;
        resolve();
      }, 500);
    });
  }
  return (
    <Space size="md" wrap>
      <Popconfirm
        title="确认删除这条记录？"
        content="确认后模拟异步操作，提交期间防止重复点击。"
        on:confirm={remove}
      >
        <Button danger>删除记录</Button>
      </Popconfirm>
      <Popconfirm
        title="返回 false 时保持打开"
        content="可用于业务校验未通过的情况。"
        on:confirm={() => false}
      >
        <Button>阻止关闭示例</Button>
      </Popconfirm>
      <span role="status">已删除 {state.removed} 条</span>
    </Space>
  );
}
