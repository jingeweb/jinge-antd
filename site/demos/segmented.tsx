import { vm } from 'jinge';
import { Button, Segmented, type SegmentedOption, Space } from 'jinge-antd';
export function SegmentedExample() {
  const state = vm({ range: 7 as number | undefined, disabled: false });
  const options: SegmentedOption<number>[] = [
    { value: 1, label: '今日' },
    { value: 7, label: '近七日' },
    { value: 30, label: '近三十日' },
    { value: 90, label: '季度（禁用）', disabled: true },
  ];
  return (
    <Space direction="vertical" style="width:100%">
      <Segmented
        ariaLabel="报表范围"
        options={options}
        value={state.range}
        disabled={state.disabled}
        block
        on:change={(value) => {
          state.range = value;
        }}
      />
      <Button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        切换禁用
      </Button>
      <output>报表范围：{state.range} 天</output>
      <form>
        <Space>
          <Segmented
            ariaLabel="视图模式"
            name="view"
            defaultValue="list"
            size="sm"
            options={[
              { value: 'list', label: '列表' },
              { value: 'card', label: '卡片' },
            ]}
          />
          <Button htmlType="reset">重置视图</Button>
        </Space>
      </form>
    </Space>
  );
}
