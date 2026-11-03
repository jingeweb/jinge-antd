import { vm } from 'jinge';
import { Button, DatePicker, Form, FormField, Space, temporalSupported, useForm } from 'jinge-antd';
import { z } from 'zod';
function dateText(value: Temporal.PlainDate | null) {
  return value?.toString() ?? '未选择';
}
function disabledWeekend(value: Temporal.PlainDate) {
  return value.dayOfWeek >= 6;
}
function DateDemo() {
  const state = vm({
    value: Temporal.PlainDate.from('2026-11-03') as Temporal.PlainDate | null,
    disabled: false,
  });
  const min = Temporal.PlainDate.from('2026-01-01'),
    max = Temporal.PlainDate.from('2027-12-31'),
    initial = Temporal.PlainDate.from('2024-02-29');
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Space wrap>
        <DatePicker
          ariaLabel="业务日期"
          value={state.value}
          minDate={min}
          maxDate={max}
          disabledDate={disabledWeekend}
          disabled={state.disabled}
          allowClear
          on:change={(value) => {
            state.value = value;
          }}
        />
        <DatePicker
          ariaLabel="斜线日期"
          defaultValue={initial}
          format="dd/MM/yyyy"
          placeholder="dd/MM/yyyy"
        />
      </Space>
      <Space wrap>
        <Button
          on:click={() => {
            state.disabled = !state.disabled;
          }}
        >
          切换日期禁用
        </Button>
        <Button
          on:click={() => {
            state.value = (state.value ?? Temporal.Now.plainDateISO()).add({ days: 1 });
          }}
        >
          外部更新日期
        </Button>
      </Space>
      <output>ISO 日期：{dateText(state.value)}</output>
    </Space>
  );
}
function DateFormDemo() {
  const form = useForm(
    z.object({
      date: z.custom<Temporal.PlainDate | null>(
        (value) => value instanceof Temporal.PlainDate,
        '请选择日期',
      ),
    }),
    { defaultValues: { date: null } },
  );
  const state = vm({ saved: '尚未保存' });
  return (
    <Form
      form={form}
      on:finish={(values) => {
        state.saved = dateText(values.date);
      }}
    >
      <FormField name="date" control={form.control} label="生效日期" required>
        {(field) => (
          <DatePicker
            id={field.id}
            value={field.value ?? null}
            disabled={field.disabled}
            required={field.required}
            ariaDescribedby={field.ariaDescribedby}
            ariaInvalid={field.invalid}
            allowClear
            on:change={field['on:change']}
            on:blur={field['on:blur']}
          />
        )}
      </FormField>
      <Space wrap>
        <Button htmlType="submit" type="primary">
          保存日期
        </Button>
        <Button htmlType="reset">重置日期</Button>
      </Space>
      <output>保存结果：{state.saved}</output>
    </Form>
  );
}
export function DatePickerExample() {
  return temporalSupported() ? (
    <DateDemo />
  ) : (
    <p role="alert">此示例需要浏览器原生支持 Temporal，不加载 polyfill。</p>
  );
}
export function DatePickerFormExample() {
  return temporalSupported() ? (
    <DateFormDemo />
  ) : (
    <p role="alert">此示例需要浏览器原生支持 Temporal，不加载 polyfill。</p>
  );
}
