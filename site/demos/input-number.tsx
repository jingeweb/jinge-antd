import { vm } from 'jinge';
import { Button, InputNumber, Space } from 'jinge-antd';

export function InputNumberExample() {
  const state = vm({ amount: 0.1 as number | null | undefined });
  return (
    <Space direction="vertical">
      <label htmlFor="order-amount">订单金额</label>
      <InputNumber
        id="order-amount"
        name="amount"
        value={state.amount}
        min={0}
        max={100}
        step={0.1}
        precision={2}
        on:change={(value) => {
          state.amount = value;
        }}
      />
      <output aria-live="polite">
        {state.amount === undefined || state.amount === null
          ? '未填写'
          : `当前金额：${state.amount}`}
      </output>
      <Button
        on:click={() => {
          state.amount = null;
        }}
      >
        清空金额
      </Button>
      <InputNumber ariaLabel="只读数量" defaultValue={10} readOnly />
    </Space>
  );
}
