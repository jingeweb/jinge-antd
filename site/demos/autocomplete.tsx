import { onUnmount, vm } from 'jinge';
import { AutoComplete, Space } from 'jinge-antd';
export function AutoCompleteExample() {
  const state = vm({
    text: '',
    loading: false,
    options: [{ value: 'support@example.com', label: 'support@example.com' }],
    selected: '',
  });
  let timer = 0;
  onUnmount(() => window.clearTimeout(timer));
  return (
    <Space direction="vertical" style="width:100%;max-width:440px">
      <label htmlFor="contact-email">联系邮箱</label>
      <AutoComplete
        id="contact-email"
        name="email"
        value={state.text}
        on:change={(value) => {
          state.text = value;
          state.selected = '';
        }}
        options={state.options}
        loading={state.loading}
        filterOption={false}
        allowClear
        placeholder="可自由输入，也可采用建议"
        autoComplete="email"
        on:search={(query) => {
          window.clearTimeout(timer);
          if (!query) {
            state.options = [];
            state.loading = false;
            return;
          }
          state.loading = true;
          timer = window.setTimeout(() => {
            const account = query.split('@')[0];
            state.options = ['example.com', 'company.cn'].map((domain) => ({
              value: `${account}@${domain}`,
              label: `${account}@${domain}`,
            }));
            state.loading = false;
          }, 250);
        }}
        on:select={(value) => {
          state.selected = value;
        }}
      />
      <output aria-live="polite">
        {state.selected ? `已采用建议：${state.selected}` : '可保留自由输入'}
      </output>
      <AutoComplete
        ariaLabel="只读邮箱"
        options={[]}
        defaultValue="readonly@example.com"
        readOnly
      />
    </Space>
  );
}
