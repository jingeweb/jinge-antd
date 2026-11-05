import { vm } from 'jinge';
import {
  Button,
  Cascader,
  Form,
  FormField,
  Space,
  useForm,
  type CascaderOption,
  type CascaderValue,
} from 'jinge-antd';
import { z } from 'zod';
const regions: CascaderOption[] = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      {
        value: 'hz',
        label: '杭州',
        children: [
          { value: 0, label: '西湖' },
          { value: 'yh', label: '余杭' },
        ],
      },
      { value: 'nb', label: '宁波', disabled: true },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];
function pathText(path: CascaderValue | null) {
  return path ? JSON.stringify(path) : '未选择';
}
export function CascaderExample() {
  const state = vm({ value: null as CascaderValue | null, intermediate: false, readOnly: false });
  let attempts = 0;
  const options: CascaderOption[] = [
    ...regions,
    { value: 'remote', label: '远程地区', isLeaf: false },
  ];
  function load(
    _node: CascaderOption,
    { signal }: { signal: AbortSignal },
  ): Promise<CascaderOption[]> {
    const attempt = ++attempts;
    return new Promise((resolve, reject) => {
      const abort = () => {
        window.clearTimeout(timer);
        reject(new Error('已取消'));
      };
      const timer = window.setTimeout(() => {
        signal.removeEventListener('abort', abort);
        if (attempt === 1) reject(new Error('模拟地区加载失败'));
        else resolve([{ value: 'remote-city', label: '远程城市' }]);
      }, 250);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  }
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Cascader
        options={options}
        value={state.value}
        showSearch
        allowClear
        changeOnSelect={state.intermediate}
        readOnly={state.readOnly}
        ariaLabel="服务地区"
        loadData={load}
        on:change={(value) => {
          state.value = value;
        }}
      />
      <Space wrap>
        <Button
          on:click={() => {
            state.intermediate = !state.intermediate;
          }}
        >
          切换中间级选择
        </Button>
        <Button
          on:click={() => {
            state.readOnly = !state.readOnly;
          }}
        >
          切换地区只读
        </Button>
      </Space>
      <output>地区路径：{pathText(state.value)}</output>
    </Space>
  );
}
export function CascaderFormExample() {
  const form = useForm(
    z.object({
      region: z
        .array(z.union([z.string(), z.number()]))
        .nullable()
        .refine((value) => !!value?.length, '请选择地区'),
    }),
    { defaultValues: { region: null } },
  );
  const state = vm({ saved: '尚未保存' });
  return (
    <Form
      form={form}
      on:finish={(values) => {
        state.saved = pathText(values.region);
      }}
    >
      <FormField name="region" control={form.control} label="审核地区" required>
        {(field) => (
          <Cascader
            ref={field.ref}
            id={field.id}
            options={regions}
            value={field.value ?? null}
            disabled={field.disabled}
            required
            ariaLabel="审核地区"
            ariaDescribedby={field.ariaDescribedby}
            ariaInvalid={field.invalid}
            allowClear
            on:change={(value) => field['on:change'](value)}
            on:blur={field['on:blur']}
          />
        )}
      </FormField>
      <Space wrap>
        <Button htmlType="submit" type="primary">
          保存地区
        </Button>
        <Button htmlType="reset">重置地区</Button>
      </Space>
      <output>保存结果：{state.saved}</output>
    </Form>
  );
}
