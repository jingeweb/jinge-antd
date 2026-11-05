import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from '../unit/harness.mjs';
void test('F11 map boundaries are calculated from index and current list length', async () => {
  const props = rt.vm({ items: ['First', 'Last'] });
  mount(ui.ForBoundaryProbe, props);
  const items = document.querySelectorAll('span');
  assert.equal(items[0].getAttribute('data-first'), 'true');
  assert.equal(items[0].getAttribute('data-last'), 'false');
  assert.equal(items[1].getAttribute('data-first'), 'false');
  assert.equal(items[1].getAttribute('data-last'), 'true');
  props.items.push('Added');
  await flush();
  assert.equal(items[1].getAttribute('data-last'), 'false');
  assert.equal(document.querySelectorAll('span')[2].getAttribute('data-last'), 'true');
  props.items.reverse();
  await flush();
  assert.equal(items[0].getAttribute('data-first'), 'false');
  assert.equal(items[0].getAttribute('data-last'), 'true');
  assert.equal(document.querySelectorAll('span')[0].getAttribute('data-first'), 'true');
  props.items.splice(0, 2);
  await flush();
  const only = document.querySelector('span');
  assert.equal(only.getAttribute('data-first'), 'true');
  assert.equal(only.getAttribute('data-last'), 'true');
});
