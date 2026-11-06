import { vm } from 'jinge';
import { Breadcrumb, Button, Space } from 'jinge-antd';
export function BreadcrumbExample() {
  const state = vm({ current: 'Ada', visited: '尚未导航' });
  return (
    <Space direction="vertical" style="width:100%">
      <Breadcrumb
        slot:separator={
          <span className="icon-[ant-design--right-outlined] text-xs" aria-hidden="true" />
        }
        items={[
          { key: 'workspace', label: '工作空间', href: '#workspace' },
          { key: 'projects', label: '项目列表', href: '#projects' },
          { key: 'detail', label: state.current },
        ]}
        on:click={(item, event) => {
          event.preventDefault();
          state.visited = item.label;
        }}
      />
      <Button
        on:click={() => {
          state.current = state.current === 'Ada' ? 'Grace' : 'Ada';
        }}
      >
        切换详情
      </Button>
      <output aria-live="polite">最近导航：{state.visited}</output>
    </Space>
  );
}
