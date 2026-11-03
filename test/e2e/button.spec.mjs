import { test, expect } from './fixtures.mjs';

test('Button defaults never submit a containing native form', async ({ page }) => {
  await page.goto('/?case=buttons');
  await page.getByRole('button', { name: 'Ordinary action' }).click();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
  await page.getByRole('button', { name: 'Submit action' }).click();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['submitted']);
});
test('Button htmlType reset preserves native form reset behavior', async ({ page }) => {
  await page.goto('/?case=buttons');
  await page.getByRole('textbox', { name: 'Native field' }).fill('edited');
  await page.getByRole('button', { name: 'Reset action' }).click();
  await expect(page.getByRole('textbox', { name: 'Native field' })).toHaveValue('');
});
test('Button supports keyboard activation and a disabled button is skipped', async ({ page }) => {
  await page.goto('/?case=buttons');
  const button = page.getByRole('button', { name: 'Keyboard action' });
  await button.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['clicked', 'clicked']);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Grouped action' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
});
test('ButtonGroup disabled updates reach its actual browser buttons', async ({ page }) => {
  await page.goto('/?case=buttons');
  await page.getByRole('button', { name: 'Toggle group' }).click();
  await expect(page.getByRole('button', { name: 'Grouped action' })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle group' }).click();
  await expect(page.getByRole('button', { name: 'Grouped action' })).toBeEnabled();
});
