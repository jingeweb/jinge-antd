import { Button } from 'jinge-antd';

export function ButtonBasic() {
  return (
    <div className="demo-row">
      <Button type="primary">主要操作</Button>
      <Button>默认按钮</Button>
      <Button type="text">文字按钮</Button>
      <Button type="link">链接样式</Button>
      <Button danger>删除</Button>
    </div>
  );
}
