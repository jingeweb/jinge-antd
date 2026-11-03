import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, mount, flush } from './harness.mjs';

void test('Button defaults to a non-submitting native button with medium size', () => {
  mount(ui.Button);
  assert.equal(document.querySelector('button').type, 'button');
  assert.ok(document.querySelector('button').classList.contains('md'));
});
void test('Button updates native form attributes and presentation flags', async () => {
  const props = rt.vm({
    htmlType: 'submit',
    name: 'action',
    value: 'save',
    danger: true,
    shape: 'round',
    block: true,
  });
  mount(ui.Button, props);
  const button = document.querySelector('button');
  assert.equal(button.type, 'submit');
  assert.equal(button.name, 'action');
  assert.equal(button.value, 'save');
  assert.ok(['danger', 'round', 'block'].every((cls) => button.classList.contains(cls)));
  props.htmlType = 'reset';
  props.danger = false;
  props.shape = 'circle';
  await flush();
  assert.equal(button.type, 'reset');
  assert.ok(button.classList.contains('circle'));
  assert.equal(button.classList.contains('danger'), false);
});
void test('Button exposes focus/blur and forwards its accessible label and description', () => {
  const view = mount(ui.Button, {
    ariaLabel: 'Save record',
    ariaDescribedby: 'save-help',
    title: 'Save',
    tabIndex: 0,
  });
  const button = document.querySelector('button');
  assert.equal(button.getAttribute('aria-label'), 'Save record');
  assert.equal(button.getAttribute('aria-describedby'), 'save-help');
  view.host.focus();
  assert.equal(document.activeElement, button);
  view.host.blur();
  assert.notEqual(document.activeElement, button);
});
void test('Button loading is reactive and blocks even a manually dispatched click', async () => {
  let clicks = 0;
  const props = rt.vm({ loading: false, 'on:click': () => clicks++ });
  mount(ui.Button, props);
  const button = document.querySelector('button');
  button.click();
  assert.equal(clicks, 1);
  props.loading = true;
  await flush();
  assert.equal(button.getAttribute('aria-busy'), 'true');
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.equal(clicks, 1);
  props.loading = false;
  await flush();
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute('aria-busy'), null);
  button.click();
  assert.equal(clicks, 2);
});
void test('ButtonGroup propagates size changes and honors an explicit child size', async () => {
  const props = rt.vm({ size: 'sm', disabled: false });
  mount(ui.GroupProbe, props);
  const [inherited, explicit] = document.querySelectorAll('button');
  assert.ok(inherited.classList.contains('sm'));
  assert.ok(explicit.classList.contains('lg'));
  props.size = 'md';
  await flush();
  assert.ok(inherited.classList.contains('md'));
  assert.ok(explicit.classList.contains('lg'));
});
void test('ButtonGroup disables all descendants reactively and restores them', async () => {
  const props = rt.vm({ disabled: false });
  mount(ui.GroupProbe, props);
  const buttons = [...document.querySelectorAll('button')];
  props.disabled = true;
  await flush();
  assert.ok(buttons.every((button) => button.disabled));
  props.disabled = false;
  await flush();
  assert.ok(buttons.every((button) => !button.disabled));
  assert.equal(document.querySelector('[role=group]').getAttribute('aria-label'), 'Actions');
});
void test('Button ghost styling and group direction/class/style remain reactive', async () => {
  const props = rt.vm({
    direction: 'horizontal',
    className: 'toolbar',
    style: 'gap:4px',
    'slot:default': ui.NestedButtons,
  });
  mount(ui.ButtonGroup, props);
  assert.equal(document.querySelector('.toolbar').style.gap, '4px');
  props.direction = 'vertical';
  await flush();
  assert.ok(document.querySelector('.toolbar').classList.contains('vertical'));
  mount(ui.Button, { ghost: true, type: 'primary' });
  assert.ok(document.querySelector('.ja-button.ghost.primary'));
});
