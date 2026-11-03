import { test, expect } from './fixtures.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('/?case=dialoglab');
});

test('Modal traps Tab, makes background inert and restores trigger focus on Escape', async ({
  page,
}) => {
  await page.locator('#open-modal').click();
  const dialog = page.getByRole('dialog', { name: 'Edit customer', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Customer name' })).toBeFocused();
  await page.screenshot({ path: 'test/.results/dialog-modal.png', animations: 'disabled' });
  expect(await page.locator('#outside-dialog').evaluate((el) => el.inert)).toBe(true);
  await dialog.getByRole('button', { name: '确 认' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: '关闭' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: '确 认' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#open-modal')).toBeFocused();
  expect(await page.locator('#outside-dialog').evaluate((el) => el.inert)).toBe(false);
});

test('Modal admits its Popover portal and Escape dismisses the popup before its owner', async ({
  page,
}) => {
  await page.locator('#open-modal').click();
  await page.locator('#dialog-popover').click();
  await expect(page.getByRole('textbox', { name: 'Portal field' })).toBeFocused();
  const popup = page.getByRole('dialog', { name: 'Dialog popover' });
  expect(await popup.evaluate((el) => el.inert)).toBe(false);
  await page.getByRole('textbox', { name: 'Portal field' }).fill('In scope');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('.ja-modal') !== null)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(page.locator('.ja-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-modal')).toHaveCount(0);
});

test('Nested Drawer keeps stable lower layers, locks the body and restores parent focus', async ({
  page,
}) => {
  await page.locator('#open-modal').click();
  const initialZ = await page.locator('.ja-modal').evaluate((el) => getComputedStyle(el).zIndex);
  await page.locator('#open-drawer').click();
  await expect(page.getByRole('textbox', { name: 'Drawer field' })).toBeFocused();
  await page.screenshot({ path: 'test/.results/dialog-nested.png', animations: 'disabled' });
  expect(await page.locator('.ja-modal').evaluate((el) => getComputedStyle(el).zIndex)).toBe(
    initialZ,
  );
  const layers = await page.evaluate(() => ({
    modal: +getComputedStyle(document.querySelector('.ja-modal')).zIndex,
    mask: +getComputedStyle(document.querySelector('.ja-drawer-mask')).zIndex,
  }));
  expect(layers.mask).toBeGreaterThan(layers.modal);
  expect(await page.locator('.ja-modal-root').evaluate((el) => el.inert)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-drawer')).toHaveCount(0);
  await expect(page.locator('#open-drawer')).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

for (const placement of ['left', 'right', 'top', 'bottom']) {
  test(`Drawer ${placement} fits the viewport and scrolls its body`, async ({ page }) => {
    await page.evaluate((value) => {
      window.testApp.dialogLab.placement = value;
    }, placement);
    await page.locator('#open-modal').click();
    await page.locator('#open-drawer').click();
    const drawer = page.locator('.ja-drawer');
    await expect(drawer).toHaveAttribute('data-placement', placement);
    await drawer.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    await page.setViewportSize({ width: 340, height: 480 });
    const box = await drawer.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(341);
    expect(box.y + box.height).toBeLessThanOrEqual(481);
    await page.locator('.ja-drawer-content').evaluate((el) => {
      el.scrollTop = 300;
    });
    expect(await page.locator('.ja-drawer-content').evaluate((el) => el.scrollTop)).toBeGreaterThan(
      0,
    );
    await page.locator('#drawer-done').click();
    await expect(drawer).toHaveCount(0);
  });
}

test('Modal async confirmation disables cancel, mask and Escape and supports retry', async ({
  page,
}) => {
  await page.locator('#open-modal').click();
  const confirm = page.locator('.ja-modal-footer button.primary');
  await confirm.click();
  await expect(confirm).toBeDisabled();
  await expect(page.locator('.ja-modal .ja-close')).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.locator('.ja-modal-mask').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('.ja-modal')).toBeVisible();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['submit']);
  await page.evaluate(() => window.testApp.resolveConfirm(false));
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await page.evaluate(() => window.testApp.resolveConfirm(true));
  await expect(page.locator('.ja-modal')).toHaveCount(0);
  await expect(page.locator('#open-modal')).toBeFocused();
});

test('Modal constrains long content and closes immediately after mounting', async ({ page }) => {
  await page.evaluate(() => {
    window.testApp.dialogLab.long = true;
  });
  await page.locator('#open-modal').click();
  const content = page.locator('.ja-modal-content');
  await content.evaluate((el) => {
    el.scrollTop = 400;
  });
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    window.testApp.dialogLab.open = true;
  });
  await expect(page.locator('.ja-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-modal-root')).toHaveCount(0);
});
