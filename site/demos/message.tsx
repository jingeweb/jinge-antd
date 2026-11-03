import { onUnmount, vm } from 'jinge';
import { Button, message, type MessageInstance, Space } from 'jinge-antd';

export function MessageExample() {
  const state = vm({ closed: 0 });
  const instances = new Set<MessageInstance>();
  let current: MessageInstance | undefined;
  function track(instance: MessageInstance) {
    instances.add(instance);
    void instance.waitClose().then(() => {
      instances.delete(instance);
    });
    return instance;
  }
  onUnmount(() => {
    for (const instance of instances) instance.close();
  });
  return (
    <Space direction="vertical">
      <Space wrap>
        <Button on:click={() => track(message.success('保存成功'))}>成功提示</Button>
        <Button on:click={() => track(message.error('保存失败，请重试'))}>错误提示</Button>
        <Button
          on:click={() => {
            current?.close();
            current = track(
              message.loading({
                content: '正在导入…',
                duration: 0,
                'on:close': () => {
                  state.closed++;
                },
              }),
            );
          }}
        >
          开始导入
        </Button>
        <Button
          on:click={() => current?.update({ type: 'success', content: '导入完成', duration: 600 })}
        >
          更新为完成
        </Button>
        <Button
          on:click={() => {
            for (const instance of instances) instance.close();
          }}
        >
          关闭本示例提示
        </Button>
      </Space>
      <span role="status">导入提示已关闭 {state.closed} 次</span>
    </Space>
  );
}
