import { vm } from 'jinge';
import { Button, TextArea, Space } from 'jinge-antd';

export function TextAreaExample() {
  const state = vm({ note: '' });
  return (
    <Space direction="vertical" style="width:100%">
      <label htmlFor="customer-note">客户说明</label>
      <TextArea
        id="customer-note"
        name="note"
        value={state.note}
        on:change={(value) => {
          state.note = value;
        }}
        autoSize={{ minRows: 2, maxRows: 5 }}
        allowClear
        showCount
        maxLength={200}
        placeholder="自动增长，最多五行"
      />
      <Button
        on:click={() => {
          state.note = '首次联系\n了解需求\n发送资料\n演示产品\n确认预算\n安排签约';
        }}
      >
        填充长说明
      </Button>
    </Space>
  );
}
