import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, rt, ui, flush } from './harness.mjs';

void test('Tag closes once, notifies visibility and stops a close click from reaching its parent', async () => {
  const calls = [];
  const view = mount(ui.Tag, {
    closable: true,
    'slot:default': ui.BodySlot,
    'on:close': () => calls.push('close'),
    'on:visibleChange': (v) => calls.push(v),
  });
  const parent = document.querySelector('.ja-tag').parentElement;
  let bubbled = 0;
  const click = () => bubbled++;
  parent.addEventListener('click', click);
  const button = document.querySelector('button[aria-label="移除标签"]');
  assert.ok(button);
  button.click();
  button.click();
  await flush();
  assert.deepEqual(calls, ['close', false]);
  assert.equal(bubbled, 0);
  assert.equal(document.querySelector('.ja-tag'), null);
  parent.removeEventListener('click', click);
  view.dispose();
});

void test('Tag close can be prevented and controlled visibility waits for its owner', async () => {
  const changes = [];
  const options = rt.vm({
    visible: true,
    closable: true,
    'slot:default': ui.BodySlot,
    'on:close': (event) => event.preventDefault(),
    'on:visibleChange': (v) => changes.push(v),
  });
  mount(ui.Tag, options);
  document.querySelector('.ja-tag button').click();
  await flush();
  assert.deepEqual(changes, []);
  options['on:close'] = undefined;
  document.querySelector('.ja-tag button').click();
  await flush();
  assert.deepEqual(changes, [false]);
  assert.ok(document.querySelector('.ja-tag'));
  options.visible = false;
  await flush();
  assert.equal(document.querySelector('.ja-tag'), null);
  options.visible = true;
  await flush();
  assert.ok(document.querySelector('.ja-tag'));
});

void test('Tag supports icons, semantic color, borderless styling and disabled close', async () => {
  const options = rt.vm({
    closable: true,
    disabled: true,
    bordered: false,
    color: 'warning',
    'slot:icon': ui.IconSlot,
    'slot:default': ui.BodySlot,
  });
  mount(ui.Tag, options);
  assert.ok(document.querySelector('.ja-tag.warning.borderless [data-testid="icon-slot"]'));
  assert.equal(document.querySelector('.ja-tag button').disabled, true);
  options.disabled = false;
  await flush();
  assert.equal(document.querySelector('.ja-tag button').disabled, false);
});
