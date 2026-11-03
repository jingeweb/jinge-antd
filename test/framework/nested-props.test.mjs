import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from '../unit/harness.mjs';

void test('F08 nested VM passed as a component prop updates a native JSX property', async () => {
  const config = rt.vm({ disabled: false });
  mount(ui.NestedInputConfigParent, config);
  assert.equal(document.querySelector('input').disabled, false);
  config.disabled = true;
  await flush();
  assert.equal(document.querySelector('input').disabled, true);
});
