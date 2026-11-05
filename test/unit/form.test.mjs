import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui, zod } from './harness.mjs';
const z = zod.z;

void test('Form defaults are snapshots, reset replaces values and clears touched/dirty/errors without replacing the store', async () => {
  const defaults = { name: 'Ada', tags: ['a'] };
  const form = ui.useForm(z.object({ name: z.string().min(2), tags: z.array(z.string()) }), {
    defaultValues: defaults,
  });
  const store = form.formState;
  defaults.tags.push('changed');
  await form.setField('name', 'x', true);
  form.control.touch('name');
  assert.equal(form.status.dirty, true);
  assert.equal(form.control.getFieldState('name').touched, true);
  form.reset();
  await flush();
  assert.equal(form.formState, store);
  assert.deepEqual(Array.from(form.formState.tags), ['a']);
  assert.equal(form.formState.name, 'Ada');
  assert.equal(form.status.dirty, false);
  assert.equal(form.control.getFieldState('name').touched, false);
  assert.equal(form.formErrors.name, undefined);
});
void test('Form field validation preserves cross-field paths, nested issues, root errors and transformed output', async () => {
  const schema = z
    .object({
      pass: z.string(),
      confirm: z.string(),
      address: z.object({ city: z.string().min(1, 'City required') }),
      age: z.string().transform(Number),
    })
    .superRefine((value, context) => {
      if (value.pass !== value.confirm)
        context.addIssue({ code: 'custom', path: ['confirm'], message: 'Mismatch' });
      if (value.pass === 'root') context.addIssue({ code: 'custom', message: 'Form rejected' });
    });
  const form = ui.useForm(schema, {
    defaultValues: { pass: 'a', confirm: 'b', address: { city: '' }, age: '12' },
  });
  assert.equal(await form.validateField('confirm'), 'Mismatch');
  assert.equal(await form.validateField('address'), 'City required');
  await form.setField('pass', 'root');
  await form.validate();
  assert.equal(form.status.formError, 'Form rejected');
  await form.setField('pass', 'a');
  await form.setField('confirm', 'a');
  await form.setField('address', { city: 'Shanghai' });
  const [errors, data] = await form.validate();
  assert.equal(errors, undefined);
  assert.equal(data.age, 12);
  assert.equal(form.formState.age, '12');
});
void test('Form reset and direct store mutations invalidate asynchronous validation snapshots', async () => {
  const resolvers = new Map();
  const form = ui.useForm(
    z.object({
      name: z
        .string()
        .refine((value) => new Promise((resolve) => resolvers.set(value, resolve)), 'Unavailable'),
    }),
    { defaultValues: { name: 'old' } },
  );
  const first = form.validateField('name');
  form.reset({ name: 'new' });
  resolvers.get('old')(false);
  await first;
  assert.equal(form.formErrors.name, undefined);
  assert.equal(form.status.validating, false);
  const second = form.validate();
  form.formState.name = 'direct';
  resolvers.get('new')(true);
  const stale = await second;
  assert.equal(stale[2].outOfDate, true);
  assert.equal(form.formErrors.name, undefined);
});
void test('Form old whole-form validation cannot overwrite a newer field result at the same value', async () => {
  const resolvers = [];
  const form = ui.useForm(
    z.object({
      name: z.string().refine(() => new Promise((resolve) => resolvers.push(resolve)), 'Invalid'),
    }),
    { defaultValues: { name: 'Ada' } },
  );
  const older = form.validate();
  const newer = form.validateField('name');
  resolvers[1](true);
  await newer;
  resolvers[0](false);
  await older;
  assert.equal(form.formErrors.name, undefined);
});
void test('Form submit deduplicates validation/finish and reset isolates completion across submit cycles', async () => {
  const form = ui.useForm(z.object({ name: z.string() }), { defaultValues: { name: 'Ada' } });
  let finish,
    calls = 0;
  const callback = () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const first = form.submit(callback);
  const duplicate = form.submit(callback);
  assert.equal(first, duplicate);
  assert.equal(form.status.submitting, true);
  await flush();
  assert.equal(calls, 1);
  form.reset();
  const next = form.submit(async () => {
    calls++;
  });
  await next;
  finish();
  assert.equal(await first, false);
  assert.equal(form.status.submitting, false);
  assert.equal(calls, 2);
});
void test('Form invalid submissions focus registered fields and exceptions produce recoverable submit errors', async () => {
  const form = ui.useForm(z.object({ name: z.string().min(2, 'Short') }), {
    defaultValues: { name: '' },
  });
  const focused = [],
    invalid = [],
    errors = [];
  const unregister = form.control.registerField('name', { focus: () => focused.push('name') });
  assert.equal(
    await form.submit(
      () => assert.fail('invalid finish'),
      (value) => invalid.push(value),
    ),
    false,
  );
  assert.deepEqual(focused, ['name']);
  assert.equal(invalid[0].name, 'Short');
  await form.setField('name', 'Ada');
  assert.equal(
    await form.submit(
      () => {
        throw new Error('Save failed');
      },
      undefined,
      (error) => errors.push(error.message),
    ),
    false,
  );
  assert.equal(form.status.submitError, 'Save failed');
  assert.deepEqual(errors, ['Save failed']);
  assert.equal(await form.submit(async () => {}), true);
  assert.equal(form.status.submitError, undefined);
  unregister();
});
void test('Form registrations preserve or discard dynamic fields and dependencies revalidate touched fields', async () => {
  const form = ui.useForm(
    z
      .object({ pass: z.string(), confirm: z.string(), note: z.string().optional() })
      .refine((value) => value.pass === value.confirm, { path: ['confirm'], message: 'Mismatch' }),
    { defaultValues: { pass: 'a', confirm: 'a', note: 'Draft' } },
  );
  const unregister = form.control.registerField('confirm', { dependencies: ['pass'] });
  form.control.touch('confirm');
  await form.setField('pass', 'b');
  await flush();
  assert.equal(form.formErrors.confirm, 'Mismatch');
  await form.setField('confirm', 'b', true);
  assert.equal(form.formErrors.confirm, undefined);
  unregister();
  const remove = form.control.registerField('note', { preserve: false });
  remove();
  assert.equal(form.formState.note, undefined);
});
void test('Controller rebinds a new control and name, resets touched state per field, and releases old subscriptions', async () => {
  const first = ui.useForm(z.object({ first: z.string(), second: z.string() }), {
    defaultValues: { first: 'Old', second: 'Second' },
  });
  const second = ui.useForm(z.object({ first: z.string(), second: z.string() }), {
    defaultValues: { first: 'New', second: 'Target' },
  });
  const props = rt.vm({ name: 'first', control: first.control });
  const view = mount(ui.ControllerField, props);
  props.control = second.control;
  props.name = 'second';
  await flush();
  assert.equal(document.querySelector('input').value, 'Target');
  assert.equal(first.focusField('first'), false);
  assert.equal(second.focusField('second'), true);
  await flush();
  assert.equal(document.activeElement, document.querySelector('input'));
  input('Edited');
  assert.equal(second.formState.second, 'Edited');
  assert.equal(first.formState.first, 'Old');
  await first.setField('first', 'Ignored');
  await flush();
  assert.equal(document.querySelector('input').value, 'Edited');
  view.dispose();
  await second.setField('second', 'After dispose');
  await flush();
  assert.equal(document.querySelector('input'), null);
});
void test('Form direct state changes update dirty metadata and values are cloned before schema transforms', async () => {
  const form = ui.useForm(
    z.object({
      nested: z.object({ text: z.string() }).transform((value) => {
        value.text = value.text.toUpperCase();
        return value;
      }),
    }),
    { defaultValues: { nested: { text: 'draft' } } },
  );
  const [errors, data] = await form.validate();
  assert.equal(errors, undefined);
  assert.equal(data.nested.text, 'DRAFT');
  assert.equal(form.formState.nested.text, 'draft');
  form.formState.nested.text = 'changed';
  await flush();
  assert.equal(form.status.dirty, true);
  form.reset();
  assert.equal(form.status.dirty, false);
});

