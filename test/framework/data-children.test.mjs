import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, ui } from '../unit/harness.mjs';
void test('F14 an ordinary TSX data callback returns a children array without slot compilation', () => {
  assert.doesNotThrow(() =>
    mount(ui.DataChildrenProbe, { nodes: [{ children: [{ label: 'child' }] }] }),
  );
  assert.equal(document.querySelector('span').textContent, 'child');
});
