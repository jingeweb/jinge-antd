import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const items = () => [
  { key: 'create', title: 'Create', description: 'Basic details' },
  { key: 'review', title: 'Review' },
  { key: 'done', title: 'Done', disabled: true },
];
void test('Steps renders an ordered named progress list with current and inferred statuses', () => {
  mount(ui.Steps, { items: items(), current: 1, ariaLabel: 'Publish' });
  assert.equal(document.querySelector('ol').getAttribute('aria-label'), 'Publish');
  assert.equal(document.querySelectorAll('li').length, 3);
  assert.equal(document.querySelector('[aria-current=step]').textContent.includes('Review'), true);
  assert.ok(document.querySelectorAll('li')[0].classList.contains('finish'));
  assert.ok(document.querySelectorAll('li')[1].classList.contains('process'));
  assert.ok(document.querySelectorAll('li')[2].classList.contains('wait'));
  assert.equal(document.querySelectorAll('button').length, 0);
});
void test('Steps current error status and per-item overrides update reactively', async () => {
  const props = rt.vm({ items: items(), current: 1, status: 'error' });
  mount(ui.Steps, props);
  assert.ok(document.querySelectorAll('li')[1].classList.contains('error'));
  props.items[0].status = 'wait';
  props.current = 2;
  props.status = 'finish';
  await flush();
  assert.ok(document.querySelectorAll('li')[0].classList.contains('wait'));
  assert.ok(document.querySelectorAll('li')[2].classList.contains('finish'));
  assert.equal(document.querySelector('[aria-current=step]').textContent.includes('Done'), true);
});
void test('Steps optional navigation emits requests, uses native buttons, and ignores disabled/current steps', () => {
  const changes = [];
  mount(ui.Steps, { items: items(), current: 1, 'on:change': (v) => changes.push(v) });
  const buttons = [...document.querySelectorAll('button')];
  assert.equal(buttons[0].type, 'button');
  assert.equal(buttons[2].disabled, true);
  buttons[0].click();
  buttons[1].click();
  buttons[2].click();
  assert.deepEqual(changes, [0]);
  assert.equal(document.querySelector('[aria-current=step]').textContent.includes('Review'), true);
});
void test('Steps supports custom title, description and icon slots while preserving keyed identity', async () => {
  const props = rt.vm({
    items: [
      {
        key: 'a',
        'slot:title': ui.BodySlot,
        'slot:description': ui.ContentSlot,
        'slot:icon': ui.IconSlot,
      },
      ...items(),
    ],
  });
  mount(ui.Steps, props);
  assert.ok(document.querySelector('[data-testid=body-slot]'));
  assert.ok(document.querySelector('[data-testid=icon-slot]'));
  assert.equal(document.querySelector('.ja-step-description').textContent, 'custom content');
  const first = document.querySelector('li');
  props.items.reverse();
  await flush();
  assert.equal(document.querySelectorAll('li')[3], first);
});
void test('Steps handles empty, no-current and complete flows with no bogus current marker', async () => {
  const props = rt.vm({ items: [], current: -1 });
  mount(ui.Steps, props);
  props.items = items();
  await flush();
  assert.equal(document.querySelectorAll('[aria-current=step]').length, 0);
  assert.equal(document.querySelectorAll('li.wait').length, 3);
  props.current = 3;
  await flush();
  assert.equal(document.querySelectorAll('li.finish').length, 3);
  assert.equal(document.querySelectorAll('[aria-current=step]').length, 0);
});
