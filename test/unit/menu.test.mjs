import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const key = (element, value) =>
  element.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
  );
const items = () => [
  { value: 'home', label: 'Home' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  {
    value: 'tools',
    label: 'Tools',
    children: [
      { value: 'users', label: 'Users' },
      { value: 'roles', label: 'Roles' },
    ],
  },
];
void test('Menu uses menu semantics, stable roving focus and skips disabled items', async () => {
  const view = mount(ui.Menu, { options: items(), ariaLabel: 'Navigation' });
  assert.equal(document.querySelector('[role=menu]').getAttribute('aria-label'), 'Navigation');
  view.host.focus();
  await flush();
  const home = document.querySelector('[role=menuitem]');
  assert.equal(document.activeElement, home);
  key(home, 'ArrowDown');
  await flush();
  assert.equal(document.activeElement.textContent.trim(), 'Tools');
  assert.equal(document.querySelectorAll('[role=menuitem][tabindex="0"]').length, 1);
});
void test('Menu inline submenus open/close with arrows and Escape returns focus to their parent', async () => {
  const opens = [];
  mount(ui.Menu, { options: items(), 'on:openChange': (value) => opens.push(value) });
  const tools = [...document.querySelectorAll('[role=menuitem]')].find(
    (el) => el.textContent.trim() === 'Tools',
  );
  tools.focus();
  key(tools, 'ArrowRight');
  await flush();
  assert.equal(tools.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement.textContent.trim(), 'Users');
  key(document.activeElement, 'Escape');
  await flush();
  assert.equal(tools.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, tools);
  assert.deepEqual(opens, [['tools'], []]);
});
void test('Menu controlled selection and open keys wait for acceptance while defaults remain local', async () => {
  const changes = [];
  const props = rt.vm({
    options: items(),
    value: 'home',
    openKeys: [],
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Menu, props);
  document.querySelector('[role=menuitem]').click();
  const tools = [...document.querySelectorAll('[role=menuitem]')].find(
    (el) => el.textContent.trim() === 'Tools',
  );
  tools.click();
  await flush();
  assert.equal(tools.getAttribute('aria-expanded'), 'false');
  props.openKeys = ['tools'];
  await flush();
  const users = [...document.querySelectorAll('[role=menuitem]')].find(
    (el) => el.textContent.trim() === 'Users',
  );
  users.click();
  await flush();
  assert.equal(document.querySelector('.ja-active').textContent.trim(), 'Home');
  assert.deepEqual(changes, ['home', 'users']);
  props.value = 'users';
  await flush();
  assert.equal(users.getAttribute('aria-current'), 'page');
});
void test('Menu renders groups/dividers and safe native links, and default selection', async () => {
  mount(ui.Menu, {
    defaultValue: 0,
    options: [
      {
        value: 'group',
        type: 'group',
        label: 'Workspace',
        children: [
          { value: 0, label: 'Docs', href: '#docs' },
          {
            value: 1,
            label: 'External',
            href: 'https://example.com',
            target: '_blank',
            rel: 'nofollow',
          },
        ],
      },
      { value: 'divider', type: 'divider' },
      { value: 'bad', label: 'Unsafe', href: 'javascript:alert(1)' },
    ],
  });
  assert.equal(document.querySelector('[role=group]').getAttribute('aria-label'), 'Workspace');
  assert.ok(document.querySelector('[role=separator]'));
  const links = document.querySelectorAll('a');
  assert.equal(links[0].getAttribute('aria-current'), 'page');
  assert.match(links[1].rel, /noopener/);
  assert.match(links[1].rel, /nofollow/);
  assert.equal(links[2].getAttribute('href'), null);
});
void test('Menu keeps keyed nodes on reorder, reconciles removed/disabled active items and supports empty options', async () => {
  const props = rt.vm({ options: items() });
  const view = mount(ui.Menu, props);
  view.host.focus();
  await flush();
  const home = document.querySelector('[role=menuitem]');
  props.options.reverse();
  await flush();
  assert.equal([...document.querySelectorAll('[role=menuitem]')].at(-1), home);
  props.options = [];
  await flush();
  assert.equal(document.querySelectorAll('[role=menuitem]').length, 0);
  assert.doesNotThrow(() => view.host.focus());
});
void test('Menu horizontal children use a portal and left/right navigation closes one submenu level', async () => {
  mount(ui.Menu, { mode: 'horizontal', options: items() });
  const home = document.querySelector('[role=menuitem]');
  assert.ok(document.querySelector('[role=menubar]'));
  home.focus();
  key(home, 'ArrowRight');
  await flush();
  const tools = document.activeElement;
  key(tools, 'ArrowDown');
  await flush();
  const popup = document.querySelector('.ja-menu-popup');
  assert.ok(popup);
  assert.equal(document.activeElement.textContent.trim(), 'Users');
  key(document.activeElement, 'ArrowLeft');
  await flush();
  assert.equal(document.querySelector('.ja-menu-popup'), null);
  assert.equal(document.activeElement, tools);
});
void test('Menu typeahead and Home/End follow visible enabled items, and disabled ancestors block descendants', async () => {
  const props = rt.vm({ options: items(), defaultOpenKeys: ['tools'] });
  const view = mount(ui.Menu, props);
  view.host.focus();
  await flush();
  key(document.activeElement, 'r');
  await flush();
  assert.equal(document.activeElement.textContent.trim(), 'Roles');
  key(document.activeElement, 'Home');
  await flush();
  assert.equal(document.activeElement.textContent.trim(), 'Home');
  props.disabled = true;
  await flush();
  assert.equal(
    [...document.querySelectorAll('button')].every((el) => el.disabled),
    true,
  );
});

void test('Menu accordion closes sibling descendants and disabled parents block their entire subtree', async () => {
  const changes = [],
    opens = [];
  const props = rt.vm({
    accordion: true,
    defaultOpenKeys: ['a', 'nested'],
    options: [
      {
        value: 'a',
        label: 'A',
        children: [
          { value: 'nested', label: 'Nested', children: [{ value: 'deep', label: 'Deep' }] },
        ],
      },
      { value: 'b', label: 'B', children: [{ value: 'leaf', label: 'Leaf' }] },
    ],
    'on:openChange': (keys) => opens.push(keys),
    'on:change': (value) => changes.push(value),
  });
  mount(ui.Menu, props);
  const b = [...document.querySelectorAll('[role=menuitem]')].find(
    (el) => el.textContent.trim() === 'B',
  );
  b.click();
  await flush();
  assert.deepEqual(opens, [['b']]);
  props.options[1].disabled = true;
  await flush();
  const leaf = [...document.querySelectorAll('[role=menuitem]')].find(
    (el) => el.textContent.trim() === 'Leaf',
  );
  assert.equal(leaf.disabled, true);
  leaf.click();
  assert.deepEqual(changes, []);
});
void test('Menu preserves modified native link activation instead of synthesizing an unmodified click', () => {
  const changes = [];
  mount(ui.Menu, {
    options: [{ value: 'docs', label: 'Docs', href: '#docs' }],
    'on:change': (value) => changes.push(value),
  });
  const event = new window.KeyboardEvent('keydown', {
    key: 'Enter',
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.querySelector('a').dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
  assert.deepEqual(changes, []);
});
