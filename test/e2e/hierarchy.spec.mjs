import { test, expect } from './fixtures.mjs';
const tree = (page) => page.getByRole('tree', { name: '团队树' });
const node = (page, name) => tree(page).getByRole('treeitem', { name, exact: true });
const combo = (page) => page.getByRole('combobox', { name: '地区', exact: true });
const option = (page, name) => page.getByRole('option', { name, exact: true });
test('Tree keyboard expands, skips disabled nodes, checks with mixed ancestors and keeps a single Tab stop', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await node(page, '团队').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(node(page, '开发')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(node(page, '团队')).toHaveAttribute('aria-checked', 'mixed');
  await page.keyboard.press('ArrowDown');
  await expect(node(page, '运维')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(node(page, '团队')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(node(page, '远程团队')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '树之后', exact: true })).toBeFocused();
  await expect(page.locator('#tree-submit')).toHaveText('0');
});
test('Tree pointer selection, controlled refusal and stable DOM during reorder work with title slots', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await page.getByRole('button', { name: '展开 团队', exact: true }).click();
  await node(page, '开发').click();
  await node(page, '运维').click();
  await expect(page.locator('#tree-selected')).toHaveText('[0,"ops"]');
  await node(page, '开发').evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await page.getByRole('button', { name: '重排团队', exact: true }).click();
  await expect(node(page, '开发')).toHaveAttribute('data-identity', 'kept');
  await expect(node(page, '开发')).toContainText('· 团队');
  await page.getByRole('button', { name: '切换树接收', exact: true }).click();
  await node(page, '开发').click();
  await expect(page.locator('#tree-selected')).toHaveText('[0,"ops"]');
});
test('Tree filtering retains matching ancestors and clearing restores the user expansion', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await page.getByRole('textbox', { name: '筛选团队', exact: true }).fill('运维');
  await expect(node(page, '运维')).toBeVisible();
  await expect(node(page, '团队')).toHaveAttribute('aria-expanded', 'true');
  await expect(node(page, '开发')).toHaveCount(0);
  await page.getByRole('textbox', { name: '筛选团队', exact: true }).clear();
  await expect(node(page, '运维')).toHaveCount(0);
});
test('Tree lazy loading reports errors, retries and exposes loaded children to keyboard navigation', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await node(page, '远程团队').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tree(page).getByRole('alert')).toContainText('加载失败');
  await page.keyboard.press('ArrowRight');
  await expect(node(page, '远程成员')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(node(page, '远程成员')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tree-selected')).toHaveText('["remote-child"]');
});
test('Tree external collapse restores focused descendant to the parent without stealing outside focus', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await node(page, '团队').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (el) => el.textContent === '外部收起团队',
    );
    button.click();
  });
  await expect(node(page, '团队')).toBeFocused();
  await page.getByRole('button', { name: '树之后', exact: true }).click();
  await page.getByRole('textbox', { name: '筛选团队', exact: true }).fill('开发');
  await expect(page.getByRole('textbox', { name: '筛选团队', exact: true })).toBeFocused();
});
test('Tree disabled interactions and narrow content keep labels and controls within their container', async ({
  page,
}) => {
  await page.goto('/?case=treelab');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('button', { name: '切换树禁用', exact: true }).click();
  await expect(node(page, '团队')).toHaveAttribute('aria-disabled', 'true');
  await node(page, '团队').dispatchEvent('click');
  await expect(page.locator('#tree-selected')).toHaveText('[]');
  expect(await tree(page).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
test('Cascader native validation, keyboard path selection, canonical FormData and reset preserve numeric zero', async ({
  page,
}) => {
  await page.goto('/?case=cascaderlab');
  await page.getByRole('button', { name: '提交地区', exact: true }).click();
  await expect(combo(page)).toBeFocused();
  await expect(combo(page)).toHaveAttribute('aria-invalid', 'true');
  await combo(page).press('ArrowDown');
  await combo(page).press('ArrowRight');
  await combo(page).press('ArrowRight');
  await combo(page).press('Enter');
  await expect(combo(page)).toHaveValue('浙江 / 杭州 / 西湖');
  await expect(page.locator('#cascader-submit')).toHaveText('0');
  expect(await page.locator('form').evaluate((el) => new FormData(el).get('location'))).toBe(
    '["zj","hz",0]',
  );
  await page.getByRole('button', { name: '重置地区', exact: true }).click();
  await expect(combo(page)).toHaveValue('');
});
test('Cascader intermediate selection, clear and controlled rejection keep actual parent values', async ({
  page,
}) => {
  await page.goto('/?case=cascaderlab');
  await page.getByRole('button', { name: '切换中间级选择', exact: true }).click();
  await combo(page).click();
  await option(page, '浙江').click();
  await expect(page.locator('#cascader-value')).toHaveText('["zj"]');
  await expect(combo(page)).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: '级联之后', exact: true }).click();
  await page.getByRole('button', { name: '切换级联接收', exact: true }).click();
  await page.getByRole('button', { name: '清空级联选择', exact: true }).click();
  await expect(page.locator('#cascader-value')).toHaveText('["zj"]');
  await page.getByRole('button', { name: '切换级联只读', exact: true }).click();
  await combo(page).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});
test('Cascader search matches paths outside the browsed branch and Tab leaves the popup naturally', async ({
  page,
}) => {
  await page.goto('/?case=cascaderlab');
  await combo(page).fill('江苏 南京');
  await expect(option(page, '江苏 / 南京')).toBeVisible();
  await expect(option(page, '浙江')).toHaveCount(0);
  await combo(page).press('Enter');
  await expect(combo(page)).toHaveValue('江苏 / 南京');
  await combo(page).click();
  await combo(page).press('Tab');
  await expect(page.getByRole('button', { name: '清空级联选择', exact: true })).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});
test('Cascader lazy options retry a failure and commit newly loaded paths', async ({ page }) => {
  await page.goto('/?case=cascaderlab');
  await combo(page).click();
  await option(page, '远程').click();
  await expect(page.getByRole('alert')).toContainText('地区加载失败');
  await page.getByRole('button', { name: '重试加载 远程', exact: true }).click();
  await expect(option(page, '远程 / 远程子项')).toBeVisible();
  await option(page, '远程 / 远程子项').click();
  await expect(combo(page)).toHaveValue('远程 / 远程子项');
});
test('Cascader popup inside Modal consumes one Escape and preserves its parent dialog and trigger focus', async ({
  page,
}) => {
  await page.goto('/?case=cascaderdialog');
  await page.getByRole('button', { name: '打开地区弹窗', exact: true }).click();
  const field = page.getByRole('combobox', { name: '弹窗地区', exact: true });
  await field.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await field.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: '选择地区', exact: true })).toBeVisible();
  await expect(field).toBeFocused();
  await field.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('Cascader columns scroll inside a narrow viewport while disabled controls cannot open', async ({
  page,
}) => {
  await page.goto('/?case=cascaderlab');
  await page.setViewportSize({ width: 390, height: 800 });
  await combo(page).click();
  await option(page, '浙江').click();
  await option(page, '浙江 / 杭州').click();
  const popup = page.getByRole('listbox');
  await expect(page.locator('.ja-cascader-column')).toHaveCount(3);
  await expect
    .poll(async () => {
      const bounds = await popup.boundingBox();
      return bounds.x >= 0 && bounds.x + bounds.width <= 390;
    })
    .toBe(true);
  expect(
    await page.locator('.ja-cascader-columns').evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true);
  await page.getByRole('button', { name: '级联之后', exact: true }).click();
  await page.getByRole('button', { name: '切换级联禁用', exact: true }).click();
  await expect(combo(page)).toBeDisabled();
});
