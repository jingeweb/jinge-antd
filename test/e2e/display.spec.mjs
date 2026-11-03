import { test, expect } from './fixtures.mjs';

test('Tag close is keyboard accessible, controlled visibility restores it and preventDefault retains it', async ({
  page,
}) => {
  await page.goto('/?case=display');
  const close = page.getByRole('button', { name: '移除标签', exact: true });
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ja-tag').filter({ hasText: 'Filter tag' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore tag' }).click();
  await expect(close).toBeVisible();
  await page.getByRole('button', { name: 'Keep fixed tag' }).click();
  await expect(page.locator('.ja-tag').filter({ hasText: 'Fixed tag' })).toBeVisible();
});

test('Badge updates overflow and dot state while preserving its anchored button', async ({
  page,
}) => {
  await page.goto('/?case=display');
  const indicator = page.locator('.ja-badge-indicator');
  await expect(indicator).toHaveText('99');
  await page.locator('#badge-child').evaluate((el) => {
    el.dataset.preserved = 'yes';
  });
  await page.getByRole('button', { name: 'Increment count' }).click();
  await expect(indicator).toHaveText('99+');
  await expect(indicator).toHaveAttribute('aria-label', '100 条');
  await expect(page.locator('#badge-child')).toHaveAttribute('data-preserved', 'yes');
  const anchor = await page.locator('#badge-child').boundingBox();
  const badge = await indicator.boundingBox();
  expect(Math.abs(badge.x + badge.width / 2 - (anchor.x + anchor.width))).toBeLessThan(2);
  await page.getByRole('button', { name: 'Toggle dot' }).click();
  await expect(indicator).toHaveClass(/dot/);
  await expect(indicator).toHaveText('');
});

test('Avatar loads a real image, falls back on decode failure and recovers after changing its source', async ({
  page,
}) => {
  await page.goto('/?case=display');
  const avatar = page.getByRole('img', { name: 'Test avatar' });
  await expect(avatar).toHaveCSS('width', '48px');
  await expect.poll(() => avatar.locator('img').evaluate((el) => el.naturalWidth)).toBe(48);
  await page.getByRole('button', { name: 'Use broken image' }).click();
  await expect(avatar.locator('img')).toHaveCount(0);
  await expect(avatar).toHaveText('AB');
  await page.getByRole('button', { name: 'Retry image' }).click();
  await expect(avatar.locator('img')).toHaveCount(1);
  await expect.poll(() => avatar.locator('img').evaluate((el) => el.naturalWidth)).toBe(48);
});
