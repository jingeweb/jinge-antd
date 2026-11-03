import { vm } from 'jinge';
import { Popover, Input, Button, Space } from 'jinge-antd';

export function PopoverExample() {
  const state = vm({ open: false });
  return (
    <Space size="md" wrap>
      <Popover
        autoFocus
        ariaLabel="编辑备注"
        slot:content={
          <div className="demo-stack">
            <span>可交互的浮层内容</span>
            <Input placeholder="输入备注" />
          </div>
        }
      >
        <Button>编辑备注</Button>
      </Popover>
      <Popover
        open={state.open}
        triggerMethod="none"
        on:openChange={(value) => {
          state.open = value;
        }}
        ariaLabel="受控信息"
        slot:content={
          <Button
            on:click={() => {
              state.open = false;
            }}
          >
            完成并关闭
          </Button>
        }
      >
        <Button
          on:click={() => {
            state.open = !state.open;
          }}
        >
          受控浮层
        </Button>
      </Popover>
    </Space>
  );
}
