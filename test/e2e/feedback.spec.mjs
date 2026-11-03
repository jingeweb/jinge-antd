import { test, expect } from './fixtures.mjs';

test('Result shows accessible error-page headings and runs explicit retry actions without stealing focus', async ({
  page,
}) => {
  await page.goto('/?case=result');
  const select = page.getByRole('combobox', { name: 'Result status' });
  await select.focus();
  await select.selectOption('404');
  await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible();
  await expect(page.locator('.ja-result-code')).toHaveText('404');
  await select.selectOption('error');
  await expect(page.getByRole('heading', { name: '操作失败' })).toBeVisible();
  await expect(select).toBeFocused();
  await page.getByRole('button', { name: 'Retry result' }).click();
  await expect(page.getByRole('heading', { name: '操作成功' })).toBeVisible();
  await expect(page.locator('#result-retries')).toHaveText('1');
  await expect(select).toHaveValue('success');
  await expect(page.locator('.ja-result')).toHaveCount(1);
  await page.setViewportSize({ width: 340, height: 600 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({ path: 'test/.results/result.png', animations: 'disabled' });
});

test('Progress updates actual line geometry and circle values, fits a narrow parent and honors reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?case=progress');
  const line = page.getByRole('progressbar', { name: 'Upload progress', exact: true });
  const circle = page.getByRole('progressbar', { name: 'Circle progress', exact: true });
  await page.getByRole('button', { name: 'Advance progress' }).click();
  await expect(line).toHaveAttribute('aria-valuenow', '50');
  const ratio = await line.evaluate(
    (el) =>
      el.querySelector('.ja-progress-bar').getBoundingClientRect().width /
      el.querySelector('.ja-progress-track').getBoundingClientRect().width,
  );
  expect(Math.abs(ratio - 0.5)).toBeLessThan(0.01);
  await expect(circle.locator('.ja-progress-path')).toHaveAttribute('stroke-dasharray', '50 100');
  expect((await circle.boundingBox()).width).toBeLessThanOrEqual(96);
  await expect(line.locator('.ja-progress-bar')).toHaveCSS('transition-duration', '0s');
  expect(
    await page
      .locator('.ja-progress.active .ja-progress-bar')
      .evaluate((el) => getComputedStyle(el, '::after').animationName),
  ).toBe('none');
  await page.getByRole('button', { name: 'Advance progress' }).click();
  await page.getByRole('button', { name: 'Advance progress' }).click();
  await expect(line).toHaveClass(/success/);
  await expect(circle).toHaveAttribute('aria-valuenow', '100');
  await page.screenshot({ path: 'test/.results/progress.png', animations: 'disabled' });
});

test('Skeleton lazily reveals content, retains edits on later loads and disables animation for reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?case=skeleton');
  const input = page.locator('input[aria-label="Skeleton field"]');
  await expect(input).toHaveCount(0);
  await expect(page.locator('.ja-skeleton-line')).toHaveCount(3);
  await expect(page.locator('.ja-skeleton-line').first()).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Toggle skeleton' }).click();
  await input.fill('Preserved draft');
  await page.getByRole('button', { name: 'Toggle skeleton' }).click();
  await expect(input).toBeHidden();
  await page.getByRole('button', { name: 'Toggle skeleton' }).click();
  await expect(input).toHaveValue('Preserved draft');
});

test('Spin overlays retained content, prevents keyboard entry while busy and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?case=spin');
  const input = page.getByRole('textbox', { name: 'Busy field' });
  await input.fill('Retained edit');
  const toggle = page.getByRole('button', { name: 'Toggle busy' });
  await toggle.click();
  await expect(page.locator('.ja-spin')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.ja-spin-content')).toHaveAttribute('inert');
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'After loading' })).toBeFocused();
  await expect(page.locator('.ja-spin [role="status"]')).toBeVisible();
  await expect(page.locator('.ja-spin-dots')).toHaveCSS('animation-name', 'none');
  await toggle.click();
  await expect(page.locator('.ja-spin-content')).not.toHaveAttribute('inert');
  await expect(input).toHaveValue('Retained edit');
  await input.focus();
  await expect(input).toBeFocused();
});

test('Alert keyboard close/restoration, independent actions and prevented close work in a browser', async ({
  page,
}) => {
  await page.goto('/?case=alert');
  const notice = page.locator('.ja-alert.info');
  await page.getByRole('button', { name: 'Retry alert' }).click();
  await expect(page.locator('#alert-retries')).toHaveText('1');
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: '关闭提示' }).focus();
  await page.keyboard.press('Enter');
  await expect(notice).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore alert' }).click();
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Keep alert' }).click();
  await expect(page.locator('.ja-alert.warning')).toBeVisible();
  await page.setViewportSize({ width: 340, height: 500 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
