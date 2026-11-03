import { test, expect } from './fixtures.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('/?case=notices');
});

test('Message updates its live status, leaves focus at its trigger and removes its empty region', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Show loading message' }).click();
  await expect(page.getByRole('button', { name: 'Show loading message' })).toBeFocused();
  await expect(page.locator('.ja-message[role="status"]')).toHaveText('Importing');
  await page.getByRole('button', { name: 'Update message' }).click();
  await expect(page.locator('.ja-message')).toHaveText('Import finished');
  await expect(page.locator('.ja-message .icon')).toHaveClass(/success/);
  await page.getByRole('button', { name: 'Clear messages' }).click();
  await expect(page.locator('.ja-message-container')).toHaveCount(0);
});

test('Notification rich actions and accessible close finish independent instances', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Show notification', exact: true }).click();
  await page.getByRole('textbox', { name: 'Notification field' }).fill('Read');
  await page.screenshot({ path: 'test/.results/notification.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'View results' }).click();
  await expect(page.locator('.ja-notification')).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['viewed']);
  await page.getByRole('button', { name: 'Show notification', exact: true }).click();
  await page.getByRole('button', { name: '关闭通知' }).click();
  await expect(page.locator('.ja-notification-container')).toHaveCount(0);
});

test('Notification timeout pauses for both hover and keyboard focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Timed notification' }).click();
  await page.locator('.ja-notification').hover();
  await page.waitForTimeout(500);
  await expect(page.locator('.ja-notification')).toBeVisible();
  await page.getByRole('textbox', { name: 'Notification field' }).focus();
  await page.mouse.move(5, 450);
  await page.waitForTimeout(500);
  await expect(page.locator('.ja-notification')).toBeVisible();
  await page.getByRole('textbox', { name: 'Page field' }).focus();
  await expect(page.locator('.ja-notification')).toHaveCount(0);
});

for (const placement of ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']) {
  test(`Notification ${placement} stays within a narrow viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 340, height: 480 });
    await page.getByRole('combobox', { name: 'Notification placement' }).selectOption(placement);
    await page.getByRole('button', { name: 'Show notification', exact: true }).click();
    const card = page.locator('.ja-notification');
    await card.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const box = await card.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(340);
    expect(box.y + box.height).toBeLessThanOrEqual(480);
    await expect(
      page.locator(`.ja-notification-stack[data-placement="${placement}"] .ja-notification`),
    ).toBeVisible();
  });
}

test('Message and Notification stay above a modal, remain announced and do not steal dialog focus', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open feedback modal' }).click();
  await page.getByRole('button', { name: 'Show feedback', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Show feedback', exact: true })).toBeFocused();
  const values = await page.evaluate(() => ({
    dialog: +getComputedStyle(document.querySelector('.ja-modal-root')).zIndex,
    message: +getComputedStyle(document.querySelector('.ja-message-container')).zIndex,
    notification: +getComputedStyle(document.querySelector('.ja-notification-container')).zIndex,
    inert: document.querySelector('.ja-notification-container').inert,
  }));
  expect(values.message).toBeGreaterThan(values.dialog);
  expect(values.notification).toBeGreaterThan(values.dialog);
  expect(values.inert).toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-modal')).toHaveCount(0);
  await expect(page.locator('.ja-message')).toBeVisible();
});
