import { vm } from 'jinge';
import { Menu, Space } from 'jinge-antd';
export function MenuExample() {
  const state = vm({ page: 'overview' as string | undefined, open: ['members'] });
  return (
    <Space direction="vertical" style="width:100%">
      <Menu
        ariaLabel="顶部导航"
        mode="horizontal"
        on:change={(value, event) => {
          event.preventDefault();
          state.page = value;
        }}
        defaultValue="dashboard"
        options={[
          { value: 'dashboard', label: '工作台', href: '#menu-dashboard' },
          {
            value: 'settings',
            label: '设置',
            children: [
              { value: 'profile', label: '个人信息', href: '#menu-profile' },
              { value: 'security', label: '安全设置', href: '#menu-security' },
            ],
          },
        ]}
      />
      <Menu
        ariaLabel="后台导航"
        style="width:260px;max-width:100%;border:1px solid #eee;border-radius:6px"
        value={state.page}
        on:change={(value) => {
          state.page = value;
        }}
        openKeys={state.open}
        on:openChange={(keys) => {
          state.open = keys;
        }}
        options={[
          { value: 'overview', label: '概览' },
          {
            value: 'members',
            label: '成员管理',
            children: [
              { value: 'users', label: '用户列表' },
              { value: 'roles', label: '角色权限' },
            ],
          },
          { value: 'divider', type: 'divider' },
          {
            value: 'system',
            type: 'group',
            label: '系统',
            children: [
              { value: 'audit', label: '审计记录' },
              { value: 'legacy', label: '旧版入口', disabled: true },
            ],
          },
        ]}
      />
      <output aria-live="polite">当前页面：{state.page}</output>
    </Space>
  );
}
