import { test, expect } from './fixtures.mjs';
async function fillAccount(page) {
  await page.getByRole('textbox', { name: 'Account name', exact: true }).fill('  Ada  ');
  await page.getByLabel('Account password', { exact: true }).fill('secret');
  await page.getByLabel('Confirm password', { exact: true }).fill('secret');
}
test('Form invalid submission connects label/help/errors, focuses the first field and checks dependencies', async ({
  page,
}) => {
  await page.goto('/?case=form');
  const name = page.getByRole('textbox', { name: 'Account name', exact: true });
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('Name short', { exact: true })).toBeVisible();
  await expect(name).toBeFocused();
  const ids = (await name.getAttribute('aria-describedby')).split(' ');
  expect(ids.length).toBe(2);
  for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  await fillAccount(page);
  const confirm = page.getByLabel('Confirm password', { exact: true });
  await confirm.blur();
  await page.getByLabel('Account password', { exact: true }).fill('changed');
  await expect(page.getByText('Passwords differ', { exact: true })).toBeVisible();
  await expect(confirm).toHaveAttribute('aria-invalid', 'true');
  await confirm.fill('changed');
  await expect(page.getByText('Passwords differ', { exact: true })).toHaveCount(0);
});
test('Form commits transformed mixed values, deduplicates submit events and disables fields while saving', async ({
  page,
}) => {
  await page.goto('/?case=form');
  await fillAccount(page);
  await page.getByRole('combobox', { name: 'Account role' }).click();
  await page.getByRole('option', { name: 'Editor', exact: true }).click();
  await page.getByRole('switch', { name: 'Account enabled' }).uncheck();
  await page.getByRole('form', { name: 'Account form' }).evaluate((form) => {
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('textbox', { name: 'Account name', exact: true })).toBeDisabled();
  await expect(page.locator('#save-count')).toHaveText('1');
  await expect(page.locator('#save-message')).toHaveText('Saved Ada');
  const starts = await page.evaluate(() =>
    window.testApp.events.filter((event) => event.type === 'start'),
  );
  expect(starts).toHaveLength(1);
  expect(starts[0].data).toMatchObject({ name: 'Ada', role: 'editor', enabled: false });
  await expect(page.getByRole('textbox', { name: 'Account name', exact: true })).toBeEnabled();
});
test('Form reset restores controlled text/Select/Switch and dynamic notes discard their draft', async ({
  page,
}) => {
  await page.goto('/?case=form');
  await fillAccount(page);
  await page.getByRole('button', { name: 'Toggle account note' }).click();
  await page.getByRole('textbox', { name: 'Account note' }).fill('Draft');
  await page.getByRole('button', { name: 'Toggle account note' }).click();
  await page.getByRole('button', { name: 'Toggle account note' }).click();
  await expect(page.getByRole('textbox', { name: 'Account note' })).toHaveValue('');
  await page.getByRole('combobox', { name: 'Account role' }).click();
  await page.getByRole('option', { name: 'Editor', exact: true }).click();
  await page.getByRole('switch', { name: 'Account enabled' }).uncheck();
  await page.getByRole('button', { name: 'Reset account' }).click();
  await expect(page.getByRole('textbox', { name: 'Account name', exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Account role' })).toHaveText('Viewer');
  await expect(page.getByRole('switch', { name: 'Account enabled' })).toBeChecked();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('Form submit failure is announced and a later retry succeeds', async ({ page }) => {
  await page.goto('/?case=form');
  await fillAccount(page);
  await page.getByRole('button', { name: 'Toggle save failure' }).click();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByRole('alert')).toHaveText('Save failed');
  await page.getByRole('button', { name: 'Toggle save failure' }).click();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.locator('#save-message')).toHaveText('Saved Ada');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('Form stale async validation never restores an old error after the latest result succeeds', async ({
  page,
}) => {
  await page.goto('/?case=formrace');
  const input = page.getByRole('textbox', { name: 'Async name' });
  await input.fill('old');
  await expect(page.getByRole('status')).toHaveText('校验中…');
  await input.fill('new');
  await page.getByRole('button', { name: 'Accept latest' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reject old' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(input).toHaveValue('new');
});
test('Form dynamic names keep the native node, preserve drafts and optionally discard on unmount', async ({
  page,
}) => {
  await page.goto('/?case=formdynamic');
  const input = page.getByRole('textbox', { name: 'Current field' });
  const initialId = await input.getAttribute('id');
  await input.evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await input.fill('Edited first');
  await page.getByRole('button', { name: 'Swap field' }).click();
  await expect(input).toHaveValue('Second');
  await expect(input).toHaveAttribute('id', initialId);
  await expect(input).toHaveAttribute('data-identity', 'kept');
  await input.fill('Edited second');
  await page.getByRole('button', { name: 'Swap field' }).click();
  await expect(input).toHaveValue('Edited first');
  await page.getByRole('button', { name: 'Toggle field' }).click();
  await page.getByRole('button', { name: 'Toggle field' }).click();
  await expect(input).toHaveValue('Edited first');
  await page.getByRole('button', { name: 'Discard on unmount' }).click();
  await page.getByRole('button', { name: 'Toggle field' }).click();
  await page.getByRole('button', { name: 'Toggle field' }).click();
  await expect(input).toHaveValue('');
});

test('Form horizontal labels switch to a narrow layout without overflowing the viewport', async ({
  page,
}) => {
  await page.goto('/?case=form');
  const field = page.locator('.ja-form-field').first();
  await expect(field).toHaveCSS('display', 'grid');
  await page.setViewportSize({ width: 420, height: 800 });
  await expect(field).toHaveCSS('display', 'block');
  const label = await field.locator('label').boundingBox();
  const input = await field.locator('input').boundingBox();
  expect(input.y).toBeGreaterThanOrEqual(label.y + label.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Form generated control ids are unique and native label activation focuses the control', async ({
  page,
}) => {
  await page.goto('/?case=form');
  const name = page.getByRole('textbox', { name: 'Account name', exact: true });
  const labelIds = await page
    .locator('label[for]')
    .evaluateAll((labels) => labels.map((label) => label.htmlFor));
  expect(new Set(labelIds).size).toBe(labelIds.length);
  await page
    .locator('label')
    .filter({ hasText: /^Account name$/ })
    .click();
  await expect(name).toBeFocused();
});
