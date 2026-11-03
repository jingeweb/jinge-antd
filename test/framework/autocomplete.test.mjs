import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, ui } from '../unit/harness.mjs';

void test('F07 JSX autoComplete writes the native autocomplete attribute', () => {
  mount(ui.NativeAutocompleteProbe, { autoComplete: 'username' });
  assert.equal(document.querySelector('input').autocomplete, 'username');
  assert.equal(document.querySelector('input').getAttribute('autocomplete'), 'username');
});
