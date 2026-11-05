import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const button = (name) =>
  [...document.querySelectorAll('button')].find((el) => el.getAttribute('aria-label') === name);
void test('Pagination exposes named navigation, current page and correct boundaries without submitting forms', () => {
  mount(ui.Pagination, { total: 35, ariaLabel: 'Users' });
  assert.equal(document.querySelector('nav').getAttribute('aria-label'), 'Users');
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1');
  assert.equal(button('上一页').disabled, true);
  assert.equal(button('下一页').disabled, false);
  assert.equal(button('第 4 页').type, 'button');
});
void test('Pagination defaults, page changes and same-page suppression emit one typed request', async () => {
  const changes = [];
  mount(ui.Pagination, {
    total: 100,
    defaultCurrent: 2,
    defaultPageSize: 20,
    'on:change': (...v) => changes.push(v),
  });
  button('第 2 页').click();
  button('下一页').click();
  await flush();
  assert.deepEqual(changes, [[3, 20]]);
  assert.equal(document.querySelector('[aria-current=page]').textContent, '3');
});
void test('Pagination independently controls page and size, retaining rejected requests', async () => {
  const changes = [];
  const props = rt.vm({
    total: 90,
    current: 2,
    pageSize: 10,
    showSizeChanger: true,
    'on:change': (...v) => changes.push(v),
  });
  mount(ui.Pagination, props);
  button('下一页').click();
  await flush();
  assert.equal(document.querySelector('[aria-current=page]').textContent, '2');
  const select = document.querySelector('select');
  select.value = '20';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
  assert.equal(select.value, '10');
  assert.deepEqual(changes, [
    [3, 10],
    [1, 20],
  ]);
  props.current = 3;
  props.pageSize = 20;
  await flush();
  assert.equal(document.querySelector('[aria-current=page]').textContent, '3');
  assert.equal(select.value, '20');
});
void test('Pagination clamps dynamic totals and invalid numeric values without emitting structural changes', async () => {
  const changes = [];
  const props = rt.vm({ total: 150, defaultCurrent: 15, 'on:change': (...v) => changes.push(v) });
  mount(ui.Pagination, props);
  props.total = 12;
  await flush();
  assert.equal(document.querySelector('[aria-current=page]').textContent, '2');
  props.total = -1;
  await flush();
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1');
  assert.equal(button('下一页').disabled, true);
  assert.deepEqual(changes, []);
});
void test('Pagination bounds huge page ranges and offers useful ellipsis jump buttons', async () => {
  mount(ui.Pagination, { total: Number.MAX_SAFE_INTEGER, defaultCurrent: 1000, pageSize: 1 });
  assert.ok(document.querySelectorAll('button').length <= 11);
  button('向后跳 5 页').click();
  await flush();
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1005');
});
void test('Pagination size changes reset to page one and emit size-change then change', async () => {
  const changes = [];
  mount(ui.Pagination, {
    total: 95,
    defaultCurrent: 5,
    showSizeChanger: true,
    pageSizeOptions: [0, 20, 20, 50],
    'on:pageSizeChange': (s) => changes.push(['size', s]),
    'on:change': (...v) => changes.push(v),
  });
  const select = document.querySelector('select');
  assert.deepEqual(
    [...select.options].map((el) => el.value),
    ['10', '20', '50'],
  );
  select.value = '20';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
  assert.deepEqual(changes, [
    ['size', 20],
    [1, 20],
  ]);
  assert.equal(document.querySelector('[aria-current=page]').textContent, '1');
});
void test('Pagination quick jumper validates input, clamps range and prevents Enter form submission', async () => {
  const changes = [];
  mount(ui.Pagination, {
    total: 45,
    showQuickJumper: true,
    'on:change': (...v) => changes.push(v),
  });
  const input = document.querySelector('input');
  input.value = '1.5';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await flush();
  assert.deepEqual(changes, []);
  input.value = '99';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const event = new window.KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(event);
  await flush();
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(changes, [[5, 10]]);
});
void test('Pagination handles disabled, hide-on-single-page, simple mode and zero item ranges', async () => {
  const props = rt.vm({
    total: 0,
    disabled: true,
    simple: true,
    showTotal: true,
    hideOnSinglePage: false,
  });
  mount(ui.Pagination, props);
  assert.equal(
    [...document.querySelectorAll('button')].every((el) => el.disabled),
    true,
  );
  assert.match(document.body.textContent, /共 0 条/);
  props.hideOnSinglePage = true;
  await flush();
  assert.equal(document.querySelector('nav').hidden, true);
  props.hideOnSinglePage = false;
  await flush();
  assert.equal(document.querySelector('nav').hasAttribute('hidden'), false);
});

void test('Pagination form reset keeps the component page size and restores native select display', async () => {
  mount(ui.PaginationFormFixture);
  const form = document.querySelector('form');
  const select = document.querySelector('select');
  assert.equal(select.value, '20');
  form.reset();
  await flush();
  assert.equal(select.value, '20');
});
