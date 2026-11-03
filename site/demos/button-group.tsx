import { vm } from 'jinge';
import { Button, ButtonGroup } from 'jinge-antd';

export function ButtonGroups() {
  const state = vm({ disabled: false });
  return (
    <div className="demo-stack">
      <div className="demo-row">
        <ButtonGroup size="sm" disabled={state.disabled} ariaLabel="记录操作">
          <Button>编辑</Button>
          <Button>复制</Button>
          <Button danger>删除</Button>
        </ButtonGroup>
        <Button
          on:click={() => {
            state.disabled = !state.disabled;
          }}
        >
          {state.disabled ? '启用分组' : '禁用分组'}
        </Button>
      </div>
      <ButtonGroup direction="vertical" ariaLabel="视图切换">
        <Button>列表视图</Button>
        <Button>卡片视图</Button>
      </ButtonGroup>
    </div>
  );
}
