import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const data = () => [
  { id: 1, name: 'Ada', age: 30, team: 'A' },
  { id: 2, name: 'Grace', age: 20, team: 'B' },
  { id: 3, name: 'Linus', age: 40, team: 'A' },
];
const columns = () => [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'age', title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
  {
    key: 'team',
    title: 'Team',
    dataIndex: 'team',
    filters: [
      { text: 'Team A', value: 'A' },
      { text: 'Team B', value: 'B' },
    ],
    onFilter: (v, row) => row.team === v,
  },
];
const rows = () => [...document.querySelectorAll('tbody tr.ja-table-row')];
const names = () => rows().map((el) => el.querySelector('[data-column-key=name]').textContent);
const checkbox = (name) =>
  [...document.querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
const sort = () => document.querySelector('button.ja-table-sort');
void test('Table exposes native named table, header scopes, text values, caption and empty content', () => {
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: [],
    caption: 'Users',
    ariaLabel: 'Accounts',
  });
  assert.equal(document.querySelector('table').getAttribute('aria-label'), 'Accounts');
  assert.equal(document.querySelector('caption').textContent, 'Users');
  assert.equal(document.querySelector('th').scope, 'col');
  assert.match(document.querySelector('tbody').textContent, /暂无数据/);
  assert.equal(document.querySelector('tbody td').colSpan, 3);
});
void test('Table sorts stably without mutating source, cycles orders, and reports query requests', async () => {
  const changes = [],
    source = data();
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: source,
    'on:change': (v) => changes.push(v),
  });
  sort().click();
  await flush();
  assert.deepEqual(names(), ['Grace', 'Ada', 'Linus']);
  assert.equal(document.querySelector('[aria-sort]').getAttribute('aria-sort'), 'ascending');
  sort().click();
  await flush();
  assert.deepEqual(names(), ['Linus', 'Ada', 'Grace']);
  sort().click();
  await flush();
  assert.deepEqual(names(), ['Ada', 'Grace', 'Linus']);
  assert.deepEqual(
    source.map((r) => r.id),
    [1, 2, 3],
  );
  assert.equal(changes[0].action, 'sort');
  assert.equal(changes[0].sorter.order, 'ascend');
});
void test('Table controlled sorting emits a request and keeps order until accepted', async () => {
  const changes = [],
    cols = columns();
  cols[1].sortOrder = null;
  const props = rt.vm({
    rowKey: 'id',
    columns: cols,
    data: data(),
    'on:change': (v) => changes.push(v),
  });
  mount(ui.Table, props);
  sort().click();
  await flush();
  assert.deepEqual(names(), ['Ada', 'Grace', 'Linus']);
  assert.equal(changes[0].sorter.order, 'ascend');
  props.columns[1].sortOrder = 'ascend';
  await flush();
  assert.deepEqual(names(), ['Grace', 'Ada', 'Linus']);
});
void test('Table local filters reset page, respect controlled rejection and preserve valid keys', async () => {
  const changes = [];
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    pagination: { defaultCurrent: 2, defaultPageSize: 1 },
    'on:change': (v) => changes.push(v),
  });
  mount(ui.Table, props);
  const filter = document.querySelector('select.ja-table-filter');
  filter.value = '0';
  filter.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
  assert.deepEqual(names(), ['Ada']);
  assert.equal(changes[0].action, 'filter');
  assert.deepEqual(changes[0].filters, { team: ['A'] });
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1');
});
void test('Table applies controlled multi-value filters and exposes actual current data before paging', () => {
  const cols = columns();
  cols[2].filteredValue = ['A', 'B'];
  cols[2].filterMultiple = true;
  mount(ui.Table, { rowKey: 'id', columns: cols, data: data() });
  assert.equal(document.querySelector('select').multiple, true);
  assert.equal(rows().length, 3);
});
void test('Table pagination slices local data and clamps when records disappear', async () => {
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    pagination: { defaultCurrent: 2, defaultPageSize: 2 },
  });
  mount(ui.Table, props);
  assert.deepEqual(names(), ['Linus']);
  props.data = props.data.slice(0, 1);
  await flush();
  assert.deepEqual(names(), ['Ada']);
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1');
});
void test('Table remote mode leaves loaded rows untouched and emits requested server parameters', async () => {
  const changes = [];
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: data(),
    remote: true,
    pagination: { current: 4, pageSize: 2, total: 100 },
    'on:change': (v) => changes.push(v),
  });
  assert.equal(rows().length, 3);
  sort().click();
  await flush();
  assert.deepEqual(names(), ['Ada', 'Grace', 'Linus']);
  assert.equal(changes[0].pagination.current, 1);
  assert.equal(changes[0].pagination.total, 100);
});
void test('Table page selection skips disabled rows, exposes mixed state and preserves other pages', async () => {
  const changes = [];
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: data(),
    pagination: { defaultPageSize: 2 },
    rowSelection: {
      getDisabled: (row) => row.id === 2,
      'on:change': (keys, records) => changes.push([keys, records.map((row) => row.id)]),
    },
  });
  checkbox('选择行 1').click();
  await flush();
  assert.equal(checkbox('全选当前页').checked, true);
  assert.equal(checkbox('选择行 2').disabled, true);
  document.querySelector('[aria-label=下一页]').click();
  await flush();
  checkbox('全选当前页').click();
  await flush();
  assert.deepEqual(changes, [
    [[1], [1]],
    [
      [1, 3],
      [1, 3],
    ],
  ]);
});
void test('Table header selection has a native indeterminate state and toggles only visible eligible rows', async () => {
  mount(ui.Table, { rowKey: 'id', columns: columns(), data: data(), rowSelection: {} });
  checkbox('选择行 1').click();
  await flush();
  assert.equal(checkbox('全选当前页').getAttribute('aria-checked'), 'mixed');
  assert.equal(checkbox('全选当前页').indeterminate, true);
  checkbox('全选当前页').click();
  await flush();
  assert.equal(document.querySelectorAll('tbody input:checked').length, 3);
  checkbox('全选当前页').click();
  await flush();
  assert.equal(document.querySelectorAll('tbody input:checked').length, 0);
});
void test('Table controlled selection may reject or accept requests and returns fresh arrays', async () => {
  const changes = [];
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    rowSelection: { selectedRowKeys: [], 'on:change': (keys) => changes.push(keys) },
  });
  mount(ui.Table, props);
  checkbox('选择行 1').click();
  await flush();
  assert.equal(checkbox('选择行 1').checked, false);
  assert.deepEqual(changes, [[1]]);
  props.rowSelection.selectedRowKeys = [1];
  await flush();
  assert.equal(checkbox('选择行 1').checked, true);
  changes[0].push(3);
  assert.equal(checkbox('选择行 3').checked, false);
});
void test('Table radio selection is exclusive and excludes a page-select checkbox', async () => {
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: data(),
    rowSelection: { type: 'radio' },
  });
  checkbox('选择行 1').click();
  checkbox('选择行 3').click();
  await flush();
  assert.equal(document.querySelectorAll('input:checked').length, 1);
  assert.equal(checkbox('选择行 3').checked, true);
  assert.equal(checkbox('全选当前页'), undefined);
});
void test('Table removed selection keys are pruned unless preservation is explicitly enabled', async () => {
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    rowSelection: { defaultSelectedRowKeys: [1], preserveSelectedRowKeys: true },
  });
  mount(ui.Table, props);
  props.data = props.data.slice(1);
  await flush();
  props.data = data();
  await flush();
  assert.equal(checkbox('选择行 1').checked, true);
  props.rowSelection.preserveSelectedRowKeys = false;
  props.data = props.data.slice(1);
  await flush();
  props.data = data();
  await flush();
  assert.equal(checkbox('选择行 1').checked, false);
});
void test('Table expansion uses a linked detail row, respects disabled expansion and destroys hidden detail', async () => {
  const changes = [];
  mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: data(),
    'slot:expandedRowRender': ui.TableExpandedSlot,
    rowExpandable: (row) => row.id !== 2,
    'on:expand': (open, row) => changes.push([open, row.id]),
  });
  const trigger = document.querySelector('[aria-label="展开行 1"]');
  trigger.click();
  await flush();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(
    document.getElementById(trigger.getAttribute('aria-controls')).textContent,
    'Details:Ada',
  );
  assert.equal(document.querySelector('[aria-label="展开行 2"]'), null);
  trigger.click();
  await flush();
  assert.equal(document.querySelector('.ja-table-expanded'), null);
  assert.deepEqual(changes, [
    [true, 1],
    [false, 1],
  ]);
});
void test('Table loading blocks mutations while retaining existing data, custom empty slots and zero values render', async () => {
  const changes = [];
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    loading: true,
    rowSelection: {},
    'on:change': (v) => changes.push(v),
  });
  mount(ui.Table, props);
  assert.equal(document.querySelector('[aria-busy=true]') !== null, true);
  sort().click();
  assert.equal(checkbox('选择行 1').disabled, true);
  assert.deepEqual(changes, []);
  props.loading = false;
  props.data = [];
  await flush();
  assert.match(document.body.textContent, /暂无数据/);
});
void test('Table supports rowKey functions and rejects missing or duplicate identities clearly', () => {
  const view = mount(ui.Table, {
    rowKey: (row) => `user-${row.id}`,
    columns: columns(),
    data: data(),
  });
  assert.equal(rows().length, 3);
  view.dispose();
  assert.throws(
    () => mount(ui.Table, { rowKey: 'id', columns: columns(), data: [{ id: 1 }, { id: 1 }] }),
    /rowKey/,
  );
});
void test('Table fixed columns use explicit offsets and count utility columns in the sticky layout', () => {
  const cols = columns();
  cols[0].fixed = 'left';
  cols[0].width = 120;
  cols[2].fixed = 'right';
  cols[2].width = 100;
  mount(ui.Table, {
    rowKey: 'id',
    columns: cols,
    data: data(),
    rowSelection: {},
    scroll: { x: 800, y: 240 },
  });
  assert.equal(document.querySelector('tbody [data-column-key=name]').style.left, '48px');
  assert.equal(document.querySelector('tbody [data-column-key=team]').style.right, '0px');
  assert.equal(document.querySelector('.ja-table-scroll').style.maxHeight, '240px');
});

