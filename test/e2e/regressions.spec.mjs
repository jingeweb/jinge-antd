import { test, expect } from './fixtures.mjs';

test('R02 An upper modal mask covers the lower modal without raising the lower panel', async ({
  page,
}) => {
  await page.goto('/?case=layers');
  const lower = page.locator('.lower-modal');
  await expect(lower).toHaveCSS('opacity', '1');
  const initialZ = await lower.evaluate((el) => Number(getComputedStyle(el).zIndex));
  await page.locator('#open-second').click();
  await expect(page.locator('.upper-modal')).toHaveCSS('opacity', '1');
  const values = await page.evaluate(() => ({
    lower: Number(getComputedStyle(document.querySelector('.lower-modal')).zIndex),
    mask: Number(getComputedStyle(document.querySelector('.upper-mask')).zIndex),
  }));
  expect(values.mask).toBeGreaterThan(values.lower);
  expect(values.lower).toBe(initialZ);
});

test('R13 Hover safePolygon keeps the panel open when entering it on a scrolled page', async ({
  page,
}) => {
  await page.goto('/?case=polygon');
  await page.evaluate(() => window.scrollTo(0, 700));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.locator('#polygon-trigger').hover();
  await expect(page.locator('#polygon-content')).toBeVisible();
  await expect(page.locator('.ja-floating')).toHaveCSS('opacity', '1');
  const box = await page.locator('#polygon-content').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
  // Flush normal rendering and any leave transition, then check both state and visible content.
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.testApp.state.open)).toBe(true);
  await expect(page.locator('#polygon-content')).toBeVisible();
});

test('R18 Tabs indicator follows inserted options while activeKey stays unchanged', async ({
  page,
}) => {
  await page.goto('/?case=tabs');
  const delta = () =>
    page.evaluate(() => {
      const active = document.querySelector('.ja-tab-item.active').getBoundingClientRect();
      const indicator = document.querySelector('.indicator').getBoundingClientRect();
      return {
        left: Math.abs(active.left - indicator.left),
        width: Math.abs(active.width - indicator.width),
      };
    });
  await expect.poll(async () => (await delta()).left).toBeLessThanOrEqual(1);
  await page.evaluate(() => window.testApp.prependTab());
  await expect(page.locator('.ja-tab-item')).toHaveCount(3);
  await expect.poll(async () => (await delta()).left).toBeLessThanOrEqual(1);
  expect((await delta()).width).toBeLessThanOrEqual(1);
});
