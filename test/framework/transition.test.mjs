import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, mount, sleep, flush, endTransition } from '../unit/harness.mjs';

// Deliberately outside the normal component suites. Assert the expected framework behavior.
void test('F04 Transition removes a panel closed before its scheduled enter begins', async () => {
  const state = rt.vm({ open: false });
  mount(ui.TransitionProbe, { state });
  state.open = true;
  for (
    let attempt = 0;
    attempt < 50 && !document.querySelector('[data-testid=transition-probe]');
    attempt++
  )
    await sleep(1);
  assert.ok(
    document.querySelector('[data-testid=transition-probe]'),
    'Setup must mount content before requesting close',
  );
  state.open = false;
  await flush();
  endTransition('[data-testid=transition-probe]');
  await flush();
  assert.equal(document.querySelector('[data-testid=transition-probe]'), null);
});
