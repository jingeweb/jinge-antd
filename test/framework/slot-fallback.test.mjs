import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mount, ui } from '../unit/harness.mjs';

void test('F05 A chained slot fallback renders default children instead of treating slot functions as text', () => {
  mount(ui.SlotFallbackProbe, { 'slot:default': ui.BodySlot, 'slot:icon': ui.IconSlot });
  assert.equal(
    document.querySelector('[data-testid="slot-fallback-probe"] strong')?.textContent,
    'slot body',
  );
});
