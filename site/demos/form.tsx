import { onUnmount, vm } from 'jinge';
import {
  Form,
  FormField,
  useForm,
  Input,
  Password,
  Select,
  Switch,
  TextArea,
  Button,
  Space,
} from 'jinge-antd';
import { z } from 'zod';

export function FormExample() {
  const state = vm({ note: false, message: '' });
  const pending = new Map<number, () => void>();
  let disposed = false;
  function delay(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        pending.delete(timer);
        resolve();
      }, ms);
      pending.set(timer, resolve);
    });
  }
  onUnmount(() => {
    disposed = true;
    for (const [timer, resolve] of pending) {
      window.clearTimeout(timer);
      resolve();
    }
    pending.clear();
  });
  const schema = z
    .object({
      name: z.string().trim().min(2, '姓名至少两个字符'),
      email: z
        .string()
        .trim()
        .email('请输入有效邮箱')
        .refine(async (value) => {
          if (!value) return true;
          await delay(180);
          return value !== 'taken@example.com';
        }, '邮箱已被占用'),
      password: z.string().min(6, '密码至少六位'),
      confirm: z.string(),
      role: z.enum(['member', 'admin']),
      enabled: z.boolean(),
      note: z.string().optional(),
    })
    .refine((values) => values.password === values.confirm, {
      path: ['confirm'],
      message: '两次密码不一致',
    });
  const form = useForm(schema, {
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm: '',
      role: 'member',
      enabled: true,
    },
  });
  const status = form.status;
  return (
    <div style="max-width:680px">
      <Form
        form={form}
        layout="horizontal"
        labelWidth={110}
        ariaLabel="成员信息"
        on:finish={async (data) => {
          await delay(250);
          if (!disposed) state.message = `已保存：${data.name}（${data.role}）`;
        }}
        on:finishFailed={() => {
          state.message = '请修正表单中的错误';
        }}
      >
        <FormField
          name="name"
          control={form.control}
          label="姓名"
          help="保存时会去掉首尾空格"
          required
        >
          {(field) => (
            <Input
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? ''}
              disabled={field.disabled}
              required={field.required}
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField
          name="email"
          control={form.control}
          label="邮箱"
          help="taken@example.com 用于演示异步校验失败"
          required
        >
          {(field) => (
            <Input
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? ''}
              disabled={field.disabled}
              required={field.required}
              autoComplete="email"
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="password" control={form.control} label="密码" required>
          {(field) => (
            <Password
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? ''}
              disabled={field.disabled}
              autoComplete="new-password"
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField
          name="confirm"
          control={form.control}
          label="确认密码"
          dependencies={['password']}
          required
        >
          {(field) => (
            <Password
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? ''}
              disabled={field.disabled}
              autoComplete="new-password"
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="role" control={form.control} label="角色" required>
          {(field) => (
            <Select
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? null}
              disabled={field.disabled}
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              options={[
                { value: 'member', label: '普通成员' },
                { value: 'admin', label: '管理员' },
              ]}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="enabled" control={form.control} label="启用账户">
          {(field) => (
            <Switch
              ref={field.ref}
              id={field.id}
              name={field.name}
              ariaLabel="启用账户"
              checked={field.value ?? false}
              disabled={field.disabled}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        {state.note && (
          <FormField
            name="note"
            control={form.control}
            label="备注"
            preserve={false}
            help="移除此字段时会丢弃草稿"
          >
            {(field) => (
              <TextArea
                ref={field.ref}
                id={field.id}
                value={field.value ?? ''}
                disabled={field.disabled}
                ariaDescribedby={field.ariaDescribedby}
                on:change={field['on:change']}
                on:blur={field['on:blur']}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            )}
          </FormField>
        )}
        <Space wrap>
          <Button htmlType="submit" type="primary" loading={status.submitting}>
            保存成员
          </Button>
          <Button htmlType="reset">重置表单</Button>
          <Button
            on:click={() => {
              state.note = !state.note;
            }}
          >
            {state.note ? '移除备注' : '添加备注'}
          </Button>
        </Space>
      </Form>
      <p role="status">{state.message || '尚未保存'}</p>
    </div>
  );
}
