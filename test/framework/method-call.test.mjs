import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from '../unit/harness.mjs';
void test('F02 member calls keep native array/string receivers and respond to explicit argument/receiver changes', async () => {
  const props = rt.vm({ query: 'Alpha' });
  mount(ui.MemberCallProbe, props);
  assert.equal(document.querySelector('span').textContent, 'true:Alpha');
  props.query = ' Beta ';
  await flush();
  assert.equal(document.querySelector('span').textContent, 'false:Beta');
});
