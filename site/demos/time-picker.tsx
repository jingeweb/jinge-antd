import { vm } from 'jinge';
import { Button, Space, temporalSupported, TimePicker } from 'jinge-antd';
function text(value: Temporal.PlainTime | null) {
  return value?.toString({ smallestUnit: 'second' }) ?? '未选择';
}
function closedHours() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 22, 23];
}
function TimeDemo() {
  const state = vm({
    value: Temporal.PlainTime.from('09:00') as Temporal.PlainTime | null,
    disabled: false,
  });
  const initial = Temporal.PlainTime.from('12:30');
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Space wrap>
        <TimePicker
          ariaLabel="预约时间"
          value={state.value}
          minuteStep={15}
          disabledHours={closedHours}
          disabled={state.disabled}
          allowClear
          on:change={(value) => {
            state.value = value;
          }}
        />
        <TimePicker ariaLabel="分钟精度" defaultValue={initial} format="HH:mm" minuteStep={5} />
      </Space>
      <Button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        切换时间禁用
      </Button>
      <output>预约时间：{text(state.value)}</output>
    </Space>
  );
}
export function TimePickerExample() {
  return temporalSupported() ? (
    <TimeDemo />
  ) : (
    <p role="alert">此示例需要浏览器原生支持 Temporal，不加载 polyfill。</p>
  );
}
