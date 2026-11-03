import { test, expect } from './fixtures.mjs';

test('Menu vertical keyboard expands, skips disabled items, restores parent focus and never submits forms', async ({
  page,
}) => {
  await page.goto('/?case=menu');
  const menu = page.getByRole('menu', { name: 'Side navigation', exact: true });
  await menu.getByRole('menuitem', { name: 'Home', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  const tools = menu.getByRole('menuitem', { name: 'Tools', exact: true });
  await expect(tools).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(menu.getByRole('menuitem', { name: 'Users', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-selection')).toHaveText('roles');
  await page.keyboard.press('Escape');
  await expect(tools).toBeFocused();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['roles']);
});
test('Menu horizontal portal keyboard supports one-level Escape and leaf activation closes the popup', async ({
  page,
}) => {
  await page.goto('/?case=menu');
  const bar = page.getByRole('menubar', { name: 'Top navigation' });
  await bar.getByRole('menuitem', { name: 'Home', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(
    page
      .getByRole('menu', { name: 'Tools', exact: true })
      .getByRole('menuitem', { name: 'Users', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-menu-popup')).toHaveCount(0);
  await expect(bar.getByRole('menuitem', { name: 'Tools', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page
    .getByRole('menu', { name: 'Tools', exact: true })
    .getByRole('menuitem', { name: 'Roles', exact: true })
    .click();
  await expect(page.locator('.ja-menu-popup')).toHaveCount(0);
});

test('Dropdown ArrowUp opens the last action, skips disabled entries, and Tab exits the Portal naturally', async ({
  page,
}) => {
  await page.goto('/?case=dropdown');
  const trigger = page.getByRole('button', { name: 'Actions', exact: true });
  await trigger.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('menu', { name: 'Actions menu' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'After actions' })).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['edit']);
});
test('Dropdown disabled and hover/focus triggers behave consistently, and outside clicks keep their focus', async ({
  page,
}) => {
  await page.goto('/?case=dropdown');
  const trigger = page.getByRole('button', { name: 'Actions', exact: true });
  await page.getByRole('button', { name: 'Toggle actions disabled' }).click();
  await expect(trigger).toBeDisabled();
  await expect(page.getByRole('menu', { name: 'Actions menu' })).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Toggle actions disabled' }).click();
  await trigger.click();
  const outside = page.getByRole('button', { name: 'After actions' });
  await outside.click();
  await expect(outside).toBeFocused();
  await page.getByRole('button', { name: 'Hover trigger' }).hover();
  await expect(page.getByRole('menuitem', { name: 'Hover action' })).toBeVisible();
  await expect(outside).toBeFocused();
  await page.keyboard.press('Escape');
});
test('Dropdown nested in Modal consumes Escape and restores its trigger without dismissing the dialog', async ({
  page,
}) => {
  await page.goto('/?case=dropdowndialog');
  const trigger = page.getByRole('button', { name: 'Dialog actions' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Dialog edit' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('Breadcrumb keyboard follows real ancestor links and exposes one non-navigable current page', async ({
  page,
}) => {
  await page.goto('/?case=breadcrumb');
  const nav = page.getByRole('navigation', { name: 'Page path' });
  await expect(nav.getByRole('listitem')).toHaveCount(4);
  await expect(nav.getByRole('link')).toHaveCount(2);
  await expect(nav.locator('[aria-current=page]')).toHaveText('Ada detail');
  await expect(nav.locator('[aria-current=page]')).not.toHaveAttribute('href');
  const projects = nav.getByRole('link', { name: 'Projects path' });
  await projects.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#projects$/);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['projects']);
  await expect(nav.getByText('Blocked path', { exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});
test('Breadcrumb long labels wrap within narrow containers while separators stay decorative', async ({
  page,
}) => {
  await page.goto('/?case=breadcrumb');
  await page.setViewportSize({ width: 320, height: 600 });
  const nav = page.getByRole('navigation', { name: 'Page path' });
  await expect(nav.locator('.ja-breadcrumb-separator[aria-hidden=true]')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Tabs keyboard wraps, skips disabled tabs, exposes linked panels and never submits its form', async ({
  page,
}) => {
  await page.goto('/?case=tabslab');
  const overview = page.getByRole('tab', { name: 'Overview' });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Settings' })).toHaveText('Settings content');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'History' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(overview).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel', { name: 'Overview' })).toBeFocused();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
});
test('Tabs vertical manual activation moves focus independently and Space activates', async ({
  page,
}) => {
  await page.goto('/?case=tabslab');
  await page.getByRole('button', { name: 'Toggle vertical tabs' }).click();
  await page.getByRole('button', { name: 'Toggle manual tabs' }).click();
  const overview = page.getByRole('tab', { name: 'Overview' });
  const settings = page.getByRole('tab', { name: 'Settings' });
  await overview.focus();
  await page.keyboard.press('ArrowDown');
  await expect(settings).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Space');
  await expect(settings).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  const geometry = await page.evaluate(() => {
    const tab = document.querySelector('.ja-tab-item.active').getBoundingClientRect();
    const indicator = document.querySelector('.indicator').getBoundingClientRect();
    return Math.abs(tab.top - indicator.top) + Math.abs(tab.height - indicator.height);
  });
  // CSS indicator transitions are verified after reaching the final position.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const tab = document.querySelector('.ja-tab-item.active').getBoundingClientRect();
        const bar = document.querySelector('.indicator').getBoundingClientRect();
        return Math.abs(tab.top - bar.top) + Math.abs(tab.height - bar.height);
      }),
    )
    .toBeLessThanOrEqual(1);
  expect(Number.isFinite(geometry)).toBeTruthy();
});
test('Tabs preserves native draft state on revisits and destroyOnHidden opts into remounting', async ({
  page,
}) => {
  await page.goto('/?case=tabslab');
  await page.getByRole('textbox', { name: 'Overview draft' }).fill('kept draft');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Overview' }).click();
  await expect(page.getByRole('textbox', { name: 'Overview draft' })).toHaveValue('kept draft');
  await page.getByRole('button', { name: 'Toggle destroy tabs' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Overview draft', includeHidden: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Overview' }).click();
  await expect(page.getByRole('textbox', { name: 'Overview draft' })).toHaveValue('');
});
test('Tabs responds to label resizing and container overflow while remaining aligned', async ({
  page,
}) => {
  await page.goto('/?case=tabs');
  await page.getByRole('tab', { name: 'B', exact: true }).click();
  await page.evaluate(() => {
    document.querySelector('.ja-tab-item').style.paddingInline = '80px';
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const tab = document.querySelector('.ja-tab-item.active').getBoundingClientRect();
        const bar = document.querySelector('.indicator').getBoundingClientRect();
        return Math.abs(tab.left - bar.left) + Math.abs(tab.width - bar.width);
      }),
    )
    .toBeLessThanOrEqual(1);
  await page.goto('/?case=tabslab');
  await page.getByRole('button', { name: 'Narrow tabs' }).click();
  await page.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'History' })).toBeInViewport();
  await page.getByRole('button', { name: 'Toggle disabled tabs' }).click();
  await expect(page.getByRole('tab', { name: 'History' })).toBeDisabled();
});

test('Segmented uses native radio keyboard, skips disabled options and submits numeric values', async ({
  page,
}) => {
  await page.goto('/?case=segmented');
  const group = page.getByRole('radiogroup', { name: 'Report range', exact: true });
  await group.getByRole('radio', { name: 'Day', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Week', exact: true })).toBeChecked();
  await expect(group.getByRole('radio', { name: 'Week', exact: true })).toBeFocused();
  expect(await page.evaluate(() => new FormData(document.querySelector('form')).get('range'))).toBe(
    '7',
  );
  await page.getByRole('button', { name: 'Reject segmented requests' }).click();
  await group.getByRole('radio', { name: 'Day', exact: true }).click();
  await expect(group.getByRole('radio', { name: 'Week', exact: true })).toBeChecked();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([7, 0]);
  await page.getByRole('button', { name: 'Disable segmented', exact: true }).click();
  await expect(group.getByRole('radio', { name: 'Week', exact: true })).toBeDisabled();
});
test('Segmented uncontrolled form reset restores its initial selected option', async ({ page }) => {
  await page.goto('/?case=segmented');
  const group = page.getByRole('radiogroup', { name: 'Uncontrolled range' });
  await group.getByRole('radio', { name: 'Day' }).click();
  await expect(group.getByRole('radio', { name: 'Day' })).toBeChecked();
  await page.getByRole('button', { name: 'Reset segmented' }).click();
  await expect(group.getByRole('radio', { name: 'Week' })).toBeChecked();
});
test('Steps native keyboard navigation requests current step, skips disabled buttons and never submits', async ({
  page,
}) => {
  await page.goto('/?case=steps');
  const list = page.getByRole('list', { name: 'Publish workflow' });
  await list.getByRole('button', { name: /Draft/ }).focus();
  await page.keyboard.press('Space');
  await expect(list.locator('[aria-current=step]')).toContainText('Draft');
  await page.keyboard.press('Tab');
  await expect(list.getByRole('button', { name: /Review/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(list.locator('[aria-current=step]')).toContainText('Review');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Toggle step error' })).toBeFocused();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([0, 1]);
});
test('Steps exposes error text and real responsive horizontal/vertical layouts', async ({
  page,
}) => {
  await page.goto('/?case=steps');
  const list = page.getByRole('list', { name: 'Publish workflow' });
  await page.getByRole('button', { name: 'Toggle step error' }).click();
  await expect(list.locator('[aria-current=step]')).toContainText('错误');
  await expect(list.locator('li.error')).toHaveCount(1);
  expect(await list.evaluate((el) => getComputedStyle(el).flexDirection)).toBe('row');
  await page.setViewportSize({ width: 480, height: 800 });
  expect(await list.evaluate((el) => getComputedStyle(el).flexDirection)).toBe('column');
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.getByRole('button', { name: 'Toggle step direction' }).click();
  expect(await list.evaluate((el) => getComputedStyle(el).flexDirection)).toBe('column');
});
