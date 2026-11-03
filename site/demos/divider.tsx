import { Divider } from 'jinge-antd';

export function DividerExample() {
  return (
    <div>
      <p>内容之间用横向分割线建立结构。</p>
      <Divider />
      <Divider orientation="left">基础信息</Divider>
      <Divider dashed plain>
        其他信息
      </Divider>
      <span>编辑</span>
      <Divider type="vertical" />
      <span>查看详情</span>
    </div>
  );
}
