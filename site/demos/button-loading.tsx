import { vm, onUnmount } from 'jinge';
import { Button } from 'jinge-antd';

export function ButtonLoading() {
  const state = vm({ loading: false, count: 0 });
  let timer = 0;
  onUnmount(() => window.clearTimeout(timer));
  function save() {
    state.loading = true;
    timer = window.setTimeout(() => {
      state.loading = false;
      state.count++;
    }, 800);
  }
  return (
    <div className="demo-row">
      <Button type="primary" loading={state.loading} on:click={save}>
        保存更改
      </Button>
      <Button disabled loading={false}>
        禁用按钮
      </Button>
      <span role="status">已保存 {state.count} 次</span>
    </div>
  );
}
