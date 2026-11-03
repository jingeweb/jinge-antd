import { vm } from 'jinge';
import { Button, Input, Space } from 'jinge-antd';

export function InputExample() {
  const state = vm({ name: '张三', prefix: '客户', submitted: '' });
  return (
    <Space direction="vertical" style="width:100%">
      <form
        on:submit={(event) => {
          event.preventDefault();
          state.submitted = state.name;
        }}
      >
        <label htmlFor="demo-customer">客户姓名</label>
        <Input
          id="demo-customer"
          name="customer"
          value={state.name}
          on:change={(value) => {
            state.name = value;
          }}
          prefix={state.prefix}
          suffix="姓名"
          allowClear
          showCount
          maxLength={20}
          autoComplete="name"
        />
        <Space wrap>
          <Button htmlType="submit">提交姓名</Button>
          <Button
            on:click={() => {
              state.prefix = state.prefix === '客户' ? '联系人' : '客户';
            }}
          >
            切换前缀
          </Button>
        </Space>
      </form>
      <span role="status">已提交：{state.submitted || '尚未提交'}</span>
      <Input ariaLabel="只读编号" defaultValue="C-2026-001" readOnly />
      <Input ariaLabel="禁用示例" defaultValue="不可编辑" disabled />
    </Space>
  );
}
