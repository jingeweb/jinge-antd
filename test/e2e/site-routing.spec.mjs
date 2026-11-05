import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const base = process.env.VITE_BASE ?? '/';
const route = (path) => base + path.replace(/^\//, '');

for (const [locale, title, language, code, save] of [
  ['zh-CN', 'Button 按钮', '语言', '查看代码', '保存更改'],
  ['zh-TW', 'Button 按鈕', '語言', '查看代碼', '保存更改'],
  ['en', 'Button', 'Language', 'Show code', 'Save changes'],
]) {
  test(`HTML5 ${locale} direct route, translated documentation, runnable example and source`, async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route(`${locale}/components/button`));
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.getByRole('combobox', { name: language })).toHaveValue(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const demo = page.locator('#button-loading');
    await demo.getByRole('button', { name: code, exact: true }).click();
    await expect(demo.locator('code')).toContainText(save);
    await demo.getByRole('button', { name: save, exact: true }).click();
    await expect(demo.getByRole('button', { name: save, exact: true })).toBeDisabled();
    await expect(demo.getByRole('status')).toContainText('1');
    await page.reload();
    await expect(page.locator('h1')).toHaveText(title);
    expect(new URL(page.url()).hash).toBe('');
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name),
    );
    expect(resources.filter((url) => /\/catalog-[^/]+\.js$/.test(url))).toHaveLength(1);
    const dictionaries = resources.filter((url) => /\/(zh-CN|zh-TW|en)-[^/]+\.js$/.test(url));
    expect(dictionaries).toHaveLength(1);
    expect(dictionaries[0]).toContain('/' + locale + '-');
    expect(errors).toEqual([]);
  });
}

test('language switching preserves the component and query; router navigation preserves locale', async ({
  page,
}) => {
  await page.goto(route('zh-CN/components/button?section=api'));
  await page.locator('.language-select').selectOption('en');
  await expect(page).toHaveURL(new RegExp(`${base}en/components/button\\?section=api$`));
  await expect(page.locator('#api')).toBeVisible();
  await page.locator(`a[href="${route('en/components/tree')}"]`).click();
  await expect(page.locator('h1')).toHaveText('Tree');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Button');
  await page.locator('.language-select').selectOption('zh-TW');
  await expect(page).toHaveURL(new RegExp(`${base}zh-TW/components/button\\?section=api$`));
  await expect(page.locator('h1')).toHaveText('Button 按鈕');
});

test('legacy hash component links are normalized once to HTML5 routes', async ({ page }) => {
  await page.goto(route('#/components/tree?section=api'));
  await expect(page).toHaveURL(new RegExp(`${base}zh-CN/components/tree\\?section=api$`));
  await expect(page.locator('h1')).toHaveText('Tree 树');
});

test('Pages 404 redirects restore a deep route, query and fragment', async ({ page }) => {
  const fallback = await readFile(new URL('../.compiled/site/404.html', import.meta.url), 'utf8');
  const path = route('en/components/button?section=api#api');
  await page.route(`**${path}`, async (handler) => {
    await page.unroute(`**${path}`);
    await handler.fulfill({ status: 404, contentType: 'text/html', body: fallback });
  });
  await page.goto(path);
  await expect(page.locator('h1')).toHaveText('Button');
  await expect(page).toHaveURL(new RegExp(`${base}en/components/button\\?section=api#api$`));
});

test('unknown HTML5 routes show a localized recovery link', async ({ page }) => {
  await page.goto(route('en/not-a-page'));
  await expect(page.locator('h1')).toHaveText('Component not found');
  await page.locator('.component-page a').click();
  await expect(page.locator('h1')).toHaveText('Button');
});
