import { vm } from 'jinge';
import { Button, Drawer, type DrawerPlacement, Space } from 'jinge-antd';

export function DrawerExample() {
  const state = vm({ open: false, child: false, placement: 'right' as DrawerPlacement, note: '' });
  return (
    <Space wrap>
      <label>
        抽屉方向{' '}
        <select
          aria-label="抽屉方向"
          value={state.placement}
          on:change={(event) => {
            state.placement = (event.target as HTMLSelectElement).value as DrawerPlacement;
          }}
        >
          <option value="right">右侧</option>
          <option value="left">左侧</option>
          <option value="top">顶部</option>
          <option value="bottom">底部</option>
        </select>
      </label>
      <Button
        on:click={() => {
          state.open = true;
        }}
      >
        查看客户详情
      </Button>
      <Drawer
        open={state.open}
        title="客户详情"
        placement={state.placement}
        on:openChange={(open) => {
          state.open = open;
        }}
        slot:footer={
          <Button
            type="primary"
            on:click={() => {
              state.open = false;
            }}
          >
            完成
          </Button>
        }
      >
        <p>张三 · 企业客户</p>
        <label>
          备注{' '}
          <input
            aria-label="客户备注"
            value={state.note}
            on:input={(event) => {
              state.note = (event.target as HTMLInputElement).value;
            }}
          />
        </label>
        <p>
          <Button
            on:click={() => {
              state.child = true;
            }}
          >
            打开关联记录
          </Button>
        </p>
        <Drawer
          open={state.child}
          title="关联记录"
          size="sm"
          on:openChange={(open) => {
            state.child = open;
          }}
        >
          <p>第二层关闭后，焦点回到第一层触发按钮。背景保持不可操作。</p>
          <Button
            on:click={() => {
              state.child = false;
            }}
          >
            返回客户详情
          </Button>
        </Drawer>
      </Drawer>
    </Space>
  );
}
