import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Blocked', disabled: true },
  { value: 'c', label: 'Charlie', danger: true },
];
const key = (target, value) =>
  target.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
  );
const slots = () => ({ 'slot:default': ui.TriggerSlot });
void test('Dropdown ArrowUp opens a menu, focuses last enabled item and Escape restores trigger', async () => {
  mount(ui.Dropdown, { options, ...slots() });
  const trigger = document.querySelector('button');
  trigger.focus();
  key(trigger, 'ArrowUp');
  await flush();
  assert.equal(document.querySelector('[role=menu]').getAttribute('aria-label'), '操作菜单');
  assert.equal(document.activeElement.textContent.trim(), 'Charlie');
  key(document.activeElement, 'Escape');
  await flush();
  assert.equal(document.querySelector('[role=menu]'), null);
  assert.equal(document.activeElement, trigger);
});
void test('Dropdown disabled prevents trigger actions and closes existing menus, restoring its aria on unmount', async () => {
  const props = rt.vm({ options, disabled: false, ...slots() });
  const view = mount(ui.Dropdown, props);
  const trigger = document.querySelector('button');
  trigger.click();
  await flush();
  props.disabled = true;
  await flush();
  assert.equal(document.querySelector('[role=menu]'), null);
  assert.equal(trigger.getAttribute('aria-disabled'), 'true');
  trigger.click();
  await flush();
  assert.equal(document.querySelector('[role=menu]'), null);
  view.dispose();
  assert.notEqual(trigger.getAttribute('aria-disabled'), 'true');
});
void test('Dropdown controlled open requests wait for acceptance and closeOnSelect=false retains operation menu', async () => {
  const opens = [],
    changes = [];
  const props = rt.vm({
    options,
    open: false,
    closeOnSelect: false,
    'on:openChange': (value) => opens.push(value),
    'on:change': (value) => changes.push(value),
    ...slots(),
  });
  mount(ui.Dropdown, props);
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('[role=menu]'), null);
  props.open = true;
  await flush();
  document.querySelector('.ja-menu-item').click();
  await flush();
  assert.deepEqual(changes, ['a']);
  assert.ok(document.querySelector('[role=menu]'));
  assert.deepEqual(opens, [true]);
});
void test('Dropdown selectable defaults persist across popup lifetimes and custom content/empty/loading statuses render', async () => {
  const props = rt.vm({ options, defaultValue: 'c', selectable: true, loading: true, ...slots() });
  mount(ui.Dropdown, props);
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('[role=status]').textContent, '加载中…');
  props.loading = false;
  await flush();
  assert.equal(document.querySelector('.ja-active').textContent.trim(), 'Charlie');
  document.querySelector('.ja-menu-item').click();
  await flush();
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('.ja-active').textContent.trim(), 'Alpha');
  props.options = [];
  await flush();
  assert.equal(document.querySelector('.ja-menu-empty').textContent, '暂无操作');
});
void test('Dropdown forwards supplied content slot and leaves its interactive content lifecycle owned by Floating', async () => {
  mount(ui.Dropdown, { options: [], 'slot:content': ui.ContentSlot, ...slots() });
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('[data-testid=content-slot]').textContent, 'custom content');
});
