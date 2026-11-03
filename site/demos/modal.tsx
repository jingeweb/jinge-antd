import { onUnmount, vm } from 'jinge';
import { Button, Modal, Space, modal } from 'jinge-antd';

export function ModalExample() {
  const state = vm({ open: false, name: '张三', saved: '', reject: false });
  let timer = 0;
  onUnmount(() => window.clearTimeout(timer));
  function save() {
    return new Promise<boolean>((resolve) => {
      timer = window.setTimeout(() => {
        if (!state.reject) state.saved = state.name;
        resolve(!state.reject);
      }, 400);
    });
  }
  return (
    <Space direction="vertical">
      <Button
        type="primary"
        on:click={() => {
          state.open = true;
        }}
      >
        编辑客户
      </Button>
      <span role="status">已保存：{state.saved || '尚未保存'}</span>
      <Modal
        open={state.open}
        title="编辑客户"
        on:openChange={(open) => {
          state.open = open;
        }}
        on:confirm={save}
      >
        <label>
          客户姓名{' '}
          <input
            aria-label="客户姓名"
            value={state.name}
            on:input={(event) => {
              state.name = (event.target as HTMLInputElement).value;
            }}
          />
        </label>
        <p>
          <label>
            <input
              type="checkbox"
              checked={state.reject}
              on:change={(event) => {
                state.reject = (event.target as HTMLInputElement).checked;
              }}
            />
            模拟校验不通过，返回 false
          </label>
        </p>
        <p>支持 Tab 循环、Escape 关闭和关闭后的焦点恢复。提交期间禁止重复操作。</p>
      </Modal>
    </Space>
  );
}

export function ModalResultExample() {
  const state = vm({ result: '未选择' });
  let current: ReturnType<typeof modal.show<string>> | undefined;
  onUnmount(() => current?.close());
  async function show() {
    current = modal.show<string>({
      title: '确认归档？',
      content: '归档后可在历史记录中查询。',
      confirmValue: '已归档',
      cancelValue: '已取消',
      size: 'sm',
    });
    state.result = (await current.waitForClose()) ?? '已关闭';
    current = undefined;
  }
  return (
    <Space>
      <Button on:click={show}>命令式确认</Button>
      <span role="status">{state.result}</span>
    </Space>
  );
}
