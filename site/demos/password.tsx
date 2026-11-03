import { Password, Space } from 'jinge-antd';

export function PasswordExample() {
  return (
    <Space direction="vertical" style="width:100%">
      <label htmlFor="login-password">登录密码</label>
      <Password
        id="login-password"
        name="password"
        autoComplete="current-password"
        defaultValue="Example123"
        allowClear
        placeholder="输入密码"
      />
      <Password
        ariaLabel="固定隐藏的密码"
        defaultValue="ReadOnlyExample"
        readOnly
        visibilityToggle={false}
      />
    </Space>
  );
}
