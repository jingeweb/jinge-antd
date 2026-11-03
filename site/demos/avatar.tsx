import { vm } from 'jinge';
import { Avatar, Button, Space, AntDesignInfoCircleFilled } from 'jinge-antd';

const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#1677ff"/><circle cx="40" cy="29" r="15" fill="white"/><path d="M12 78a28 28 0 0 1 56 0" fill="white"/></svg>')}`;
export function AvatarExample() {
  const state = vm({ broken: false });
  return (
    <Space direction="vertical">
      <Space wrap>
        <Avatar size="sm" alt="张三">
          张
        </Avatar>
        <Avatar size="md" alt="团队" shape="square" slot:icon={<AntDesignInfoCircleFilled />} />
        <Avatar size="lg" alt="Ada" style="background:#87d068">
          A
        </Avatar>
        <Avatar
          size={56}
          src={state.broken ? 'data:image/png;base64,broken' : portrait}
          alt="客户头像"
        >
          客户
        </Avatar>
      </Space>
      <Button
        on:click={() => {
          state.broken = !state.broken;
        }}
      >
        {state.broken ? '重新加载图片' : '模拟图片失败'}
      </Button>
    </Space>
  );
}
