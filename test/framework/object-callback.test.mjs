import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, ui } from '../unit/harness.mjs';
void test('F12 callbacks inside a reactive object literal retain their own parameter scope', () => {
  assert.doesNotThrow(() => mount(ui.ReactiveObjectCallbackProbe, { active: true }));
  assert.equal(document.querySelector('span').textContent, 'matched');
});
