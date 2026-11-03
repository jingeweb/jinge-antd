import { onUnmount, vm } from 'jinge';
import {
  Button,
  notification,
  type NotificationInstance,
  type NotificationPlacement,
  Space,
} from 'jinge-antd';

export function NotificationExample() {
  const state = vm({ placement: 'topRight' as NotificationPlacement, opened: 0 });
  const instances = new Set<NotificationInstance>();
  let latest: NotificationInstance | undefined;
  onUnmount(() => {
    for (const instance of instances) instance.close();
  });
  function show() {
    const instance = notification.info({
      title: '导出任务已完成',
      placement: state.placement,
      duration: 5000,
      'slot:content': <p>客户清单已生成，可查看导出结果。悬浮或聚焦内容会暂停自动关闭。</p>,
      'slot:actions': (
        <Button
          type="primary"
          size="sm"
          on:click={() => {
            state.opened++;
            instance.close();
          }}
        >
          查看结果
        </Button>
      ),
    });
    latest = instance;
    instances.add(instance);
    void instance.waitClose().then(() => {
      instances.delete(instance);
    });
  }
  return (
    <Space direction="vertical">
      <Space wrap>
        <label>
          通知位置{' '}
          <select
            aria-label="通知位置"
            value={state.placement}
            on:change={(event) => {
              state.placement = (event.target as HTMLSelectElement).value as NotificationPlacement;
            }}
          >
            <option value="topRight">右上</option>
            <option value="topLeft">左上</option>
            <option value="bottomRight">右下</option>
            <option value="bottomLeft">左下</option>
          </select>
        </label>
        <Button on:click={show}>显示任务通知</Button>
        <Button
          on:click={() => latest?.update({ type: 'success', title: '全部任务已完成', duration: 0 })}
        >
          更新并保持显示
        </Button>
        <Button
          on:click={() => {
            for (const instance of instances) instance.close();
          }}
        >
          关闭本示例通知
        </Button>
      </Space>
      <span role="status">已查看 {state.opened} 次结果</span>
    </Space>
  );
}
