import { vm } from 'jinge';
import { Select, Space } from 'jinge-antd';
const users = [
  { value: 'ada', label: 'Ada', group: '研发' },
  { value: 'grace', label: 'Grace', group: '研发' },
  { value: 'lin', label: '小林', group: '运营' },
  { value: 'former', label: '已离职', disabled: true, group: '运营' },
];
export function SelectExample() {
  const state = vm({ owner: null as string | null | undefined, reviewers: ['ada'] });
  return (
    <Space direction="vertical" style="width:100%;max-width:440px">
      <label htmlFor="project-owner">项目负责人</label>
      <Select
        id="project-owner"
        name="owner"
        value={state.owner}
        on:change={(value) => {
          state.owner = value;
        }}
        options={users}
        showSearch
        allowClear
        placeholder="搜索并选择负责人"
        slot:option={(slot) => (
          <span>
            {slot.option.label}
            <small style="margin-left:12px;color:#666">{slot.option.group}</small>
          </span>
        )}
      />
      <label htmlFor="project-reviewers">评审人</label>
      <Select
        id="project-reviewers"
        name="reviewers"
        mode="multiple"
        options={users}
        value={state.reviewers}
        on:change={(value) => {
          state.reviewers = value;
        }}
        allowClear
        maxTagCount={2}
        placeholder="选择多位评审人"
      />
      <Select ariaLabel="停用的选择器" options={users} defaultValue="ada" disabled />
    </Space>
  );
}
