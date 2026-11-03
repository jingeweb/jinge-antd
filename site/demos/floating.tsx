import { vm } from 'jinge';
import { Floating, Button, Space, type FloatingPlacement } from 'jinge-antd';

export function FloatingExample() {
  const state = vm({ open: false, placement: 'bottom' as FloatingPlacement });
  return (
    <Space size="md" wrap>
      <select
        aria-label="浮层方向"
        value={state.placement}
        on:change={(event) => {
          state.placement = event.target.value as FloatingPlacement;
        }}
      >
        <option value="top">上方</option>
        <option value="bottom">下方</option>
        <option value="left">左侧</option>
        <option value="right">右侧</option>
      </select>
      <Floating
        open={state.open}
        on:openChange={(value) => {
          state.open = value;
        }}
        placement={state.placement}
        zIndex={500}
        dismissable={false}
        ariaLabel="定位演示"
        slot:trigger={<Button>打开定位示例</Button>}
      >
        <div style="padding:16px;background:#fff;border:1px solid #ddd;border-radius:6px;width:240px">
          <p>方向：{state.placement}。修改方向后，已打开的浮层会重新定位。</p>
          <Button
            on:click={() => {
              state.open = false;
            }}
          >
            关闭
          </Button>
        </div>
      </Floating>
    </Space>
  );
}
