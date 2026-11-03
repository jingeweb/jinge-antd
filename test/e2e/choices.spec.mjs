import { test, expect } from './fixtures.mjs';

test('Checkbox supports native keyboard, mixed state, validation and FormData', async ({
  page,
}) => {
  await page.goto('/?case=checkbox');
  const terms = page.getByRole('checkbox', { name: 'Agree terms' });
  await expect.poll(() => terms.evaluate((el) => el.checkValidity())).toBe(false);
  await terms.focus();
  await page.keyboard.press('Space');
  await expect(terms).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Partial' })).toHaveAttribute(
    'aria-checked',
    'mixed',
  );
  await page.getByRole('checkbox', { name: 'Beta', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Blocked' })).toBeDisabled();
  await page.getByRole('button', { name: 'Submit choices' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual([
    ['terms', 'yes'],
    ['features', 'a'],
    ['features', 'b'],
    ['controlled', 'a'],
  ]);
});

test('CheckboxGroup reset restores defaults, controlled state remains, and rejected edits restore native checks', async ({
  page,
}) => {
  await page.goto('/?case=checkbox');
  const alpha = page.getByRole('checkbox', { name: 'Alpha', exact: true });
  await alpha.evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await alpha.uncheck();
  await page.getByRole('checkbox', { name: 'Beta', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Owned Beta' }).check();
  await page.getByRole('button', { name: 'Reset choices' }).click();
  await expect(alpha).toBeChecked();
  await expect(alpha).toHaveAttribute('data-identity', 'kept');
  await expect(page.getByRole('checkbox', { name: 'Beta', exact: true })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Owned Beta' })).toBeChecked();
  await page.getByRole('button', { name: 'Reject checkbox edits' }).click();
  await page.getByRole('checkbox', { name: 'Owned Alpha' }).click();
  await expect(page.getByRole('checkbox', { name: 'Owned Alpha' })).toBeChecked();
});

test('RadioGroup native arrows skip disabled options, wrap and keep button groups isolated', async ({
  page,
}) => {
  await page.goto('/?case=radio');
  const alpha = page.getByRole('radio', { name: 'Plan Alpha' });
  const gamma = page.getByRole('radio', { name: 'Plan Gamma' });
  await alpha.focus();
  await page.keyboard.press('ArrowRight');
  await expect(gamma).toBeChecked();
  await expect(gamma).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(alpha).toBeChecked();
  await page.getByRole('radio', { name: 'Card view' }).click();
  await expect(alpha).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Card view' })).toBeChecked();
  await page.getByRole('button', { name: 'Submit radios' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual([
    ['plan', 'a'],
    ['view', 'card'],
    ['owned', 'x'],
  ]);
});

test('RadioGroup resets defaults and restores every radio after rejected native keyboard edits', async ({
  page,
}) => {
  await page.goto('/?case=radio');
  await page.getByRole('radio', { name: 'Plan Gamma' }).check();
  await page.getByRole('radio', { name: 'Owned Y' }).check();
  await page.getByRole('button', { name: 'Reset radios' }).click();
  await expect(page.getByRole('radio', { name: 'Plan Alpha' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Owned Y' })).toBeChecked();
  await page.getByRole('button', { name: 'Reject radio edits' }).click();
  await page.getByRole('radio', { name: 'Owned Y' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: 'Owned X' })).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Owned Y' })).toBeChecked();
});

test('Switch native Space and Enter toggle once without submitting, and reset preserves the controlled owner', async ({
  page,
}) => {
  await page.goto('/?case=switch');
  const save = page.getByRole('switch', { name: 'Auto save' });
  await save.focus();
  await page.keyboard.press('Space');
  await expect(save).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(save).not.toBeChecked();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([
    { type: 'change', checked: true },
    { type: 'change', checked: false },
  ]);
  await save.click();
  await page.getByRole('switch', { name: 'Default notifications' }).click();
  await page.getByRole('button', { name: 'Reset switches' }).click();
  await expect(save).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Default notifications' })).toBeChecked();
  await page.getByRole('button', { name: 'Submit switches' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'submit',
    data: [
      ['save', 'yes'],
      ['notifications', 'on'],
    ],
  });
});

test('Switch loading and disabled block interaction and exclude form values, with reduced motion support', async ({
  page,
}) => {
  await page.goto('/?case=switch');
  const save = page.getByRole('switch', { name: 'Auto save' });
  await save.click();
  await page.getByRole('button', { name: 'Toggle busy' }).click();
  await expect(save).toBeDisabled();
  await expect(save).toHaveAttribute('aria-busy', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.ja-switch-spinner')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Submit switches' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'submit',
    data: [['notifications', 'on']],
  });
  await page.getByRole('button', { name: 'Toggle busy' }).click();
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await expect(save).toBeEnabled();
  await expect(save).toBeChecked();
});
