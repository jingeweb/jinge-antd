import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const options = () => [
  { key: 'a', label: 'Alpha', content: 'Alpha body' },
  { key: 'x', label: 'Blocked', disabled: true },
  { key: 'b', label: 'Beta', content: 'Beta body' },
];
const tabs = () => [...document.querySelectorAll('[role=tab]')];
function key(el, value) {
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true }));
}
void test('Tabs defaults to the first enabled item with linked tab/panel semantics and no form submission', () => {
  mount(ui.Tabs, { options: options(), ariaLabel: 'Workspace' });
  assert.equal(document.querySelector('[role=tablist]').getAttribute('aria-label'), 'Workspace');
  assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
  assert.equal(tabs()[0].type, 'button');
  assert.equal(tabs()[1].disabled, true);
  const panel = document.getElementById(tabs()[0].getAttribute('aria-controls'));
  assert.equal(panel.getAttribute('aria-labelledby'), tabs()[0].id);
  assert.equal(panel.textContent, 'Alpha body');
  assert.equal(panel.hidden, false);
  assert.equal(document.querySelectorAll('[role=tab][tabindex="0"]').length, 1);
});
void test('Tabs supports default key, ignores disabled/repeated clicks and emits only actual changes', async () => {
  const changes = [];
  mount(ui.Tabs, {
    options: options(),
    defaultActiveKey: 'b',
    'on:change': (v) => changes.push(v),
  });
  assert.equal(tabs()[2].getAttribute('aria-selected'), 'true');
  tabs()[1].click();
  tabs()[2].click();
  tabs()[0].click();
  await flush();
  assert.deepEqual(changes, ['a']);
  assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
});
void test('Tabs controlled requests leave selection unchanged until the parent accepts', async () => {
  const changes = [];
  const props = rt.vm({ options: options(), activeKey: 'a', 'on:change': (v) => changes.push(v) });
  mount(ui.Tabs, props);
  tabs()[2].click();
  await flush();
  assert.deepEqual(changes, ['b']);
  assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
  props.activeKey = 'b';
  await flush();
  assert.equal(tabs()[2].getAttribute('aria-selected'), 'true');
});
void test('Tabs automatic keyboard activation wraps, skips disabled, supports Home/End and ignores perpendicular arrows', async () => {
  mount(ui.Tabs, { options: options() });
  tabs()[0].focus();
  key(tabs()[0], 'ArrowRight');
  assert.equal(document.activeElement, tabs()[2]);
  await flush();
  assert.equal(tabs()[2].getAttribute('aria-selected'), 'true');
  key(tabs()[2], 'ArrowRight');
  await flush();
  assert.equal(document.activeElement, tabs()[0]);
  key(tabs()[0], 'End');
  await flush();
  assert.equal(document.activeElement, tabs()[2]);
  key(tabs()[2], 'Home');
  key(tabs()[0], 'ArrowDown');
  assert.equal(document.activeElement, tabs()[0]);
});
void test('Tabs vertical manual activation separates focus from selection until Enter', async () => {
  mount(ui.Tabs, { options: options(), orientation: 'vertical', activation: 'manual' });
  tabs()[0].focus();
  key(tabs()[0], 'ArrowDown');
  await flush();
  assert.equal(document.activeElement, tabs()[2]);
  assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
  key(tabs()[2], 'Enter');
  await flush();
  assert.equal(tabs()[2].getAttribute('aria-selected'), 'true');
  assert.equal(
    document.querySelector('[role=tablist]').getAttribute('aria-orientation'),
    'vertical',
  );
});
void test('Tabs lazily mounts visited content, preserves by default and destroys on request', async () => {
  const props = rt.vm({ options: options(), destroyOnHidden: false });
  mount(ui.Tabs, props);
  assert.equal(document.body.textContent.includes('Beta body'), false);
  tabs()[2].click();
  await flush();
  assert.equal(document.body.textContent.includes('Alpha body'), true);
  assert.equal(document.querySelectorAll('[role=tabpanel]:not([hidden])').length, 1);
  props.destroyOnHidden = true;
  await flush();
  assert.equal(document.body.textContent.includes('Alpha body'), false);
});
void test('Tabs handles empty/all-disabled/missing controlled keys without selecting or throwing', async () => {
  const props = rt.vm({ options: [], activeKey: 'absent' });
  mount(ui.Tabs, props);
  props.options = options();
  await flush();
  assert.equal(document.querySelectorAll('[aria-selected=true]').length, 0);
  props.options = [{ key: 'disabled', label: 'Disabled', disabled: true }];
  await flush();
  assert.equal(document.querySelectorAll('[role=tab][tabindex="0"]').length, 0);
  props.options = [];
  await flush();
  assert.equal(tabs().length, 0);
});
void test('Tabs preserves keyed tab identity and selects a valid fallback after removal or disabling without change events', async () => {
  const changes = [];
  const props = rt.vm({
    options: options(),
    defaultActiveKey: 'b',
    'on:change': (v) => changes.push(v),
  });
  mount(ui.Tabs, props);
  const alpha = tabs()[0];
  props.options.reverse();
  await flush();
  assert.equal(tabs()[2], alpha);
  props.options[0].disabled = true;
  await flush();
  assert.equal(alpha.getAttribute('aria-selected'), 'true');
  props.options = [];
  await flush();
  assert.deepEqual(changes, []);
});
void test('Tabs renders stable label/icon/content slots and permits numeric zero keys', () => {
  mount(ui.Tabs, {
    options: [
      {
        key: 0,
        label: 'zero',
        'slot:label': ui.BodySlot,
        'slot:icon': ui.IconSlot,
        'slot:content': ui.ContentSlot,
      },
    ],
  });
  assert.ok(document.querySelector('[data-testid=body-slot]'));
  assert.ok(document.querySelector('[data-testid=icon-slot]'));
  assert.equal(document.querySelector('[role=tabpanel]').textContent, 'custom content');
});

void test('Tabs observes border-box geometry and disconnects pending layout work on disposal', async () => {
  const original = globalThis.ResizeObserver;
  const instances = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = 0;
      instances.push(this);
    }
    observe(element, options) {
      this.observed.push({ element, options });
    }
    disconnect() {
      this.disconnected++;
    }
  }
  globalThis.ResizeObserver = Observer;
  try {
    const view = mount(ui.Tabs, { options: options() });
    assert.equal(instances.length, 1);
    const observer = instances[0];
    assert.equal(
      observer.observed.filter((entry) => entry.options?.box === 'border-box').length,
      3,
    );
    observer.callback();
    view.dispose();
    const disconnected = observer.disconnected;
    observer.callback();
    await flush();
    assert.equal(observer.disconnected, disconnected);
    assert.ok(disconnected >= 2);
  } finally {
    globalThis.ResizeObserver = original;
  }
});
