import { vm } from 'jinge';
import { Avatar, Badge, Button, Space } from 'jinge-antd';

export function BadgeExample() {
  const state = vm({ count: 99, dot: false });
  return (
    <Space direction="vertical">
      <Space size="lg" wrap>
        <Badge count={state.count} dot={state.dot}>
          <Avatar alt="消息收件箱" shape="square">
            信
          </Avatar>
        </Badge>
        <Badge count={0} showZero />
        <Badge count="NEW" color="#722ed1" />
        <Badge status="success" text="服务在线" />
        <Badge status="processing" text="同步中" />
      </Space>
      <Space>
        <Button
          on:click={() => {
            state.count++;
          }}
        >
          增加未读
        </Button>
        <Button
          on:click={() => {
            state.count = 0;
          }}
        >
          清空未读
        </Button>
        <Button
          on:click={() => {
            state.dot = !state.dot;
          }}
        >
          切换圆点
        </Button>
      </Space>
    </Space>
  );
}
