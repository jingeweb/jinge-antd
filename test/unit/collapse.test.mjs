import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Collapse lazily mounts named panels and preserves edited content after folding', async () => {
  const events = [];
  mount(ui.Collapse, {
    items: [
      { key: 'a', label: 'Account', 'slot:content': ui.FocusContentSlot },
      { key: 'b', label: 'Billing', content: 'Billing details' },
    ],
    'on:change': (keys) => events.push(keys),
  });
  assert.equal(document.querySelector('input'), null);
  const button = document.querySelector('.ja-collapse-trigger');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  button.click();
  await flush();
  const input = document.querySelector('input');
  input.value = 'Unsaved';
  const region = document.getElementById(button.getAttribute('aria-controls'));
  assert.equal(region.getAttribute('aria-labelledby'), button.id);
  assert.equal(region.hidden, false);
  button.click();
  await flush();
  assert.equal(region.hidden, true);
  button.click();
  await flush();
  assert.equal(document.querySelector('input'), input);
  assert.equal(input.value, 'Unsaved');
  assert.deepEqual(events, [['a'], [], ['a']]);
});

void test('Collapse controlled accordion requests and array mutations normalize valid unique keys', async () => {
  const events = [];
  const options = rt.vm({
    accordion: true,
    activeKeys: ['a', 'a', 'missing'],
    items: [
      { key: 'a', label: 'A', content: 'A body' },
      { key: 'b', label: 'B', content: 'B body' },
    ],
    'on:change': (keys) => events.push(keys),
  });
  mount(ui.Collapse, options);
  const buttons = document.querySelectorAll('.ja-collapse-trigger');
  buttons[1].click();
  await flush();
  assert.deepEqual(events, [['b']]);
  assert.equal(buttons[0].getAttribute('aria-expanded'), 'true');
  assert.equal(buttons[1].getAttribute('aria-expanded'), 'false');
  options.activeKeys.splice(0, options.activeKeys.length, 'b');
  await flush();
  assert.equal(buttons[0].getAttribute('aria-expanded'), 'false');
  assert.equal(buttons[1].getAttribute('aria-expanded'), 'true');
});

void test('Collapse keyboard navigation skips disabled triggers and respects global disabled', async () => {
  const options = rt.vm({
    disabled: false,
    items: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B', disabled: true },
      { key: 'c', label: 'C' },
    ],
  });
  mount(ui.Collapse, options);
  const buttons = document.querySelectorAll('.ja-collapse-trigger');
  buttons[0].focus();
  buttons[0].dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
  );
  assert.equal(document.activeElement, buttons[2]);
  buttons[2].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(document.activeElement, buttons[0]);
  options.disabled = true;
  await flush();
  assert.ok([...buttons].every((button) => button.disabled));
});

void test('Collapse keyed reorder preserves panel identity, removed active keys are pruned and destroyOnHidden unmounts', async () => {
  const items = rt.vm([
    { key: 'a', label: 'A', 'slot:content': ui.FocusContentSlot },
    { key: 'b', label: 'B' },
  ]);
  const options = rt.vm({ items, defaultActiveKeys: ['a'], destroyOnHidden: false });
  mount(ui.Collapse, options);
  const input = document.querySelector('input');
  items.reverse();
  await flush();
  assert.equal(document.querySelector('input'), input);
  options.destroyOnHidden = true;
  await flush();
  document.querySelectorAll('.ja-collapse-trigger')[1].click();
  await flush();
  assert.equal(document.querySelector('input'), null);
  items.splice(1, 1);
  await flush();
  items.push({ key: 'a', label: 'A' });
  await flush();
  assert.equal(
    document.querySelectorAll('.ja-collapse-trigger')[1].getAttribute('aria-expanded'),
    'false',
  );
});

void test('Collapse supports item label/content/extra slots, presentation and an empty list', () => {
  const view = mount(ui.Collapse, {
    items: [
      {
        key: 'a',
        'slot:label': ui.ContentSlot,
        'slot:content': ui.BodySlot,
        'slot:extra': ui.TriggerSlot,
      },
    ],
    defaultActiveKeys: ['a'],
    size: 'sm',
    bordered: false,
    ghost: true,
  });
  assert.ok(document.querySelector('.ja-collapse.sm.borderless.ghost'));
  assert.ok(document.querySelector('.ja-collapse-trigger [data-testid="content-slot"]'));
  assert.ok(document.querySelector('.ja-collapse-content strong'));
  assert.ok(document.querySelector('.ja-collapse-extra button'));
  view.dispose();
  assert.doesNotThrow(() => mount(ui.Collapse, { items: [] }));
});
