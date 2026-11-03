import { vm } from 'jinge';
import { RadioGroup, Space } from 'jinge-antd';
export function RadioExample() {
  const state = vm({ plan: 'basic' as string | undefined, view: 'table' as string | undefined });
  return (
    <Space direction="vertical">
      <RadioGroup
        legend="服务方案"
        name="plan"
        value={state.plan}
        on:change={(value) => {
          state.plan = value;
        }}
        options={[
          { value: 'basic', label: '标准版' },
          { value: 'pro', label: '专业版' },
          { value: 'legacy', label: '旧版（不可用）', disabled: true },
        ]}
      />
      <RadioGroup
        legend="展示方式"
        name="view"
        variant="button"
        size="sm"
        value={state.view}
        on:change={(value) => {
          state.view = value;
        }}
        options={[
          { value: 'table', label: '表格' },
          { value: 'card', label: '卡片' },
        ]}
      />
    </Space>
  );
}
