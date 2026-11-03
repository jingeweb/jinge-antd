import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const data = () => [
  {
    value: 'a',
    label: 'Alpha',
    children: [
      { value: 0, label: 'Zero' },
      { value: 'off', label: 'Off', disabled: true },
    ],
  },
  { value: 'b', label: 'Beta', children: [{ value: 0, label: 'Other Zero' }] },
];
const trigger = () => document.querySelector('[role=combobox]');
const option = (label) =>
  [...document.querySelectorAll('[role=option]')].find(
    (el) => el.getAttribute('aria-label') === label,
  );
const open = async () => {
  trigger().click();
  await flush();
};
const key = async (k) => {
  trigger().dispatchEvent(
    new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
  );
  await flush();
};
void test('Cascader commits a complete path with numeric values and distinguishes repeated values under different parents', async () => {
  const changes = [];
  mount(ui.Cascader, {
    options: data(),
    name: 'path',
    'on:change': (path, nodes) => changes.push([path, nodes]),
  });
  await open();
  option('Alpha').click();
  await flush();
  assert.equal(changes.length, 0);
  option('Alpha / Zero').click();
  await flush();
  assert.deepEqual(changes[0][0], ['a', 0]);
  assert.equal(changes[0][1][1].label, 'Zero');
  assert.equal(document.querySelector('input[type=hidden]').value, '["a",0]');
  assert.equal(trigger().textContent.includes('Alpha / Zero'), true);
});
void test('Cascader clear emits null and controlled owners can reject selection and clearing', async () => {
  const changes = [],
    props = rt.vm({
      options: data(),
      value: ['a', 0],
      allowClear: true,
      'on:change': (value) => changes.push(value),
    });
  mount(ui.Cascader, props);
  await open();
  option('Beta').click();
  await flush();
  option('Beta / Other Zero').click();
  await flush();
  assert.deepEqual(changes[0], ['b', 0]);
  assert.equal(trigger().textContent.includes('Alpha / Zero'), true);
  document.querySelector('[aria-label="清空级联选择"]').click();
  await flush();
  assert.equal(changes[1], null);
  assert.equal(trigger().textContent.includes('Alpha / Zero'), true);
  props.value = null;
  await flush();
  assert.equal(document.querySelector('input[type=hidden]').value, '');
});
void test('Cascader changeOnSelect permits intermediate paths and retains the open panel for further navigation', async () => {
  const changes = [];
  mount(ui.Cascader, {
    options: data(),
    changeOnSelect: true,
    'on:change': (value) => changes.push(value),
  });
  await open();
  option('Alpha').click();
  await flush();
  assert.deepEqual(changes[0], ['a']);
  assert.equal(trigger().getAttribute('aria-expanded'), 'true');
  option('Alpha / Zero').click();
  await flush();
  assert.equal(trigger().getAttribute('aria-expanded'), 'false');
});
void test('Cascader search matches complete loaded paths and never starts background lazy requests', async () => {
  let calls = 0;
  mount(ui.Cascader, {
    options: [...data(), { value: 'lazy', label: 'Lazy', isLeaf: false }],
    showSearch: true,
    loadData: async () => {
      calls++;
      return [];
    },
  });
  await open();
  trigger().value = 'Alpha Zero';
  trigger().dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.ok(option('Alpha / Zero'));
  assert.equal(option('Beta / Other Zero'), undefined);
  assert.equal(calls, 0);
  await key('Enter');
  assert.equal(document.querySelector('input[type=hidden]').value, '["a",0]');
});
void test('Cascader keyboard moves columns, skips disabled options, cancels drafts and never selects on mere navigation', async () => {
  const changes = [];
  mount(ui.Cascader, { options: data(), 'on:change': (value) => changes.push(value) });
  await key('ArrowDown');
  await key('ArrowRight');
  assert.equal(trigger().getAttribute('aria-activedescendant'), option('Alpha / Zero').id);
  await key('ArrowDown');
  assert.equal(trigger().getAttribute('aria-activedescendant'), option('Alpha / Zero').id);
  assert.equal(changes.length, 0);
  await key('Escape');
  assert.equal(document.querySelector('[role=listbox]'), null);
});
void test('Cascader controlled open rejection, disabled and readonly prevent navigation and updates', async () => {
  const props = rt.vm({ options: data(), open: false });
  mount(ui.Cascader, props);
  await open();
  assert.equal(document.querySelector('[role=listbox]'), null);
  props.open = true;
  await flush();
  assert.ok(document.querySelector('[role=listbox]'));
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('[role=listbox]'), null);
  props.disabled = false;
  props.readOnly = true;
  await flush();
  await open();
  assert.equal(document.querySelector('[role=listbox]'), null);
});
void test('Cascader loads children once, retries errors and ignores stale results after data replacement', async () => {
  const calls = [];
  const props = rt.vm({
    options: [{ value: 'x', label: 'Old', isLeaf: false }],
    loadData: (node, { signal }) =>
      new Promise((resolve, reject) => calls.push({ resolve, reject, signal })),
  });
  const view = mount(ui.Cascader, props);
  await open();
  option('Old').click();
  await flush();
  await key('ArrowRight');
  assert.equal(calls.length, 1);
  calls[0].reject(new Error('Offline'));
  await flush();
  assert.ok(document.querySelector('[role=alert]'));
  document.querySelector('[aria-label="重试加载 Old"]').click();
  await flush();
  assert.equal(calls.length, 2);
  props.options = [{ value: 'x', label: 'New', isLeaf: false }];
  await flush();
  assert.equal(calls[1].signal.aborted, true);
  calls[1].resolve([{ value: 'bad', label: 'Stale' }]);
  await flush();
  assert.equal(option('New / Stale'), undefined);
  view.dispose();
});
void test('Cascader resolves external path labels after options arrive and preserves unknown canonical values', async () => {
  const props = rt.vm({ options: [], value: ['a', 0] });
  mount(ui.Cascader, props);
  assert.equal(document.querySelector('input[type=hidden]').value, '["a",0]');
  props.options = data();
  await flush();
  assert.equal(trigger().textContent.includes('Alpha / Zero'), true);
});
void test('Cascader native form reset restores initial snapshot without change and canceled resets preserve selection', async () => {
  const form = document.createElement('form');
  form.id = 'owner';
  document.body.append(form);
  const changes = [];
  mount(ui.Cascader, {
    options: data(),
    defaultValue: ['a', 0],
    form: 'owner',
    allowClear: true,
    'on:change': (value) => changes.push(value),
  });
  document.querySelector('[aria-label="清空级联选择"]').click();
  await flush();
  form.reset();
  await flush();
  assert.equal(document.querySelector('input[type=hidden]').value, '["a",0]');
  assert.equal(changes.length, 1);
  form.addEventListener('reset', (event) => event.preventDefault());
  document.querySelector('[aria-label="清空级联选择"]').click();
  await flush();
  form.reset();
  await flush();
  assert.equal(document.querySelector('input[type=hidden]').value, '');
});
void test('Cascader lazy results completing after unmount cannot emit changes or retain active signals', async () => {
  let finish, signal;
  const changes = [];
  const view = mount(ui.Cascader, {
    options: [{ value: 'x', label: 'Lazy', isLeaf: false }],
    loadData: (_node, options) => {
      signal = options.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    'on:change': (value) => changes.push(value),
  });
  await open();
  option('Lazy').click();
  await flush();
  view.dispose();
  assert.equal(signal.aborted, true);
  finish([{ value: 'leaf', label: 'Leaf' }]);
  await flush();
  assert.equal(changes.length, 0);
});
void test('Cascader captures an uncontrolled default snapshot and restores it after native reset', async () => {
  const initial = ['a', 0],
    form = document.createElement('form');
  form.id = 'snapshot';
  document.body.append(form);
  mount(ui.Cascader, {
    options: data(),
    defaultValue: initial,
    form: 'snapshot',
    allowClear: true,
  });
  initial.length = 0;
  document.querySelector('[aria-label="清空级联选择"]').click();
  await flush();
  form.reset();
  await flush();
  assert.equal(document.querySelector('input[type=hidden]').value, '["a",0]');
});
void test('Cascader IME ignores Enter during composition and reports the committed search once', async () => {
  const searches = [],
    changes = [];
  mount(ui.Cascader, {
    options: data(),
    showSearch: true,
    'on:search': (query) => searches.push(query),
    'on:change': (value) => changes.push(value),
  });
  await open();
  trigger().dispatchEvent(new window.CompositionEvent('compositionstart', { bubbles: true }));
  trigger().value = 'Zero';
  trigger().dispatchEvent(new Event('input', { bubbles: true }));
  await key('Enter');
  assert.equal(changes.length, 0);
  trigger().dispatchEvent(new window.CompositionEvent('compositionend', { bubbles: true }));
  trigger().dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
  assert.deepEqual(searches, ['Zero']);
});
void test('Cascader opens an unresolved controlled path by loading its known lazy ancestor', async () => {
  let calls = 0;
  mount(ui.Cascader, {
    options: [{ value: 'p', label: 'Parent', isLeaf: false }],
    value: ['p', 'child'],
    loadData: async () => {
      calls++;
      return [{ value: 'child', label: 'Child' }];
    },
  });
  await open();
  assert.equal(calls, 1);
  assert.ok(option('Parent / Child'));
  assert.equal(trigger().textContent.includes('Parent / Child'), true);
});
