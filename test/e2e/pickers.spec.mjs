import { test, expect } from './fixtures.mjs';
test('DatePicker native calendar keyboard crosses leap month, skips disabled dates, selects once and restores focus', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab date', exact: true });
  await input.focus();
  await input.press('ArrowDown');
  await expect(page.getByRole('button', { name: '2024-02-28', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: '2024-03-01', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('2024-03-01');
  await expect(input).toBeFocused();
  await expect(page.getByRole('dialog', { name: '选择日期', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['2024-03-01']);
});
test('DatePicker validates typed dates, respects controlled rejection and does not submit on Enter', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab date', exact: true });
  await input.fill('2024-02-30');
  await input.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Submit pickers', exact: true }).click();
  expect(await page.evaluate(() => window.testApp.events)).toEqual([]);
  await input.press('Escape');
  await expect(input).toHaveValue('2024-02-28');
  await page.getByRole('button', { name: 'Reject picker requests' }).click();
  await input.fill('2024-03-05');
  await input.press('Enter');
  await expect(input).toHaveValue('2024-02-28');
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['2024-03-05']);
});
test('DatePicker year/month controls and Home/End/Page keys navigate without selecting or stealing outside focus', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab date', exact: true });
  await input.press('ArrowDown');
  await page.keyboard.press('PageDown');
  await expect(page.getByRole('button', { name: '2024-03-28', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('button', { name: '2024-03-25', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: '2024-03-31', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: '选择月份' }).selectOption('4');
  await expect(page.getByRole('button', { name: '下个月', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'After pickers' }).click();
  await expect(page.getByRole('button', { name: 'After pickers' })).toBeFocused();
  await expect(input).toHaveValue('2024-02-28');
  await expect(page.locator('.ja-picker-popup')).toHaveCount(0);
});
test('RangePicker previews a reversed interval and commits only after the second selection', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab range', exact: true });
  await input.press('ArrowDown');
  const dialog = page.getByRole('dialog', { name: '选择日期范围' });
  await expect(dialog.locator('[role=grid]')).toHaveCount(2);
  await dialog.getByRole('button', { name: '2026-11-10', exact: true }).click();
  await expect(input).toHaveValue('');
  await dialog.getByRole('button', { name: '2026-11-03', exact: true }).hover();
  await expect(dialog.locator('.in-range')).not.toHaveCount(0);
  await dialog.getByRole('button', { name: '2026-11-03', exact: true }).click();
  await expect(input).toHaveValue('2026-11-03 ~ 2026-11-10');
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['2026-11-03/2026-11-10']);
  await expect(input).toBeFocused();
});
test('RangePicker Escape and outside clicks discard partial selection; typing enforces endpoint order', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab range', exact: true });
  await input.press('ArrowDown');
  await page.getByRole('button', { name: '2026-11-10', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await input.fill('2026-11-10 ~ 2026-11-03');
  await input.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.press('Escape');
  await input.fill('2026-11-03 ~ 2026-11-04');
  await input.press('Enter');
  await expect(page.locator('#picker-range')).toHaveText('2026-11-03/2026-11-04');
});
test('TimePicker native selectors honor steps/disabled values, require confirmation and cancel drafts', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Lab time', exact: true });
  await input.press('ArrowDown');
  await expect(page.getByRole('combobox', { name: '小时' })).toBeFocused();
  const disabledHour = page.getByRole('combobox', { name: '小时' }).locator('option[value="11"]');
  // Verify native option semantics directly; this Playwright build misclassifies option disabled state.
  await expect
    .poll(() => disabledHour.evaluate((el) => el.disabled && el.matches(':disabled')))
    .toBe(true);
  await page.getByRole('combobox', { name: '分钟' }).selectOption('15');
  await expect(input).toHaveValue('10:00:00');
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(input).toHaveValue('10:15:00');
  await input.press('ArrowDown');
  await page.getByRole('combobox', { name: '分钟' }).selectOption('30');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('10:15:00');
  expect(await page.evaluate(() => window.testApp.events)).toEqual(['10:15:00']);
});
test('Pickers serialize ISO form values, reset uncontrolled defaults, and readonly/disabled fields cannot open', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const reset = page.getByRole('combobox', { name: 'Reset date' });
  await reset.fill('2026-11-04');
  await reset.press('Enter');
  await page.getByRole('button', { name: 'Reset pickers', exact: true }).click();
  await expect(reset).toHaveValue('2026-11-03');
  expect(
    await page.evaluate(() => Object.fromEntries(new FormData(document.querySelector('form')))),
  ).toEqual({ date: '2024-02-28', range: '', time: '10:00:00', resetDate: '2026-11-03' });
  await page.getByRole('button', { name: 'Readonly date picker' }).click();
  await page.getByRole('combobox', { name: 'Lab date', exact: true }).click();
  await expect(page.locator('.ja-picker-popup')).toHaveCount(0);
  await page.getByRole('button', { name: 'Disable date picker' }).click();
  await expect(page.getByRole('combobox', { name: 'Lab date', exact: true })).toBeDisabled();
});
test('Picker popup Escape stays within its parent modal and returns focus before the modal can close', async ({
  page,
}) => {
  await page.goto('/?case=pickermodal');
  await page.getByRole('button', { name: 'Open date modal' }).click();
  const input = page.getByRole('combobox', { name: 'Modal date' });
  await input.press('ArrowDown');
  await expect(page.getByRole('dialog', { name: '选择日期', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '选择日期', exact: true })).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Date dialog', exact: true })).toBeVisible();
});
test('DatePicker Tab exits the last calendar control into the natural trigger tab sequence', async ({
  page,
}) => {
  await page.goto('/?case=pickers');
  const input = page.getByRole('combobox', { name: 'Reset date' });
  await input.press('ArrowDown');
  await page.getByRole('button', { name: '今天', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Reject picker requests' })).toBeFocused();
  await expect(page.locator('.ja-picker-popup')).toHaveCount(0);
});
test('Missing native Temporal disables pickers explicitly and never loads a polyfill', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(globalThis, 'Temporal');
  });
  await page.goto('/?case=pickerunsupported');
  await expect(page.getByRole('alert')).toContainText('Temporal');
  await expect(page.getByRole('combobox', { name: 'Unsupported date' })).toBeDisabled();
  expect(await page.evaluate(() => typeof globalThis.Temporal)).toBe('undefined');
});
