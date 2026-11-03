import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, ui } from '../unit/harness.mjs';
void test('F11 For supplies the declared first/last flags to each slot', () => {
  mount(ui.ForBoundaryProbe, { items: ['First', 'Last'] });
  const items = document.querySelectorAll('span');
  assert.equal(items[0].getAttribute('data-first'), 'true');
  assert.equal(items[0].getAttribute('data-last'), 'false');
  assert.equal(items[1].getAttribute('data-first'), 'false');
  assert.equal(items[1].getAttribute('data-last'), 'true');
});
