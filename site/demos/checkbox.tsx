import { vm } from 'jinge';
import { Checkbox, CheckboxGroup, Space } from 'jinge-antd';
const options = [
  { value: 'read', label: '查看' },
  { value: 'edit', label: '编辑' },
  { value: 'export', label: '导出' },
];
export function CheckboxExample() {
  const state = vm({ values: ['read'] });
  return (
    <Space direction="vertical">
      <Checkbox
        label="全部权限"
        checked={state.values.length === 3}
        indeterminate={state.values.length > 0 && state.values.length < 3}
        on:change={(checked) => {
          state.values = checked ? ['read', 'edit', 'export'] : [];
        }}
      />
      <CheckboxGroup
        legend="角色权限"
        name="permissions"
        options={options}
        value={state.values}
        on:change={(values) => {
          state.values = values;
        }}
      />
      <Checkbox label="禁用选项" defaultChecked disabled />
    </Space>
  );
}
