import { Button } from 'jinge-antd';

export function ButtonSizes() {
  return (
    <div className="demo-stack">
      <div className="demo-row">
        <Button size="sm">小按钮</Button>
        <Button size="md">中按钮</Button>
        <Button size="lg">大按钮</Button>
        <Button shape="round">圆角按钮</Button>
        <Button
          shape="circle"
          ariaLabel="确认"
          slot:icon={<span className="icon-[ant-design--check-circle-filled]" aria-hidden="true" />}
        />
      </div>
      <Button block type="primary">
        占满容器
      </Button>
      <div className="demo-dark">
        <Button ghost type="primary">
          幽灵按钮
        </Button>
      </div>
    </div>
  );
}
