import { z } from 'zod';

import { Form, useForm, type FormInstance } from '../../src';

// These declarations verify the input/output contract; they are not invoked by runtime fixtures.
export function FormTransformTypes() {
  const form = useForm(z.object({ amount: z.string().transform(Number) }), {
    defaultValues: { amount: '12' },
  });
  const expected: FormInstance<{ amount: string }, { amount: number }> = form;
  void expected.setField('amount', undefined);
  // @ts-expect-error A schema's input field is a string even when its parsed output is numeric.
  void form.setField('amount', 12);
  // @ts-expect-error Unknown field names cannot be registered.
  form.control.registerField('missing');
  return (
    <Form
      form={form}
      on:finish={(data) => {
        const amount: number = data.amount;
        void amount;
      }}
    />
  );
}
