import { test, expect } from './fixtures.mjs';

test('Select listbox keeps focus, skips disabled choices and restores rejected owners', async ({
  page,
}) => {
  await page.goto('/?case=select');
  const owner = page.getByRole('combobox', { name: 'Owner', exact: true });
  await owner.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  const id = await owner.getAttribute('aria-activedescendant');
  await expect(page.locator(`[id="${id}"]`)).toHaveAttribute('aria-label', 'Two');
  await page.keyboard.press('Enter');
  await expect(owner).toHaveText('Two');
  await expect(owner).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  const rejected = page.getByRole('combobox', { name: 'Rejected' });
  await rejected.click();
  await page.getByRole('option', { name: 'Two', exact: true }).click();
  await expect(rejected).toHaveText('Zero');
});

test('Select multiple searches groups, stays open, removes chips and preserves its input identity', async ({
  page,
}) => {
  await page.goto('/?case=select');
  const input = page.getByRole('combobox', { name: 'Features' });
  await input.evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await input.fill('tw');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('group', { name: 'Numbers' })).toBeVisible();
  await page.getByRole('option', { name: 'Two', exact: true }).click();
  await expect(input).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  await expect(page.getByRole('button', { name: '移除 Two' })).toBeVisible();
  await input.press('Backspace');
  await expect(page.getByRole('button', { name: '移除 Two' })).toHaveCount(0);
  await expect(input).toHaveAttribute('data-identity', 'kept');
  await input.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: '移除 Zero' }).click();
  await expect(input).toBeFocused();
});

test('Select required validation focuses its combobox and FormData/reset honor controlled/default values', async ({
  page,
}) => {
  await page.goto('/?case=select');
  const owner = page.getByRole('combobox', { name: 'Owner', exact: true });
  await page.getByRole('button', { name: 'Submit select form' }).click();
  await expect(owner).toBeFocused();
  await expect(owner).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
  await owner.click();
  await page.getByRole('option', { name: 'Zero', exact: true }).click();
  const features = page.getByRole('combobox', { name: 'Features' });
  await features.fill('tw');
  await page.getByRole('option', { name: 'Two', exact: true }).click();
  await features.press('Escape');
  await page.getByRole('button', { name: 'Reset select form' }).click();
  await expect(owner).toHaveText('Zero');
  await expect(page.getByRole('button', { name: '移除 Two' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit select form' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual([
    ['owner', '0'],
    ['features', '0'],
  ]);
});

test('Select nested in Modal closes only its popup on Escape and preserves modal focus containment', async ({
  page,
}) => {
  await page.goto('/?case=selectdialog');
  const combo = page.getByRole('combobox', { name: 'Dialog choice' });
  await combo.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(combo).toBeFocused();
  await combo.click();
  await page.getByRole('option', { name: 'Dialog Beta' }).click();
  await expect(combo).toHaveText('Dialog Beta');
});

test('AutoComplete preserves free text and native form semantics, selects values by keyboard and clears accessibly', async ({
  page,
}) => {
  await page.goto('/?case=autocomplete');
  const contact = page.getByRole('combobox', { name: 'Contact', exact: true });
  await contact.evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await contact.fill('Free text');
  await contact.press('Escape');
  await page.getByRole('button', { name: 'Submit suggestions' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'submit',
    data: [['contact', 'Free text']],
  });
  await contact.fill('gra');
  await expect(page.getByRole('option', { name: 'Grace' })).toBeVisible();
  await contact.press('Enter');
  await expect(contact).toHaveValue('grace@example.com');
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute('data-identity', 'kept');
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'select',
    value: 'grace@example.com',
  });
  await page
    .locator('.ja-autocomplete')
    .filter({ has: contact })
    .getByRole('button', { name: '清空输入' })
    .click();
  await expect(contact).toHaveValue('');
  await page.getByRole('button', { name: 'Submit suggestions' }).click();
  await expect(contact).toBeFocused();
  await contact.fill('Changed');
  await contact.press('Escape');
  await page.getByRole('button', { name: 'Reset suggestions' }).click();
  await expect(contact).toHaveValue('');
});

test('AutoComplete remote result replacement keeps native input, loading hides stale options and Tab exits normally', async ({
  page,
}) => {
  await page.goto('/?case=autocomplete');
  const owned = page.getByRole('combobox', { name: 'Owned text' });
  await owned.fill('ad');
  await expect(page.getByRole('option', { name: 'Ada', exact: true })).toBeVisible();
  await owned.press('Escape');
  await page.getByRole('button', { name: 'Replace suggestions' }).click();
  await owned.click();
  await expect(page.getByRole('option', { name: 'Remote', exact: true })).toBeVisible();
  await owned.press('Escape');
  await page.getByRole('button', { name: 'Toggle suggestions loading' }).click();
  await owned.click();
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('加载中…');
  await owned.press('Tab');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(owned).not.toBeFocused();
  await expect(owned).toHaveValue('ad');
});

test('AutoComplete composition commits once and suppresses suggestion selection by IME Enter', async ({
  page,
}) => {
  await page.goto('/?case=autocomplete');
  const contact = page.getByRole('combobox', { name: 'Contact', exact: true });
  await contact.evaluate((el) => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.value = '中文';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
    );
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  await expect(contact).toHaveValue('中文');
  expect(await page.evaluate(() => window.testApp.events)).toEqual([
    { type: 'change', value: '中文' },
  ]);
});

test('Select popup matches trigger width and keyboard scroll keeps the active option visible in a long list', async ({
  page,
}) => {
  await page.goto('/?case=selectlong');
  const combo = page.getByRole('combobox', { name: 'Long choices' });
  await combo.click();
  const popup = page.getByRole('listbox');
  await expect.poll(async () => (await popup.boundingBox()).width).toBe(220);
  await combo.press('End');
  const active = page.getByRole('option', { name: 'Item 79', exact: true });
  await expect(combo).toHaveAttribute('aria-activedescendant', await active.getAttribute('id'));
  await expect.poll(() => popup.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const itemBox = await active.boundingBox(),
    listBox = await popup.boundingBox();
  expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(listBox.y + listBox.height + 1);
  await combo.press('Enter');
  await expect(combo).toHaveText('Item 79');
  await combo.click();
  await combo.press('ArrowUp');
  await combo.press('Enter');
  await expect(combo).toHaveText('Item 77');
});
