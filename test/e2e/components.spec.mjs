import { test, expect } from './fixtures.mjs';

test('Input and InputNumber support typing and controlled reset in a browser', async ({ page }) => {
  await page.goto('/?case=forms');
  await page.locator('input:not([type])').fill('Grace');
  await page.locator('input[type=number]').fill('4.5');
  await expect(page.locator('#form-output')).toHaveText('Grace:4.5');
  await page.getByRole('button', { name: 'reset', exact: true }).click();
  await expect(page.locator('input:not([type])')).toHaveValue('Reset');
  await expect(page.locator('input[type=number]')).toHaveValue('7');
});

test('Select opens a portal menu, accepts a selection, and dismisses it', async ({ page }) => {
  await page.goto('/?case=selection');
  await page.locator('.ja-select').click();
  await expect(page.locator('.ja-dropdown')).toHaveCSS('opacity', '1');
  await page.getByRole('option', { name: 'Beta', exact: true }).click();
  await expect(page.locator('.ja-select')).toHaveText('Beta');
  await expect(page.locator('.ja-dropdown')).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['b']);
});

test('Dropdown opens and dismisses on an outside pointer event', async ({ page }) => {
  await page.goto('/?case=selection');
  await page.getByRole('button', { name: 'dropdown trigger', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Extra', exact: true })).toBeVisible();
  await expect(page.locator('.ja-dropdown')).toHaveCSS('opacity', '1');
  await page.mouse.click(950, 750);
  await expect(page.locator('.ja-dropdown')).toHaveCount(0);
});

test('Popover opens with a click and Tooltip opens with hover', async ({ page }) => {
  await page.goto('/?case=overlays');
  await page.getByRole('button', { name: 'popover trigger', exact: true }).click();
  await expect(page.locator('.ja-popover')).toHaveText('Popover body');
  await expect(page.locator('.ja-popover')).toHaveCSS('opacity', '1');
  await page.mouse.click(950, 750);
  await expect(page.locator('.ja-popover')).toHaveCount(0);
  await page.getByRole('button', { name: 'tooltip trigger', exact: true }).hover();
  await expect(page.locator('.ja-tooltip')).toHaveText('Tooltip body');
});

test('Popconfirm confirms exactly once and finishes its leave animation', async ({ page }) => {
  await page.goto('/?case=overlays');
  await page.getByRole('button', { name: 'confirm trigger', exact: true }).click();
  await page.locator('.ja-popconfirm-footer button.primary').click();
  await expect(page.locator('.ja-popconfirm')).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['confirmed']);
});

test('Modal opens, accepts input, confirms and returns its result after the transition', async ({
  page,
}) => {
  await page.goto('/?case=dialog');
  await page.getByRole('button', { name: 'open dialog', exact: true }).click();
  await expect(page.locator('.ja-modal')).toHaveCSS('opacity', '1');
  await page.getByPlaceholder('Dialog input').fill('Hello');
  await page.locator('.ja-modal-footer button.primary').click();
  await expect(page.locator('.ja-modal')).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['accepted']);
});

test('Message renders its success icon and body in the browser', async ({ page }) => {
  await page.goto('/?case=overlays');
  await page.getByRole('button', { name: 'show message', exact: true }).click();
  await expect(page.locator('.ja-message .content')).toHaveText('Saved');
  await expect(page.locator('.ja-message svg.icon.success')).toBeVisible();
});

test('Tabs indicator moves to the newly selected tab', async ({ page }) => {
  await page.goto('/?case=tabs');
  await page.locator('.ja-tab-item').filter({ hasText: /^A$/ }).click();
  await expect(page.locator('.ja-tab-item.active')).toHaveText('A');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = document.querySelector('.ja-tab-item.active').getBoundingClientRect();
        const indicator = document.querySelector('.indicator').getBoundingClientRect();
        return Math.abs(active.left - indicator.left);
      }),
    )
    .toBeLessThanOrEqual(1);
});

test('Table preserves real DOM rows while keyed data is reordered', async ({ page }) => {
  await page.goto('/?case=table');
  await expect(page.locator('tbody tr')).toHaveText(['Ada', 'Grace']);
  await page
    .locator('tbody tr')
    .first()
    .evaluate((el) => {
      el.dataset.original = 'ada';
    });
  await page.evaluate(() => window.testApp.reverseRows());
  await expect(page.locator('tbody tr')).toHaveText(['Grace', 'Ada']);
  await expect(page.locator('tbody tr').nth(1)).toHaveAttribute('data-original', 'ada');
});
