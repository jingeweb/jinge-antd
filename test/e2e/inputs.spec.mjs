import { test, expect } from './fixtures.mjs';

test('InputNumber steps decimals, commits precision/bounds and clears to an empty value', async ({
  page,
}) => {
  await page.goto('/?case=number');
  const field = page.getByRole('spinbutton', { name: 'Amount' });
  await field.focus();
  await field.press('ArrowUp');
  await expect(field).toHaveValue('0.2');
  await page.getByRole('button', { name: '增加数值' }).click();
  await expect(field).toHaveValue('0.3');
  await field.fill('1.005');
  await field.press('Enter');
  await expect(field).toHaveValue('1.01');
  await field.fill('20');
  await page.getByRole('button', { name: 'Submit number form' }).focus();
  await expect(field).toHaveValue('10');
  await field.fill('');
  await expect
    .poll(() => page.evaluate(() => window.testApp.events.at(-1)))
    .toEqual({ type: 'number', value: null });
  await page.getByRole('button', { name: 'Submit number form' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'submit',
    data: [['amount', '']],
  });
  await page.getByRole('button', { name: 'Reset number form' }).click();
  await expect(field).toHaveValue('0.1');
});

test('InputNumber incomplete native number drafts do not emit empty or zero', async ({ page }) => {
  await page.goto('/?case=number');
  const field = page.getByRole('spinbutton', { name: 'Amount' });
  await field.focus();
  await field.press('ControlOrMeta+A');
  await field.press('-');
  expect(await field.evaluate((el) => el.validity.badInput)).toBe(true);
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
  await page.getByRole('button', { name: 'Submit number form' }).focus();
  await expect(field).toHaveValue('0.1');
});

test('Password visibility keeps its native value/selection, supports keyboard toggling and sets autocomplete', async ({
  page,
}) => {
  await page.goto('/?case=password');
  const field = page.getByLabel('Account password');
  await expect(field).toHaveAttribute('type', 'password');
  await expect(field).toHaveAttribute('autocomplete', 'current-password');
  await field.focus();
  await field.evaluate((el) => {
    el.setSelectionRange(2, 5);
    el.dataset.identity = 'kept';
  });
  await page.getByRole('button', { name: '显示密码' }).click();
  await expect(field).toHaveAttribute('type', 'text');
  await expect(field).toHaveAttribute('data-identity', 'kept');
  await expect(field).toBeFocused();
  expect(await field.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([2, 5]);
  const toggle = page.getByRole('button', { name: '隐藏密码' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(field).toHaveAttribute('type', 'password');
  await expect(field).toHaveValue('Example123');
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
});

test('TextArea autoSize grows, caps and scrolls, then shrinks without replacing its native node', async ({
  page,
}) => {
  await page.goto('/?case=textarea');
  const field = page.getByRole('textbox', { name: 'Multiline notes' });
  const initial = (await field.boundingBox()).height;
  await field.evaluate((el) => {
    el.dataset.identity = 'kept';
  });
  await field.fill('One\nTwo\nThree\nFour\nFive\nSix\nSeven');
  await expect.poll(async () => (await field.boundingBox()).height).toBeGreaterThan(initial);
  await expect(field).toHaveCSS('overflow-y', 'auto');
  expect((await field.boundingBox()).height).toBeLessThanOrEqual(100);
  expect(await field.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await page.setViewportSize({ width: 340, height: 500 });
  await expect(field).toHaveAttribute('data-identity', 'kept');
  await page.getByRole('button', { name: '清空输入' }).click();
  await expect(field).toHaveValue('');
  await expect
    .poll(async () => (await field.boundingBox()).height)
    .toBeLessThanOrEqual(initial + 1);
  await expect(page.locator('.ja-input-count')).toHaveText('0 / 200');
});

test('Input retains node/focus across affixes, clears without submitting and exposes counts/ARIA', async ({
  page,
}) => {
  await page.goto('/?case=input');
  const field = page.getByRole('textbox', { name: 'Customer name' });
  await field.fill('Edited');
  await field.evaluate((el) => {
    el.dataset.identity = 'kept';
    el.setSelectionRange(1, 3);
  });
  await page.evaluate(() => {
    window.testApp.inputLab.prefix = '€';
  });
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('data-identity', 'kept');
  expect(await field.evaluate((el) => el.selectionStart)).toBe(1);
  await page.getByRole('button', { name: '清空输入' }).click();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  await expect(page.locator('.ja-input-count')).toHaveText('0 / 20');
  expect(
    await page.evaluate(() => window.testApp.events.some((event) => event.type === 'submit')),
  ).toBe(false);
});

test('Input participates in native FormData/reset and controlled owner propagation', async ({
  page,
}) => {
  await page.goto('/?case=input');
  const field = page.getByRole('textbox', { name: 'Customer name' });
  await field.fill('Accepted');
  await page.getByRole('textbox', { name: 'Uncontrolled note' }).fill('Changed note');
  await page.getByRole('button', { name: 'Reset input form' }).click();
  await expect(field).toHaveValue('Accepted');
  await expect(page.getByRole('textbox', { name: 'Uncontrolled note' })).toHaveValue('Initial');
  await page.getByRole('button', { name: 'Submit input form' }).click();
  expect(await page.evaluate(() => window.testApp.events.at(-1))).toEqual({
    type: 'submit',
    data: [
      ['customer', 'Accepted'],
      ['note', 'Initial'],
    ],
  });
});

test('Input composition events commit once and suppress composition Enter', async ({ page }) => {
  await page.goto('/?case=input');
  await page.getByRole('textbox', { name: 'Customer name' }).evaluate((el) => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.value = '中文';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: '中文' }));
    el.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', isComposing: true }),
    );
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '中文' }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: '中文' }));
  });
  await expect(page.getByRole('textbox', { name: 'Customer name' })).toHaveValue('中文');
  expect(await page.evaluate(() => window.testApp.events)).toEqual([
    { type: 'change', value: '中文' },
  ]);
});
