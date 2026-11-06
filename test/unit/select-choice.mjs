import assert from 'node:assert/strict';

import { flush } from './harness.mjs';
export async function chooseOption(trigger, label) {
  if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
  await flush();
  const option = [...document.querySelectorAll('[role=option]')].find(
    (element) => element.getAttribute('aria-label') === label,
  );
  assert.ok(option, `Missing option: ${label}`);
  option.click();
  await flush();
}
