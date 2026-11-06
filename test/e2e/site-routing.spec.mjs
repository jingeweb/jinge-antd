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
    const languageButton = page.getByRole('button', { name: language, exact: true });
    await expect(languageButton).toBeVisible();
    await expect(languageButton).toHaveAttribute('aria-haspopup', 'menu');
    const github = page.getByRole('link', { name: 'GitHub', exact: true });
    await expect(github).toHaveAttribute('href', 'https://github.com/jingeweb/jinge-antd');
    await expect(github).toHaveAttribute('target', '_blank');
    await languageButton.click();
    await expect(
      page.getByRole('menuitem', {
        name: { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English' }[locale],
        exact: true,
      }),
    ).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(languageButton).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const demo = page.locator('#button-loading');
    await demo.getByRole('button', { name: code, exact: true }).click();
    await expect(demo.locator('.shiki')).toBeVisible();
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

for (const [locale, show] of [
  ['zh-CN', '查看代码'],
  ['zh-TW', '查看代碼'],
  ['en', 'Show code'],
]) {
  test(`DatePicker ${locale} highlights all three examples after client navigation`, async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route(`${locale}/components/button`));
    await page
      .locator(`a[href="${route(`${locale}/components/date-picker`)}"]`)
      .first()
      .click();
    for (const id of ['date-picker-basic', 'range-picker-basic', 'date-picker-form']) {
      const demo = page.locator('#' + id);
      await demo.getByRole('button', { name: show, exact: true }).click();
      await expect(demo.locator('.shiki')).toBeVisible();
      await expect(demo.locator('.shiki code')).toContainText('Temporal.PlainDate');
      const colors = await demo
        .locator('.shiki span[style]')
        .evaluateAll((spans) => [...new Set(spans.map((span) => span.style.color))]);
      expect(colors.length).toBeGreaterThan(2);
    }
    expect(errors).toEqual([]);
  });
}

test('language switching replaces history without reloading; back and forward synchronize locale', async ({
  page,
}) => {
  await page.goto(route('zh-CN/components/button?section=api#api'));
  const historyLength = await page.evaluate(() => {
    window.__languageShell = document.querySelector('.docs-header');
    window.__languageDocument = document;
    return history.length;
  });
  await page.locator('.language-menu-trigger').click();
  expect(
    await page.getByRole('menuitem', { name: '简体中文', exact: true }).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + 2));
    }),
  ).toBe(true);
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}en/components/button\\?section=api#api$`));
  await expect(page.locator('#api')).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(
    await page.evaluate(
      () =>
        window.__languageDocument === document &&
        window.__languageShell === document.querySelector('.docs-header'),
    ),
  ).toBe(true);
  await expect(page.getByRole('button', { name: 'Language', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const languageBox = await page.locator('.language-menu-trigger').boundingBox();
  const githubBox = await page.getByRole('link', { name: 'GitHub', exact: true }).boundingBox();
  expect(languageBox.x).toBeLessThan(githubBox.x);
  await page.locator(`a[href="${route('en/components/tree')}"]`).click();
  await expect(page.locator('h1')).toHaveText('Tree');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Button');
  await page.locator('.language-menu-trigger').click();
  await page.getByRole('menuitem', { name: '繁體中文', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}zh-TW/components/button\\?section=api#api$`));
  await expect(page.locator('h1')).toHaveText('Button 按鈕');
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('Tree');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Button 按鈕');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  expect(
    await page.evaluate(
      () =>
        window.__languageDocument === document &&
        window.__languageShell === document.querySelector('.docs-header'),
    ),
  ).toBe(true);
  const dictionaries = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => /\/(zh-CN|zh-TW|en)-[^/]+\.js$/.test(entry.name))
      .map((entry) => entry.name),
  );
  expect(dictionaries).toHaveLength(3);
});

