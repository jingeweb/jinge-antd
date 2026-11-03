import { Tooltip, Button, Space } from 'jinge-antd';

export function TooltipExample() {
  return (
    <Space size="md" wrap>
      <Tooltip content="悬浮或键盘聚焦时显示，Esc 关闭。">
        <Button>悬浮或聚焦</Button>
      </Tooltip>
      <Tooltip placement="right" content="空间不足时会自动翻转。">
        <Button>右侧提示</Button>
      </Tooltip>
      <Tooltip triggerMethod="click" content="再次点击或按 Esc 可关闭。">
        <Button>点击提示</Button>
      </Tooltip>
    </Space>
  );
}
