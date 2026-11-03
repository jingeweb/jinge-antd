import { onUnmount, vm } from 'jinge';
import { Switch, Space } from 'jinge-antd';
export function SwitchExample() {
  const state = vm({ checked: false, saving: false });
  let timer = 0;
  onUnmount(() => window.clearTimeout(timer));
  return (
    <Space direction="vertical">
      <Switch
        label="自动保存"
        checked={state.checked}
        loading={state.saving}
        checkedLabel="开"
        uncheckedLabel="关"
        on:change={(checked) => {
          state.checked = checked;
          state.saving = true;
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            state.saving = false;
          }, 600);
        }}
      />
      <Switch label="邮件通知" defaultChecked size="sm" />
      <Switch label="系统维护（不可修改）" defaultChecked disabled />
    </Space>
  );
}
