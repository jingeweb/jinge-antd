import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const data = () => [
  {
    key: 'root',
    label: 'Root',
    children: [
      { key: 0, label: 'Zero' },
      { key: 'b', label: 'Beta' },
      { key: 'off', label: 'Off', disabled: true, children: [{ key: 'hidden', label: 'Hidden' }] },
    ],
  },
];
const item = (label) =>
  [...document.querySelectorAll('[role=treeitem]')].find(
    (el) => el.getAttribute('aria-label') === label,
  );
const click = (label) => item(label).click();
const key = async (label, k) => {
  item(label).dispatchEvent(
    new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
  );
  await flush();
};
void test('Tree expands known defaults, preserves numeric zero and roving keyboard focus', async () => {
  const view = mount(ui.Tree, { treeData: data(), defaultExpandedKeys: ['root'] });
  assert.equal(document.querySelectorAll('[role=treeitem]').length, 4);
  view.host.focus(0);
  assert.equal(document.activeElement, item('Zero'));
  await key('Zero', 'ArrowDown');
  assert.equal(document.activeElement, item('Beta'));
  await key('Beta', 'ArrowLeft');
  assert.equal(document.activeElement, item('Root'));
  await key('Root', 'ArrowLeft');
  assert.equal(document.querySelectorAll('[role=treeitem]').length, 1);
});
void test('Tree associated checking conducts enabled descendants and derives half checks without crossing disabled subtrees', async () => {
  const changes = [];
  mount(ui.Tree, {
    treeData: data(),
    defaultExpandAll: true,
    checkable: true,
    'on:check': (keys, info) => changes.push([keys, info]),
  });
  await key('Root', ' ');
  assert.deepEqual(changes.at(-1)[0], ['root', 0, 'b']);
  assert.equal(item('Off').getAttribute('aria-checked'), 'false');
  await key('Zero', ' ');
  assert.deepEqual(changes.at(-1)[0], ['b']);
  assert.deepEqual(changes.at(-1)[1].halfCheckedKeys, ['root']);
  assert.equal(item('Root').getAttribute('aria-checked'), 'mixed');
});
void test('Tree independent checking and checkbox barriers keep selection separate', async () => {
  const props = rt.vm({
    treeData: data(),
    defaultExpandAll: true,
    checkable: true,
    checkStrictly: true,
  });
  mount(ui.Tree, props);
  await key('Root', ' ');
  assert.equal(item('Zero').getAttribute('aria-checked'), 'false');
  click('Beta');
  await flush();
  assert.equal(item('Beta').getAttribute('aria-selected'), 'true');
  assert.equal(item('Beta').getAttribute('aria-checked'), 'false');
});
void test('Tree controlled expand, select and check requests can be rejected then accepted externally', async () => {
  const events = [];
  const props = rt.vm({
    treeData: data(),
    expandedKeys: [],
    selectedKeys: [],
    checkedKeys: [],
    checkable: true,
    'on:expand': (keys) => events.push(keys),
    'on:select': (keys) => events.push(keys),
    'on:check': (keys) => events.push(keys),
  });
  mount(ui.Tree, props);
  await key('Root', 'ArrowRight');
  assert.equal(item('Zero'), undefined);
  props.expandedKeys = ['root'];
  await flush();
  click('Zero');
  await flush();
  assert.equal(item('Zero').getAttribute('aria-selected'), 'false');
  await key('Zero', ' ');
  assert.equal(item('Zero').getAttribute('aria-checked'), 'false');
  assert.equal(events.length, 3);
  props.selectedKeys = [0];
  props.checkedKeys = [0];
  await flush();
  assert.equal(item('Zero').getAttribute('aria-selected'), 'true');
  assert.equal(item('Root').getAttribute('aria-checked'), 'mixed');
});
void test('Tree filter retains ancestors, opens matching paths and restores original expansion when cleared', async () => {
  const props = rt.vm({ treeData: data(), filter: 'beta' });
  mount(ui.Tree, props);
  assert.ok(item('Root'));
  assert.ok(item('Beta'));
  assert.equal(item('Zero'), undefined);
  props.filter = '';
  await flush();
  assert.equal(item('Beta'), undefined);
});
void test('Tree async loading deduplicates, shows failure, retries, and treats empty results as leaves', async () => {
  let calls = 0;
  const props = {
    treeData: [{ key: 'lazy', label: 'Lazy', isLeaf: false }],
    loadData: async () => {
      if (++calls === 1) throw new Error('Offline');
      return [];
    },
  };
  mount(ui.Tree, props);
  await key('Lazy', 'ArrowRight');
  assert.equal(item('Lazy').textContent.includes('Offline'), true);
  await key('Lazy', 'ArrowRight');
  assert.equal(calls, 2);
  assert.equal(item('Lazy').hasAttribute('aria-expanded'), false);
});
void test('Tree stale lazy results after replacement or unmount cannot attach to a new node', async () => {
  const calls = [];
  const props = rt.vm({
    treeData: [{ key: 'x', label: 'Old', isLeaf: false }],
    loadData: (node, { signal }) => new Promise((resolve) => calls.push({ resolve, signal })),
  });
  const view = mount(ui.Tree, props);
  await key('Old', 'ArrowRight');
  props.treeData = [{ key: 'x', label: 'New', isLeaf: false }];
  await flush();
  assert.equal(calls[0].signal.aborted, true);
  calls[0].resolve([{ key: 'bad', label: 'Stale' }]);
  await flush();
  assert.equal(item('Stale'), undefined);
  view.dispose();
  assert.equal(calls.at(-1).signal.aborted, true);
});
void test('Tree defaults are snapshots, reorder retains DOM and a collapsed focused child returns to its ancestor', async () => {
  const defaults = ['root'];
  const props = rt.vm({ treeData: data(), defaultExpandedKeys: defaults });
  const view = mount(ui.Tree, props);
  defaults.length = 0;
  const zero = item('Zero');
  props.treeData = [
    {
      key: 'root',
      label: 'Root',
      children: [
        { key: 'b', label: 'Beta' },
        { key: 0, label: 'Zero' },
      ],
    },
  ];
  await flush();
  assert.equal(item('Zero'), zero);
  view.host.focus(0);
  props.treeData = [{ key: 'root', label: 'Root' }];
  await flush();
  assert.equal(document.activeElement, item('Root'));
});
void test('Tree global disabled blocks all requests while multi selection toggles without modifier keys', async () => {
  const selected = [];
  const props = rt.vm({
    treeData: data(),
    defaultExpandAll: true,
    multiple: true,
    'on:select': (keys) => selected.push(keys),
  });
  mount(ui.Tree, props);
  click('Zero');
  click('Beta');
  await flush();
  assert.deepEqual(selected.at(-1), [0, 'b']);
  props.disabled = true;
  await flush();
  click('Root');
  await key('Root', ' ');
  assert.equal(selected.length, 2);
});
void test('Tree checkbox-disabled nodes break conduction but their enabled descendants remain independent', async () => {
  mount(ui.Tree, {
    treeData: [
      {
        key: 'p',
        label: 'Parent',
        children: [
          {
            key: 'barrier',
            label: 'Barrier',
            disableCheckbox: true,
            children: [{ key: 'child', label: 'Child' }],
          },
          { key: 'sibling', label: 'Sibling' },
        ],
      },
    ],
    defaultExpandAll: true,
    checkable: true,
  });
  await key('Parent', ' ');
  assert.equal(item('Barrier').getAttribute('aria-checked'), 'false');
  assert.equal(item('Child').getAttribute('aria-checked'), 'false');
  assert.equal(item('Sibling').getAttribute('aria-checked'), 'true');
  await key('Child', ' ');
  assert.equal(item('Child').getAttribute('aria-checked'), 'true');
});
void test('Tree a checked lazy parent conducts to new children without mutating caller nodes or firing a new check', async () => {
  const data = [{ key: 'p', label: 'Parent', isLeaf: false }],
    checks = [];
  mount(ui.Tree, {
    treeData: data,
    defaultCheckedKeys: ['p'],
    checkable: true,
    loadData: async () => [{ key: 'child', label: 'Child' }],
    'on:check': (value) => checks.push(value),
  });
  await key('Parent', 'ArrowRight');
  assert.equal(item('Child').getAttribute('aria-checked'), 'true');
  assert.equal(data[0].children, undefined);
  assert.equal(checks.length, 0);
});
void test('Tree rejects cyclic and duplicate data while string and numeric keys stay distinct', () => {
  const cyclic = { key: 'a', label: 'A' };
  cyclic.children = [cyclic];
  assert.throws(() => mount(ui.Tree, { treeData: [cyclic] }), /cycles/);
  assert.throws(
    () =>
      mount(ui.Tree, {
        treeData: [
          { key: 'a', label: 'A' },
          { key: 'a', label: 'Again' },
        ],
      }),
    /unique/,
  );
  mount(ui.Tree, {
    treeData: [
      { key: 0, label: 'Number' },
      { key: '0', label: 'String' },
    ],
  });
  assert.equal(document.querySelectorAll('[role=treeitem]').length, 2);
});
void test('Tree external children supersede pending loading and clear its busy state', async () => {
  let signal;
  const props = rt.vm({
    treeData: [{ key: 'p', label: 'Parent', isLeaf: false }],
    loadData: (_node, options) => {
      signal = options.signal;
      return new Promise(() => {});
    },
  });
  mount(ui.Tree, props);
  await key('Parent', 'ArrowRight');
  props.treeData[0].children = [{ key: 'ready', label: 'Ready' }];
  await flush();
  assert.equal(signal.aborted, true);
  assert.equal(item('Parent').hasAttribute('aria-busy'), false);
  assert.ok(item('Ready'));
});
void test('Tree a queued focus restoration cannot steal focus from a subsequently clicked external control', async () => {
  mount(ui.Tree, { treeData: data(), defaultExpandAll: true });
  const button = document.createElement('button');
  document.body.append(button);
  item('Zero').click();
  button.focus();
  await flush();
  assert.equal(document.activeElement, button);
});
void test('Tree loader rejection with an empty message remains a retryable error instead of automatically looping', async () => {
  let calls = 0;
  mount(ui.Tree, {
    treeData: [{ key: 'p', label: 'Parent', isLeaf: false }],
    loadData: async () => {
      calls++;
      throw new Error('');
    },
  });
  await key('Parent', 'ArrowRight');
  assert.equal(calls, 1);
  assert.equal(document.querySelector('[role=alert]').textContent.includes('加载失败'), true);
});
void test('Tree invalid lazy child keys produce a visible retryable error without poisoning the data cache', async () => {
  let calls = 0;
  const errors = [];
  mount(ui.Tree, {
    treeData: [{ key: 'p', label: 'Parent', isLeaf: false }],
    loadData: async () =>
      ++calls === 1
        ? [
            { key: 'dup', label: 'First' },
            { key: 'dup', label: 'Second' },
          ]
        : [{ key: 'valid', label: 'Valid' }],
    'on:loadError': (error) => errors.push(error),
  });
  await key('Parent', 'ArrowRight');
  assert.equal(document.querySelector('[role=alert]').textContent.includes('unique'), true);
  assert.equal(errors.length, 1);
  await key('Parent', 'ArrowRight');
  assert.ok(item('Valid'));
  assert.equal(calls, 2);
});
void test('Tree matching a lazy label while filtering does not load until explicit user expansion', async () => {
  let calls = 0;
  mount(ui.Tree, {
    treeData: [{ key: 'lazy', label: 'Lazy', isLeaf: false }],
    filter: 'Lazy',
    loadData: async () => {
      calls++;
      return [];
    },
  });
  await flush();
  assert.equal(calls, 0);
  await key('Lazy', 'ArrowRight');
  assert.equal(calls, 1);
});
