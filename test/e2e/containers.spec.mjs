import { test, expect } from './fixtures.mjs';

test('Empty falls back from a failed image and supports a real keyboard creation/reset flow', async ({
  page,
}) => {
  await page.goto('/?case=empty');
  await expect(page.locator('.ja-empty-description')).toHaveText('No customers');
  await expect
    .poll(() => page.locator('.ja-empty-image img').evaluate((el) => el.naturalWidth))
    .toBe(48);
  await page.getByRole('button', { name: 'Toggle empty image' }).click();
  await expect(page.locator('.ja-empty-image img')).toHaveCount(0);
  await expect(page.locator('.ja-empty-image svg')).toBeVisible();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['empty-error']);
  await page.screenshot({ path: 'test/.results/empty.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Create customer' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ja-empty')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Created 1 customer');
  await page.getByRole('button', { name: 'Reset empty' }).click();
  await expect(page.locator('.ja-empty')).toBeVisible();
});

test('Descriptions uses real responsive columns, spans and readable values without horizontal overflow', async ({
  page,
}) => {
  await page.goto('/?case=descriptions');
  const details = page.getByRole('region', { name: 'Customer details' });
  const cells = details.locator('.ja-descriptions-item');
  const first = await cells.nth(0).boundingBox();
  const second = await cells.nth(1).boundingBox();
  const third = await cells.nth(2).boundingBox();
  expect(Math.abs(first.y - third.y)).toBeLessThan(1);
  expect(second.x).toBeGreaterThan(first.x);
  const span = await cells.nth(3).boundingBox();
  expect(Math.abs(span.width / first.width - 2)).toBeLessThan(0.02);
  const full = await cells.nth(4).boundingBox();
  expect(Math.abs(full.width / first.width - 3)).toBeLessThan(0.02);
  await expect(cells.nth(1).locator('dd')).toHaveText('0');
  await expect(cells.nth(2).locator('dd')).toHaveText('—');
  await page.getByRole('button', { name: 'Add quota' }).click();
  await expect(cells.nth(1).locator('dd')).toHaveText('1');
  await page.getByRole('button', { name: 'Toggle details layout' }).click();
  await expect(details).toHaveClass(/vertical/);
  await page.screenshot({ path: 'test/.results/descriptions.png', animations: 'disabled' });
  await page.setViewportSize({ width: 340, height: 600 });
  const mobileFirst = await cells.nth(0).boundingBox();
  const mobileSecond = await cells.nth(1).boundingBox();
  expect(Math.abs(mobileFirst.x - mobileSecond.x)).toBeLessThan(1);
  expect(mobileSecond.y).toBeGreaterThan(mobileFirst.y);
  const mobileSpan = await cells.nth(3).boundingBox();
  expect(Math.abs(mobileSpan.width - mobileFirst.width)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Collapse supports native keyboard toggling, navigation, separate actions and accordion mode', async ({
  page,
}) => {
  await page.goto('/?case=collapse');
  const profile = page.getByRole('button', { name: 'Profile', exact: true });
  const security = page.getByRole('button', { name: 'Security', exact: true });
  await profile.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Collapse note' }).fill('Retained note');
  await page.getByRole('button', { name: 'Extra action' }).click();
  await expect(profile).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#collapse-extra')).toHaveText('1');
  await profile.focus();
  await page.keyboard.press('ArrowDown');
  await expect(security).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('region')).toHaveCount(2);
  await page.getByRole('button', { name: 'Toggle accordion' }).click();
  await expect(page.getByRole('region')).toHaveCount(1);
  await security.click();
  await expect(profile).toHaveAttribute('aria-expanded', 'false');
  await profile.click();
  await expect(page.getByRole('textbox', { name: 'Collapse note' })).toHaveValue('Retained note');
});

test('Collapse preserves keyed input on reorder and destroys it only when configured', async ({
  page,
}) => {
  await page.goto('/?case=collapse');
  const profile = page.getByRole('button', { name: 'Profile', exact: true });
  await profile.click();
  await page.getByRole('textbox', { name: 'Collapse note' }).fill('Retained');
  await page.getByRole('button', { name: 'Reverse panels' }).click();
  await expect(page.getByRole('textbox', { name: 'Collapse note' })).toHaveValue('Retained');
  await page.getByRole('button', { name: 'Toggle destroy' }).click();
  await profile.click();
  await expect(page.locator('input[aria-label="Collapse note"]')).toHaveCount(0);
  await profile.click();
  await expect(page.getByRole('textbox', { name: 'Collapse note' })).toHaveValue('');
});

test('Card loading preserves form values, hides body focus targets and keeps explicit actions working', async ({
  page,
}) => {
  await page.goto('/?case=card');
  const card = page.getByRole('region', { name: 'Account' });
  await expect(card).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Card note' });
  await input.fill('Unsaved value');
  await page.getByRole('button', { name: 'Toggle card loading' }).click();
  await expect(card).toHaveAttribute('aria-busy', 'true');
  await expect(input).toBeHidden();
  await expect(card.getByRole('status')).toHaveAccessibleName('加载中');
  await page.getByRole('button', { name: 'Card action' }).click();
  await expect(page.locator('#card-actions')).toHaveText('1');
  await page.getByRole('button', { name: 'Toggle card loading' }).click();
  await expect(input).toHaveValue('Unsaved value');
  await page.setViewportSize({ width: 340, height: 480 });
  expect(await card.evaluate((el) => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test/.results/card.png', animations: 'disabled' });
});
