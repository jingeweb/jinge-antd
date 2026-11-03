import { test, expect } from './fixtures.mjs';

test('Tooltip opens on keyboard focus, describes its trigger, and dismisses with Escape', async ({
  page,
}) => {
  await page.goto('/?case=overlaylab');
  const trigger = page.getByRole('button', { name: 'Keyboard tooltip' });
  await trigger.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveText('Keyboard help');
  await expect(trigger).toHaveAttribute('aria-describedby', await tooltip.getAttribute('id'));
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).not.toHaveAttribute('aria-describedby');
});
test('Popover supports editing, outside clicks and focus return after Escape', async ({ page }) => {
  await page.goto('/?case=overlaylab');
  const trigger = page.getByRole('button', { name: 'Editable popover' });
  await trigger.click();
  await expect(page.getByRole('textbox', { name: 'Popover field' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Popover field' }).fill('Edited');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Editable details' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(950, 750);
  await expect(page.getByRole('dialog', { name: 'Editable details' })).toHaveCount(0);
});
test('Popconfirm blocks duplicate submissions and Escape while pending, then allows retry', async ({
  page,
}) => {
  await page.goto('/?case=overlaylab');
  await page.getByRole('button', { name: 'Async confirm' }).click();
  const panel = page.getByRole('dialog', { name: '操作确认' });
  const confirm = panel.locator('button.primary');
  await confirm.click();
  await expect(confirm).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['submit']);
  await page.evaluate(() => window.testApp.resolveConfirm(false));
  await expect(confirm).toBeEnabled();
  await expect(panel).toBeVisible();
  await confirm.click();
  await page.evaluate(() => window.testApp.resolveConfirm(true));
  await expect(panel).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['submit', 'submit']);
  await expect(page.getByRole('button', { name: 'Async confirm' })).toBeFocused();
});
