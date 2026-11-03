import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
void test('Breadcrumb exposes a named navigation list and a single current page with decorative separators', () => {
  mount(ui.Breadcrumb, {
    items: [
      { key: 'home', label: 'Home', href: '#home' },
      { key: 'users', label: 'Users', href: '#users' },
      { key: 'detail', label: 'Ada', href: '#ada' },
    ],
  });
  assert.equal(document.querySelector('nav').getAttribute('aria-label'), '面包屑');
  assert.equal(document.querySelectorAll('ol > li').length, 3);
  assert.equal(document.querySelector('[aria-current=page]').textContent, 'Ada');
  assert.equal(document.querySelectorAll('a').length, 2);
  assert.equal(document.querySelectorAll('.ja-breadcrumb-separator[aria-hidden=true]').length, 2);
});
void test('Breadcrumb links preserve native href/target and callbacks can prevent navigation; disabled/unsafe links are inert', () => {
  const clicks = [];
  mount(ui.Breadcrumb, {
    items: [
      {
        key: 'external',
        label: 'External',
        href: 'https://example.com',
        target: '_blank',
        rel: 'nofollow',
      },
      { key: 'disabled', label: 'Disabled', href: '#blocked', disabled: true },
      { key: 'bad', label: 'Unsafe', href: 'javascript:alert(1)' },
      { key: 'current', label: 'Current' },
    ],
    'on:click': (item, event) => {
      event.preventDefault();
      clicks.push(item.key);
    },
  });
  const link = document.querySelector('a');
  assert.equal(link.target, '_blank');
  assert.match(link.rel, /noopener/);
  link.click();
  assert.deepEqual(clicks, ['external']);
  assert.equal(document.querySelectorAll('[aria-disabled=true]').length, 2);
  assert.equal(document.querySelectorAll('a').length, 1);
});
void test('Breadcrumb supports stable label/icon/separator slots and empty paths', () => {
  const view = mount(ui.Breadcrumb, {
    items: [
      { key: 'a', label: 'A', 'slot:label': ui.BodySlot, 'slot:icon': ui.IconSlot },
      { key: 'b', label: 'B' },
    ],
    'slot:separator': ui.ContentSlot,
  });
  assert.ok(document.querySelector('[data-testid=body-slot]'));
  assert.ok(document.querySelector('[data-testid=icon-slot]'));
  assert.equal(document.querySelector('.ja-breadcrumb-separator').textContent, 'custom content');
  view.dispose();
  mount(ui.Breadcrumb, { items: [] });
  assert.equal(document.querySelectorAll('li').length, 0);
});
void test('Breadcrumb keyed ancestors keep native link nodes when the path updates', async () => {
  const props = rt.vm({
    items: [
      { key: 'a', label: 'A', href: '#a' },
      { key: 'b', label: 'B', href: '#b' },
      { key: 'c', label: 'Current' },
    ],
    separator: '>',
  });
  mount(ui.Breadcrumb, props);
  const first = document.querySelector('a');
  props.items = [props.items[1], props.items[0], props.items[2]];
  await flush();
  assert.equal(document.querySelectorAll('a')[1], first);
  assert.equal(document.querySelector('.ja-breadcrumb-separator').textContent, '>');
});
