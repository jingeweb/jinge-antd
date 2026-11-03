import { test, expect } from './fixtures.mjs';
test('Pagination keyboard changes page and size, bounds quick jumping and never submits its parent form', async ({
  page,
}) => {
  await page.goto('/?case=pagination');
  await page.getByRole('button', { name: '下一页', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[aria-current=page]')).toHaveText('4');
  await page.getByRole('combobox', { name: '每页条数' }).selectOption('20');
  await expect(page.locator('[aria-current=page]')).toHaveText('1');
  const jump = page.getByRole('textbox', { name: '跳转页码' });
  await jump.fill('99');
  await jump.press('Enter');
  await expect(page.locator('[aria-current=page]')).toHaveText('13');
  await expect(page.getByRole('button', { name: '下一页', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([
    [4, 10],
    [1, 20],
    [13, 20],
  ]);
});
test('Pagination rejects controlled page/size requests, clamps total changes and disables all editing', async ({
  page,
}) => {
  await page.goto('/?case=pagination');
  await page.getByRole('button', { name: 'Reject pages' }).click();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('[aria-current=page]')).toHaveText('3');
  await page.getByRole('combobox', { name: '每页条数' }).selectOption('50');
  await expect(page.getByRole('combobox', { name: '每页条数' })).toHaveValue('10');
  await page.getByRole('button', { name: 'Shrink total' }).click();
  await expect(page.locator('[aria-current=page]')).toHaveText('2');
  await page.getByRole('button', { name: 'Disable pages' }).click();
  await expect(page.getByRole('textbox', { name: '跳转页码' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '上一页', exact: true })).toBeDisabled();
});

test('Table keyboard sorting, filters and pagination transform local rows and retain real keyed DOM', async ({
  page,
}) => {
  await page.goto('/?case=tablelab');
  await page.getByRole('combobox', { name: '每页条数' }).selectOption('20');
  const first = page.locator('tbody .ja-table-row').first();
  await first.evaluate((el) => {
    el.dataset.original = 'user1';
  });
  await page.getByRole('button', { name: '排序 Age' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('tbody [data-column-key=name]').first()).toHaveText('User 12');
  await page.getByRole('button', { name: '排序 Age' }).press('Enter');
  await expect(page.locator('tbody [data-column-key=name]').first()).toHaveText('User 1');
  await expect(page.locator('tbody .ja-table-row').first()).toHaveAttribute(
    'data-original',
    'user1',
  );
  await page.getByRole('combobox', { name: '每页条数' }).selectOption('5');
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('[aria-current=page]')).toHaveText('2');
  await page.getByRole('combobox', { name: '筛选 Team' }).selectOption('0');
  await expect(page.locator('[aria-current=page]')).toHaveText('1');
  await expect(page.locator('tbody [data-column-key=team]')).toHaveText(['A', 'A', 'A', 'A', 'A']);
  expect(await page.evaluate(() => window.testApp.events)).not.toContain('submit');
});
test('Table selection uses native mixed/disabled states, persists across pages and can reject requests', async ({
  page,
}) => {
  await page.goto('/?case=tablelab');
  await page.getByRole('checkbox', { name: '选择行 1', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: '全选当前页' })).toHaveAttribute(
    'aria-checked',
    'mixed',
  );
  await expect(page.getByRole('checkbox', { name: '选择行 2', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await page.getByRole('checkbox', { name: '全选当前页' }).check();
  await expect(page.locator('#table-selected')).toHaveText('1,6,7,8,9,10');
  await page.getByRole('button', { name: 'Reject table requests' }).click();
  await page.getByRole('checkbox', { name: '选择行 6', exact: true }).uncheck();
  await expect(page.getByRole('checkbox', { name: '选择行 6', exact: true })).toBeChecked();
});
test('Table expanded detail links to its trigger, closes on keyboard and destroys hidden draft content', async ({
  page,
}) => {
  await page.goto('/?case=tablelab');
  const trigger = page.getByRole('button', { name: '展开行 1', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '收起行 1', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByRole('textbox', { name: 'Note for User 1' }).fill('draft');
  await page.getByRole('button', { name: '收起行 1', exact: true }).press('Space');
  await expect(page.getByRole('textbox', { name: 'Note for User 1' })).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole('textbox', { name: 'Note for User 1' })).toHaveValue('');
});
test('Table loading blocks actions, announces busy status and empty data keeps headers', async ({
  page,
}) => {
  await page.goto('/?case=tablelab');
  await page.getByRole('button', { name: 'Toggle table loading' }).click();
  await expect(page.locator('.ja-table-loading[role=status]')).toHaveText('加载中');
  await expect(page.getByRole('button', { name: '排序 Age' })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: '选择行 1', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '展开行 1', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle table loading' }).click();
  await page.getByRole('button', { name: 'Toggle table data' }).click();
  await expect(page.locator('.ja-table-empty')).toHaveText('暂无数据');
  await expect(page.getByRole('columnheader')).toHaveCount(6);
});
test('Table sticky header and multiple fixed columns follow actual scroll geometry', async ({
  page,
}) => {
  await page.goto('/?case=tablelab');
  const scroller = page.locator('.ja-table-scroll');
  await scroller.evaluate((el) => {
    el.scrollLeft = 250;
    el.scrollTop = 120;
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scroller = document.querySelector('.ja-table-scroll').getBoundingClientRect();
        const name = document.querySelector('thead [data-column-key=name]').getBoundingClientRect();
        const age = document.querySelector('thead [data-column-key=age]').getBoundingClientRect();
        const team = document.querySelector('thead [data-column-key=team]').getBoundingClientRect();
        return Math.max(
          Math.abs(name.top - scroller.top),
          Math.abs(age.left - name.right),
          Math.abs(team.right - scroller.right),
        );
      }),
    )
    .toBeLessThanOrEqual(1);
  await expect(
    page.locator('tbody .ja-table-row').first().locator('[data-column-key=name]'),
  ).toBeVisible();
});
test('Table measures sticky offsets after native table layout distributes spare column width', async ({
  page,
}) => {
  await page.goto('/?case=tablefixed');
  await page.locator('.ja-table-scroll').evaluate((el) => {
    el.scrollLeft = 200;
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const name = document.querySelector('tbody [data-column-key=name]').getBoundingClientRect();
        const age = document.querySelector('tbody [data-column-key=age]').getBoundingClientRect();
        return Math.abs(age.left - name.right);
      }),
    )
    .toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Toggle fixed loading' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const name = document.querySelector('tbody [data-column-key=name]').getBoundingClientRect();
        const age = document.querySelector('tbody [data-column-key=age]').getBoundingClientRect();
        return Math.abs(age.left - name.right);
      }),
    )
    .toBeLessThanOrEqual(1);
});
