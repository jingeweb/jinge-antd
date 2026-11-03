import { vm } from 'jinge';
import { Button, type DateRange, RangePicker, Space, temporalSupported } from 'jinge-antd';
function rangeText(value: DateRange | null) {
  return value ? `${value[0].toString()} / ${value[1].toString()}` : '未选择';
}
function RangeDemo() {
  const state = vm({ value: null as DateRange | null });
  const initial = Temporal.PlainDate.from('2026-11-01'),
    min = Temporal.PlainDate.from('2026-01-01'),
    max = Temporal.PlainDate.from('2027-12-31');
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <RangePicker
        ariaLabel="报表日期范围"
        value={state.value}
        defaultPickerValue={initial}
        minDate={min}
        maxDate={max}
        placeholder="开始日期 ~ 结束日期"
        allowClear
        on:change={(value) => {
          state.value = value;
        }}
      />
      <Space wrap>
        <Button
          on:click={() => {
            const end = Temporal.Now.plainDateISO();
            state.value = [end.subtract({ days: 6 }), end];
          }}
        >
          最近七天
        </Button>
        <Button
          on:click={() => {
            state.value = null;
          }}
        >
          清空范围
        </Button>
      </Space>
      <output>ISO 范围：{rangeText(state.value)}</output>
    </Space>
  );
}
export function RangePickerExample() {
  return temporalSupported() ? (
    <RangeDemo />
  ) : (
    <p role="alert">此示例需要浏览器原生支持 Temporal，不加载 polyfill。</p>
  );
}
