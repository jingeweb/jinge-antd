import { test, expect } from './fixtures.mjs';
const text = (name, body = 'hello') => ({
  name,
  mimeType: 'text/plain',
  buffer: Buffer.from(body),
});
const root = (page) => page.locator('.ja-upload').first();
test('Upload native keyboard chooser, progress, raw file and repeated filename selection work without form submission', async ({
  page,
}) => {
  await page.goto('/?case=upload');
  const trigger = page.getByRole('button', { name: '上传附件', exact: true });
  await trigger.focus();
  const chooser = page.waitForEvent('filechooser');
  await trigger.press('Enter');
  await (await chooser).setFiles(text('report.txt'));
  await expect(root(page).getByRole('progressbar')).toBeVisible();
  await expect(page.locator('#upload-raw')).toHaveText('report.txt:1');
  await expect(root(page)).toContainText('上传完成');
  await root(page).locator('input[type=file]').setInputFiles(text('report.txt'));
  await expect(root(page).locator('.ja-upload-item')).toHaveCount(2);
  await expect(page.locator('#upload-submit')).toHaveText('0');
});
test('Upload drag/drop applies validation and does not navigate the document', async ({ page }) => {
  await page.goto('/?case=upload');
  const transfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['hi'], 'drop.txt', { type: 'text/plain' }));
    return dt;
  });
  const trigger = page.getByRole('button', { name: '上传附件', exact: true });
  await trigger.dispatchEvent('dragenter', { dataTransfer: transfer });
  await expect(trigger).toHaveClass(/dragging/);
  await trigger.dispatchEvent('drop', { dataTransfer: transfer });
  await expect(trigger).not.toHaveClass(/dragging/);
  await expect(root(page)).toContainText('drop.txt');
  await root(page).locator('input').setInputFiles(text('bad.pdf'));
  await expect(page.locator('#upload-reject')).toHaveText('bad.pdf:accept');
  await root(page).locator('input').setInputFiles(text('big.txt', '1234567890123'));
  await expect(page.locator('#upload-reject')).toHaveText('big.txt:size');
  await expect(page).toHaveURL(/case=upload/);
  await transfer.dispose();
});
test('Upload failure, retry, cancel and removal manage the active request', async ({ page }) => {
  await page.goto('/?case=upload');
  await root(page).locator('input').setInputFiles(text('fail.txt'));
  await expect(root(page).getByRole('alert')).toHaveText('模拟网络失败');
  await page.getByRole('button', { name: '重试 fail.txt', exact: true }).click();
  await expect(root(page)).toContainText('上传完成');
  await root(page).locator('input').setInputFiles(text('cancel.txt'));
  await page.getByRole('button', { name: '取消 cancel.txt', exact: true }).click();
  await expect(root(page)).toContainText('已取消');
  await page.getByRole('button', { name: '移除 cancel.txt', exact: true }).click();
  await expect(root(page)).not.toContainText('cancel.txt');
});
test('Upload controlled owner can reject selection and external removal prevents stale updates', async ({
  page,
}) => {
  await page.goto('/?case=upload');
  await page.getByRole('button', { name: '切换列表接收' }).click();
  await root(page).locator('input').setInputFiles(text('rejected.txt'));
  await expect(root(page).locator('li')).toHaveCount(0);
  await expect(page.locator('#upload-raw')).toHaveText('');
  await page.getByRole('button', { name: '切换列表接收' }).click();
  await root(page).locator('input').setInputFiles(text('remove.txt'));
  await expect(root(page).getByRole('progressbar')).toBeVisible();
  await page.getByRole('button', { name: '外部移除文件' }).click();
  await expect(root(page).locator('li')).toHaveCount(0);
  await expect(page.locator('#upload-event')).toHaveText('start');
});
test('Upload manual XHR sends multipart data and headers, handles HTTP errors and retries', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/upload-test', async (route) => {
    const req = route.request();
    attempts++;
    expect(req.method()).toBe('POST');
    expect(req.headers()['x-upload-test']).toBe('yes');
    const body = req.postDataBuffer().toString();
    expect(body).toContain('name="attachment"');
    expect(body).toContain('filename="send.txt"');
    expect(body).toContain('name="category"');
    expect(body).toContain('report');
    expect(body).toContain('name="metadata"');
    expect(body).toContain('meta');
    await route.fulfill({
      status: attempts === 1 ? 503 : 200,
      contentType: 'application/json',
      body: '{"id":1}',
    });
  });
  await page.goto('/?case=upload');
  const manual = page.locator('.ja-upload').nth(1);
  await manual.locator('input').setInputFiles(text('send.txt'));
  expect(attempts).toBe(0);
  await manual.getByRole('button', { name: '上传 send.txt', exact: true }).click();
  await expect(manual.getByRole('alert')).toHaveText('上传失败 (503)');
  await manual.getByRole('button', { name: '重试 send.txt', exact: true }).click();
  await expect(manual).toContainText('上传完成');
  expect(attempts).toBe(2);
});
test('Upload disabled native controls, natural Tab navigation and form reset behave correctly', async ({
  page,
}) => {
  await page.goto('/?case=upload');
  await page.getByRole('button', { name: '切换上传禁用' }).click();
  await expect(page.getByRole('button', { name: '上传附件', exact: true })).toBeDisabled();
  await expect(root(page).locator('input')).toBeDisabled();
  await page.getByRole('button', { name: '切换上传禁用' }).click();
  await page.getByRole('button', { name: '上传附件', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '手动附件', exact: true })).toBeFocused();
  const manual = page.locator('.ja-upload').nth(1);
  await manual.locator('input').setInputFiles(text('reset.txt'));
  await page.getByRole('button', { name: '重置上传表单' }).click();
  await expect(manual.locator('li')).toHaveCount(0);
});
test('Upload component cleans up requests when unmounted and wraps long filenames at narrow widths', async ({
  page,
}) => {
  await page.goto('/?case=upload');
  await page.setViewportSize({ width: 390, height: 800 });
  await root(page)
    .locator('input')
    .setInputFiles(text('long'.repeat(24) + '.txt'));
  await expect(root(page).getByRole('progressbar')).toBeVisible();
  expect(await root(page).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.getByRole('button', { name: '挂载上传组件' }).click();
  await expect(page.getByRole('button', { name: '上传附件', exact: true })).toHaveCount(0);
  await expect(page.locator('#upload-aborted')).toHaveText('1');
  await page.getByRole('button', { name: '外部移除文件' }).click();
  await page.getByRole('button', { name: '挂载上传组件' }).click();
  await expect(root(page).locator('li')).toHaveCount(0);
});
