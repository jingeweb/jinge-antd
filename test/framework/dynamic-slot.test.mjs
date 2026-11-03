import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from '../unit/harness.mjs';
void test('F09 slot fallback responds when a text option acquires a slot after mount', async () => {
  const props = rt.vm({ option: { label: 'Initial' } });
  mount(ui.DynamicOptionSlotProbe, props);
  props.option = { label: 'Resolved', 'slot:label': ui.BodySlot };
  await flush();
  assert.equal(document.querySelector('[data-testid=body-slot]')?.textContent, 'slot body');
});