void test('Table observes a stable selection VM passed through static parent props', async () => {
  const view = mount(ui.TableStableSelectionFixture);
  view.host.choose();
  await flush();
  assert.equal(checkbox('选择行 1').checked, true);
});
void test('Table controlled filters restore rejected native selection and accept an external multi-filter update', async () => {
  const changes = [],
    cols = columns();
  cols[2].filteredValue = [];
  const props = rt.vm({
    rowKey: 'id',
    columns: cols,
    data: data(),
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Table, props);
  const select = document.querySelector('select');
  select.value = '0';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
  assert.equal(select.value, '');
  assert.deepEqual(names(), ['Ada', 'Grace', 'Linus']);
  assert.deepEqual(changes[0].filters, { team: ['A'] });
  props.columns[2].filterMultiple = true;
  props.columns[2].filteredValue = ['A', 'B'];
  await flush();
  assert.equal(select.selectedOptions.length, 2);
});
void test('Table custom empty slots and native zero/boolean text values render without raw objects', () => {
  const view = mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: [],
    'slot:empty': ui.ContentSlot,
  });
  assert.equal(document.querySelector('.ja-table-empty').textContent, 'custom content');
  view.dispose();
  mount(ui.Table, {
    rowKey: 'id',
    data: [{ id: 1, age: 0, active: false }],
    columns: [
      { key: 'age', dataIndex: 'age' },
      { key: 'active', dataIndex: 'active' },
    ],
  });
  assert.equal(document.querySelector('tbody').textContent, '0false');
});