void test('Form concurrent field validation tracks busy state independently and keeps the latest full validation', async () => {
  const resolvers = [];
  const form = ui.useForm(
    z.object({
      name: z.string().refine(() => new Promise((resolve) => resolvers.push(resolve)), 'Bad'),
    }),
    { defaultValues: { name: 'Ada' } },
  );
  const older = form.validateField('name');
  const latest = form.validate();
  resolvers[1](true);
  assert.deepEqual(await latest, [undefined, { name: 'Ada' }]);
  resolvers[0](false);
  await older;
  assert.equal(form.formErrors.name, undefined);
  assert.equal(form.status.validating, false);
});
void test('Form setFields, server errors and dispose invalidate pending work without reviving state', async () => {
  let resolve;
  const form = ui.useForm(
    z.object({
      name: z.string().refine(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
        'Old',
      ),
    }),
    { defaultValues: { name: 'Ada' } },
  );
  const pending = form.validateField('name');
  form.setError('name', 'Server');
  resolve(false);
  await pending;
  assert.equal(form.formErrors.name, 'Server');
  form.clearErrors();
  assert.equal(form.formErrors.name, undefined);
  await form.setFields({ name: 'Grace' });
  assert.equal(form.formState.name, 'Grace');
  const next = form.validate();
  form.dispose();
  resolve(false);
  await next;
  assert.equal(form.status.validating, false);
  assert.equal(form.formErrors.name, undefined);
});
void test('Form unregister does not drop a value while another binding remains and preserve=true keeps drafts', async () => {
  const form = ui.useForm(z.object({ name: z.string() }), { defaultValues: { name: 'Ada' } });
  const first = form.control.registerField('name', { preserve: false });
  const second = form.control.registerField('name');
  first();
  assert.equal(form.formState.name, 'Ada');
  second();
  assert.equal(form.formState.name, 'Ada');
});

void test('Form dispose releases field subscriptions even when a caller retains the store', async () => {
  const form = ui.useForm(z.object({ name: z.string() }), { defaultValues: { name: 'Ada' } });
  const values = [];
  const stop = form.control.watchField('name', (value) => values.push(value));
  form.dispose();
  form.formState.name = 'Ignored';
  await flush();
  stop();
  assert.deepEqual(values, ['Ada']);
});