test('language switching recreates translated demos, source and code tools without reloading the shell', async ({
  page,
}) => {
  await page.goto(route('zh-CN/components/button'));
  await page.evaluate(() => {
    window.__languageDocument = document;
  });
  const demo = page.locator('#button-loading');
  await demo.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(demo.getByRole('status')).toContainText('1');
  await demo.getByRole('button', { name: '查看代码', exact: true }).click();
  await expect(demo.locator('.shiki')).toBeVisible();
  await page.locator('.language-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();
  await expect(demo.getByRole('status')).toContainText('0');
  await expect(demo.locator('.shiki')).toHaveCount(0);
  await expect(demo.getByRole('button', { name: 'Copy code', exact: true })).toBeVisible();
  await demo.getByRole('button', { name: 'Show code', exact: true }).click();
  await expect(demo.locator('.shiki')).toBeVisible();
  await expect(demo.locator('code')).toContainText('Save changes');
  await expect(demo.locator('code')).not.toContainText('保存更改');
  await demo.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(demo.getByRole('status')).toContainText('1');
  expect(await page.evaluate(() => window.__languageDocument === document)).toBe(true);
});

test('a slower language request cannot replace the latest choice', async ({ page }) => {
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route('**/en-*.js', async (handler) => {
    requested();
    await blocked;
    await handler.continue();
  });
  await page.goto(route('zh-CN/components/button'));
  await page.locator('.language-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await started;
  await expect(page.locator('.language-menu-trigger')).toHaveAttribute('aria-busy', 'true');
  await expect(page).toHaveURL(new RegExp(`${base}zh-CN/components/button$`));
  await expect(page.locator('h1')).toHaveText('Button 按钮');
  await page.locator('.language-menu-trigger').click();
  await page.getByRole('menuitem', { name: '繁體中文', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Button 按鈕');
  const englishResponse = page.waitForResponse((response) =>
    /\/en-[^/]+\.js$/.test(response.url()),
  );
  release();
  await englishResponse;
  // Flush the suspended import and its commit continuation.
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page).toHaveURL(new RegExp(`${base}zh-TW/components/button$`));
  await expect(page.locator('.language-menu-trigger')).toHaveAttribute('aria-busy', 'false');
});

test('failed language resources keep the current URL, translated page and demo state intact', async ({
  page,
}) => {
  await page.route('**/en-*.js', (handler) => handler.abort('failed'));
  await page.goto(route('zh-CN/components/button'));
  const demo = page.locator('#button-loading');
  await demo.getByRole('button', { name: '保存更改', exact: true }).click();
  await expect(demo.getByRole('status')).toContainText('1');
  await page.locator('.language-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('语言资源加载失败，当前语言未更改。');
  await expect(page).toHaveURL(new RegExp(`${base}zh-CN/components/button$`));
  await expect(page.locator('h1')).toHaveText('Button 按钮');
  await expect(demo.getByRole('status')).toContainText('1');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
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

for (const [locale, heading, code, setup] of [
  ['zh-CN', 'Icon 图标', '查看代码', '安装与使用'],
  ['zh-TW', 'Icon 圖標', '查看代碼', '安裝與使用'],
  ['en', 'Icon', 'Show code', 'Installation and usage'],
]) {
  test(`Icon guide ${locale} renders bundled Tailwind icons, setup and editor links`, async ({
    page,
  }) => {
    const requests = [];
    const errors = [];
    page.on('request', (request) => {
      if (/api\.iconify\.design/.test(request.url())) requests.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    if (locale === 'zh-CN') {
      await page.goto(route('zh-CN/components/button'));
      await page.locator(`a.nav-link[href="${route('zh-CN/components/icon')}"]`).click();
    } else {
      await page.goto(route(`${locale}/components/icon`));
    }
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page.locator('#setup')).toHaveText(setup);
    await expect(page.locator('.icon-guide')).toContainText('@iconify-json/ant-design');
    await expect(page.locator('.icon-guide-code .shiki')).toHaveCount(3);
    await expect(page.locator('.icon-guide-code script, .icon-guide-code button')).toHaveCount(0);
    await expect(page.locator('.icon-gallery-card')).toHaveCount(48);
    expect(
      await page.locator('.icon-gallery-glyph').evaluateAll((elements) =>
        elements.every((element) => {
          const style = getComputedStyle(element);
          return (
            (style.maskImage !== 'none' || style.backgroundImage !== 'none') &&
            parseFloat(style.width) > 0 &&
            parseFloat(style.height) > 0
          );
        }),
      ),
    ).toBe(true);
    await expect(page.locator('.api-table, .import-line')).toHaveCount(0);
    await expect(
      page.locator('a[href="https://github.com/jingeweb/vscode-extension-iconify-search"]'),
    ).toBeVisible();
    await expect(
      page.locator('a[href="https://icon-sets.iconify.design/ant-design/"]'),
    ).toBeVisible();
    await page.getByRole('button', { name: code, exact: true }).click();
    await expect(page.locator('.demo-source')).toContainText('icon-[ant-design--home-outlined]');
    await expect(page.locator('.demo-source')).not.toContainText("from 'jinge-antd'");
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    if (locale === 'zh-CN') {
      await page.getByRole('button', { name: '收起代码', exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: 'test/.results/site-icons.png', fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}

test('library language Dropdown works with keyboard on mobile and closes the navigation overlay', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route('zh-CN/components/tree?section=api'));
  await page.getByRole('button', { name: '切换组件导航' }).click();
  await expect(page.locator('.docs-sidebar')).toHaveClass(/open/);
  const selector = page.getByRole('button', { name: '语言', exact: true });
  await selector.focus();
  await selector.press('ArrowDown');
  const menu = page.getByRole('menu', { name: '语言', exact: true });
  await expect(menu).toBeVisible();
  await expect(page.locator('.docs-sidebar')).not.toHaveClass(/open/);
  await page.getByRole('menuitem', { name: '简体中文', exact: true }).press('End');
  await page.getByRole('menuitem', { name: 'English', exact: true }).press('Enter');
  await expect(page).toHaveURL(new RegExp(`${base}en/components/tree\\?section=api$`));
  await expect(page.locator('h1')).toHaveText('Tree');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('syntax highlighting loads only when expanded and retains code without executable markup', async ({
  page,
}) => {
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route('zh-CN/components/button'));
  expect(requests.filter((url) => /\/button-basic-[^/]+\.js$/.test(url))).toHaveLength(0);
  const demo = page.locator('#button-basic');
  await demo.getByRole('button', { name: '查看代码', exact: true }).click();
  await expect(demo.locator('.shiki')).toBeVisible();
  expect(
    await demo
      .locator('.shiki span[style]')
      .evaluateAll(
        (elements) => new Set(elements.map((element) => getComputedStyle(element).color)).size,
      ),
  ).toBeGreaterThan(2);
  await expect(demo.locator('code button, code script')).toHaveCount(0);
  expect(requests.filter((url) => /\/button-basic-[^/]+\.js$/.test(url))).toHaveLength(1);
  await demo.getByRole('button', { name: '收起代码', exact: true }).click();
  await demo.getByRole('button', { name: '查看代码', exact: true }).click();
  await expect(demo.locator('.shiki')).toBeVisible();
  expect(requests.filter((url) => /\/button-basic-[^/]+\.js$/.test(url))).toHaveLength(1);
  expect(requests.filter((url) => /onig|\.wasm|\/shiki\//.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test('a pending highlight request does not update a component after navigation', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route('**/button-basic-*.js', async (route) => {
    requested();
    await held;
    await route.continue();
  });
  await page.goto(route('zh-CN/components/button'));
  await page
    .locator('#button-basic')
    .getByRole('button', { name: '查看代码', exact: true })
    .click();
  await started;
  await expect(page.locator('#button-basic code')).toContainText('export function ButtonBasic()');
  await page.locator(`a.nav-link[href="${route('zh-CN/components/tree')}"]`).click();
  await expect(page.locator('h1')).toHaveText('Tree 树');
  release();
  await page.locator('#tree-basic').getByRole('button', { name: '查看代码', exact: true }).click();
  await expect(page.locator('#tree-basic .shiki')).toBeVisible();
  await expect(page.locator('.demo-source')).not.toContainText('export function ButtonBasic()');
  expect(errors).toEqual([]);
});