void test('Table controlled expansion rejects requests, accepts parent writes and updates scoped row content', async () => {
  const requests = [];
  const props = rt.vm({
    rowKey: 'id',
    columns: columns(),
    data: data(),
    expandedRowKeys: [],
    'slot:expandedRowRender': ui.TableExpandedSlot,
    'on:expandedRowsChange': (keys) => requests.push(keys),
  });
  mount(ui.Table, props);
  document.querySelector('[aria-label="展开行 1"]').click();
  await flush();
  assert.equal(document.querySelector('.ja-table-expanded'), null);
  assert.deepEqual(requests, [[1]]);
  props.expandedRowKeys = [1];
  props.data[0].name = 'Updated';
  await flush();
  assert.equal(document.querySelector('.ja-table-expanded').textContent, 'Details:Updated');
  assert.equal(rows()[0].querySelector('[data-column-key=name]').textContent, 'Updated');
});
void test('Table equal sort keys keep source order and absent row keys fail explicitly', async () => {
  const view = mount(ui.Table, {
    rowKey: 'id',
    columns: columns(),
    data: [
      { id: 1, name: 'A', age: 20 },
      { id: 2, name: 'B', age: 20 },
      { id: 3, name: 'C', age: 10 },
    ],
  });
  sort().click();
  await flush();
  assert.deepEqual(names(), ['C', 'A', 'B']);
  view.dispose();
  assert.throws(
    () => mount(ui.Table, { rowKey: 'missing', data: [{ id: 1 }], columns: [] }),
    /rowKey/,
  );
});
void test('Table disconnects layout observers and ignores measurements queued after disposal', async () => {
  const original = globalThis.ResizeObserver,
    observers = [];
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = 0;
      this.observed = [];
      observers.push(this);
    }
    observe(el, options) {
      this.observed.push([el, options]);
    }
    disconnect() {
      this.disconnected++;
    }
  };
  try {
    const view = mount(ui.Table, { rowKey: 'id', columns: columns(), data: data() });
    assert.equal(observers[0].observed.filter((entry) => entry[1]?.box === 'border-box').length, 3);
    view.dispose();
    const count = observers[0].disconnected;
    observers[0].callback();
    await flush();
    assert.equal(observers[0].disconnected, count);
    assert.ok(count >= 2);
  } finally {
    globalThis.ResizeObserver = original;
  }
});
