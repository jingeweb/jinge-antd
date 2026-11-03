import { vm } from 'jinge';
import { Layout, LayoutHeader, Sider, Content, LayoutFooter } from 'jinge-antd';

export function LayoutExample() {
  const state = vm({ collapsed: false });
  return (
    <Layout
      hasSider
      style="min-height:260px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden"
    >
      <Sider
        collapsible
        collapsed={state.collapsed}
        width={160}
        collapsedWidth={64}
        on:collapse={(value) => {
          state.collapsed = value;
        }}
        ariaLabel="示例导航"
      >
        <div style="padding:20px;white-space:nowrap">{state.collapsed ? 'J' : 'Jinge Antd'}</div>
      </Sider>
      <Layout>
        <LayoutHeader>应用页头</LayoutHeader>
        <Content>内容区自适应剩余宽度。点击侧栏底部按钮切换折叠。</Content>
        <LayoutFooter>页脚信息</LayoutFooter>
      </Layout>
    </Layout>
  );
}
