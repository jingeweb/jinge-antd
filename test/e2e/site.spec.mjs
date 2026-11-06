import { test, expect } from './fixtures.mjs';
import { chooseOption } from './select-choice.mjs';

test('Documentation InputNumber demonstrates decimal stepping, empty values and source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/input-number');
  await expect(page.locator('h1')).toHaveText('InputNumber 数字输入框');
  const field = page.getByRole('spinbutton', { name: '订单金额' });
  await field.press('ArrowUp');
  await expect(field).toHaveValue('0.2');
  await page.getByRole('button', { name: '增加数值' }).first().click();
  await expect(field).toHaveValue('0.3');
  await page.getByRole('button', { name: '清空金额' }).click();
  await expect(field).toHaveValue('');
  await expect(page.locator('output')).toHaveText('未填写');
  await expect(page.locator('.api-table')).toContainText('min / max / precision');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText(
    'export function InputNumberExample()',
  );
});

test('Documentation Password demonstrates accessible visibility control and source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/password');
  await expect(page.locator('h1')).toHaveText('Password 密码输入');
  const field = page.getByLabel('登录密码');
  await expect(field).toHaveAttribute('autocomplete', 'current-password');
  await page.getByRole('button', { name: '显示密码' }).click();
  await expect(field).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: '隐藏密码' }).click();
  await expect(field).toHaveAttribute('type', 'password');
  await expect(page.locator('.api-table')).toContainText('visibilityToggle');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function PasswordExample()');
});

test('Documentation TextArea demonstrates autoSize, counting, clearing and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/textarea');
  await expect(page.locator('h1')).toHaveText('TextArea 多行输入');
  await page.getByRole('button', { name: '填充长说明' }).click();
  const field = page.getByRole('textbox', { name: '客户说明' });
  await expect(field).toHaveCSS('overflow-y', 'auto');
  await page.getByRole('button', { name: '清空输入' }).click();
  await expect(field).toHaveValue('');
  await expect(page.locator('.api-table')).toContainText('ref.resize');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function TextAreaExample()');
});

test('Documentation Input supports native editing/clearing/submission and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/input');
  await expect(page.locator('h1')).toHaveText('Input 输入框');
  await page.getByRole('textbox', { name: '客户姓名' }).fill('李四');
  await page.getByRole('button', { name: '提交姓名' }).click();
  await expect(page.getByRole('status')).toHaveText('已提交：李四');
  await page.getByRole('button', { name: '清空输入' }).click();
  await expect(page.getByRole('textbox', { name: '客户姓名' })).toHaveValue('');
  await expect(page.locator('.api-table')).toContainText('on:pressEnter');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function InputExample()');
});

test('Documentation Result demonstrates error pages, explicit retry and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/result');
  await expect(page.locator('h1')).toHaveText('Result 结果');
  await page.getByRole('combobox', { name: '处理结果' }).selectOption('403');
  await expect(page.getByRole('heading', { name: '无权访问' })).toBeVisible();
  await page.getByRole('button', { name: '重试操作' }).click();
  await expect(page.getByRole('heading', { name: '操作成功' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('已重试 1 次');
  await expect(page.locator('.api-table')).toContainText('slot:subTitle');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function ResultExample()');
});

test('Documentation Progress updates real status and exposes formatter source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/progress');
  await expect(page.locator('h1')).toHaveText('Progress 进度条');
  const progress = page.getByRole('progressbar', { name: '上传进度', exact: true });
  await page.getByRole('button', { name: '增加进度' }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '60');
  await page.getByRole('button', { name: '切换异常状态' }).click();
  await expect(progress).toHaveClass(/exception/);
  await expect(page.locator('.api-table')).toContainText('format / slot:info');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function ProgressExample()');
});

test('Documentation Skeleton preserves loaded state and shows exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/skeleton');
  await expect(page.locator('h1')).toHaveText('Skeleton 骨架屏');
  await page.getByRole('button', { name: '切换骨架加载' }).click();
  const input = page.getByRole('textbox', { name: '骨架区域备注' });
  await input.fill('保留草稿');
  await page.getByRole('button', { name: '切换骨架加载' }).click();
  await expect(input).toBeHidden();
  await page.getByRole('button', { name: '切换骨架加载' }).click();
  await expect(input).toHaveValue('保留草稿');
  await expect(page.locator('.api-table')).toContainText('SkeletonBlock.width');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function SkeletonExample()');
});

test('Documentation Spin demonstrates delayed blocking without losing input and exposes source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/spin');
  await expect(page.locator('h1')).toHaveText('Spin 加载中');
  const input = page.getByRole('textbox', { name: '加载区域备注' });
  await input.fill('保留备注');
  await page.getByRole('button', { name: '切换加载遮罩' }).click();
  await expect(page.locator('.ja-spin-content')).toHaveAttribute('inert');
  await expect(page.locator('.ja-spin.with-content [role="status"]')).toBeVisible();
  await page.getByRole('button', { name: '切换加载遮罩' }).click();
  await expect(input).toHaveValue('保留备注');
  await expect(page.locator('.api-table')).toContainText('spinning / delay');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function SpinExample()');
});

test('Documentation Alert demonstrates retry, close/restoration and source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/alert');
  await expect(page.locator('h1')).toHaveText('Alert 警告提示');
  await page.getByRole('button', { name: '重试保存' }).click();
  await expect(page.locator('.ja-alert.error .ja-alert-description')).toHaveText(
    '已重试 1 次，请检查网络后重试。',
  );
  await page.getByRole('button', { name: '关闭提示' }).click();
  await expect(page.locator('.ja-alert.info')).toHaveCount(0);
  await page.getByRole('button', { name: '恢复系统通知' }).click();
  await expect(page.locator('.ja-alert.info')).toBeVisible();
  await expect(page.locator('.api-table')).toContainText('on:visibleChange');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function AlertExample()');
});

test('Documentation Empty demonstrates creation/reset, custom slots and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/empty');
  await expect(page.locator('h1')).toHaveText('Empty 空状态');
  await expect(page.locator('.api-table')).toContainText('announce');
  await page.getByRole('button', { name: '新建客户', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已创建 1 条客户记录');
  await page.getByRole('button', { name: '重新显示空态' }).click();
  await expect(page.getByRole('button', { name: '新建客户', exact: true })).toBeVisible();
  await expect(page.locator('.ja-empty-description').nth(1)).toHaveText(
    '没有匹配的结果，请调整搜索条件。',
  );
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function EmptyExample()');
});

test('Documentation Descriptions demonstrates semantic values, spans and source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/descriptions');
  await expect(page.locator('h1')).toHaveText('Descriptions 描述列表');
  await expect(page.locator('.api-table')).toContainText('items[].span');
  const quota = page.locator('.ja-descriptions-item').filter({ hasText: '剩余额度' });
  await expect(quota.locator('dd')).toHaveText('0');
  await page.getByRole('button', { name: '增加额度' }).click();
  await expect(quota.locator('dd')).toHaveText('1');
  await page.getByRole('button', { name: '切换详情方向' }).click();
  await expect(page.locator('.ja-descriptions')).toHaveClass(/vertical/);
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText(
    'export function DescriptionsExample()',
  );
});

test('Documentation Collapse preserves content and exposes item slot source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/collapse');
  await expect(page.locator('h1')).toHaveText('Collapse 折叠面板');
  await expect(page.locator('.api-table')).toContainText('destroyOnHidden');
  await page.getByRole('textbox', { name: '折叠面板备注' }).fill('保留的备注');
  const button = page.getByRole('button', { name: '客户信息', exact: true });
  await button.click();
  await expect(page.getByRole('textbox', { name: '折叠面板备注' })).toBeHidden();
  await button.click();
  await expect(page.getByRole('textbox', { name: '折叠面板备注' })).toHaveValue('保留的备注');
  await page.getByRole('button', { name: '附加操作', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('附加操作 1 次');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function CollapseExample()');
});

test('Documentation Card has source/API and preserves user input across loading', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/card');
  await expect(page.locator('h1')).toHaveText('Card 卡片');
  await expect(page.locator('.api-table')).toContainText('slot:cover');
  const input = page.getByRole('textbox', { name: '卡片备注' });
  await input.fill('保留输入');
  await page.getByRole('button', { name: '切换加载' }).click();
  await expect(input).toBeHidden();
  await page.getByRole('button', { name: '切换加载' }).click();
  await expect(input).toHaveValue('保留输入');
  await page.getByRole('button', { name: '记录操作' }).click();
  await expect(page.getByRole('status')).toHaveText('已操作 1 次');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function CardExample()');
});

test('Documentation Tag supports keyboard removal/restoration and exact source', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/tag');
  await expect(page.locator('h1')).toHaveText('Tag 标签');
  await page.getByRole('button', { name: '移除标签', exact: true }).first().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('已移除 1 次');
  await page.getByRole('button', { name: '恢复筛选标签' }).click();
  await expect(page.getByText('可移除筛选', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '尝试移除固定标签' }).click();
  await expect(page.getByText('固定标签', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function TagExample()');
});

test('Documentation Badge updates its unread indicator and shows exact source', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/badge');
  await expect(page.locator('h1')).toHaveText('Badge 徽标');
  await page.getByRole('button', { name: '增加未读' }).click();
  await expect(page.locator('.ja-badge.with-child .ja-badge-indicator')).toHaveText('99+');
  await page.getByRole('button', { name: '清空未读' }).click();
  await expect(page.locator('.ja-badge.with-child .ja-badge-indicator')).toHaveCount(0);
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function BadgeExample()');
});

test('Documentation Avatar includes real source and an image failure/retry demo', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/avatar');
  await expect(page.locator('h1')).toHaveText('Avatar 头像');
  await expect(page.locator('.api-table')).toContainText('srcSet');
  const avatar = page.getByRole('img', { name: '客户头像' });
  await expect(avatar.locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: '模拟图片失败' }).click();
  await expect(avatar).toHaveText('客户');
  await page.getByRole('button', { name: '重新加载图片' }).click();
  await expect(avatar.locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function AvatarExample()');
});

for (const [id, title, source] of [
  ['modal', 'Modal 对话框', 'export function ModalExample()'],
  ['drawer', 'Drawer 抽屉', 'export function DrawerExample()'],
  ['message', 'Message 全局提示', 'export function MessageExample()'],
  ['notification', 'Notification 通知', 'export function NotificationExample()'],
]) {
  test(`Documentation ${id} shows actual demos, source and API`, async ({ page }) => {
    await page.goto(`/zh-CN/components/${id}`);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('.planned-panel')).toHaveCount(0);
    await expect(page.locator('.api-table')).toContainText(
      id === 'modal' || id === 'drawer' ? 'on:afterClose' : 'instance.update',
    );
    const demo = page.locator('.demo-card').first();
    await demo.getByRole('button', { name: '查看代码' }).click();
    await expect(demo.locator('code')).toContainText(source);
  });
}

test('Documentation Message and Notification examples update, close and run content actions', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/message');
  await page.getByRole('button', { name: '开始导入', exact: true }).click();
  await expect(page.locator('.ja-message')).toHaveText('正在导入…');
  await page.getByRole('button', { name: '更新为完成' }).click();
  await expect(page.locator('.ja-message')).toHaveText('导入完成');
  await expect(page.locator('.ja-message')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('导入提示已关闭 1 次');
  await page.goto('/zh-CN/components/notification');
  await page.getByRole('combobox', { name: '通知位置' }).selectOption('bottomLeft');
  await page.getByRole('button', { name: '显示任务通知' }).click();
  await expect(page.locator('[data-placement="bottomLeft"] .ja-notification')).toBeVisible();
  await page.getByRole('button', { name: '更新并保持显示' }).click();
  await expect(page.locator('.ja-notification-title')).toHaveText('全部任务已完成');
  await page.getByRole('button', { name: '查看结果', exact: true }).click();
  await expect(page.locator('.ja-notification')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('已查看 1 次结果');
});

test('Documentation Modal and Drawer demos complete real save and nested close workflows', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/modal');
  await page.getByRole('button', { name: '编辑客户', exact: true }).click();
  await page.getByRole('textbox', { name: '客户姓名' }).fill('李四');
  await page.getByRole('button', { name: '确 认', exact: true }).click();
  await expect(page.locator('.ja-modal')).toHaveCount(0);
  await expect(page.getByRole('status').first()).toHaveText('已保存：李四');
  await page.getByRole('button', { name: '命令式确认', exact: true }).click();
  await page.getByRole('button', { name: '确 认', exact: true }).click();
  await expect(page.getByRole('status').nth(1)).toHaveText('已归档');
  await page.goto('/zh-CN/components/drawer');
  await page.getByRole('button', { name: '查看客户详情' }).click();
  await page.getByRole('button', { name: '打开关联记录' }).click();
  await expect(page.getByRole('dialog', { name: '关联记录', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '关联记录', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '打开关联记录' })).toBeFocused();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.ja-drawer')).toHaveCount(0);
});

test('Documentation opens with live examples, navigation, API and a desktop layout', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/zh-CN\/components\/button$/);
  await expect(page.locator('h1')).toHaveText('Button 按钮');
  await expect(page.locator('.demo-card')).toHaveCount(4);
  await expect(page.locator('.api-table')).toContainText('htmlType');
  await page.screenshot({ path: 'test/.results/site-desktop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('Documentation search handles Chinese/English and an empty result', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: '搜索组件' });
  const searchIcon = page.locator('.search-box > span');
  await expect(searchIcon).toHaveCSS('width', '18px');
  await expect(searchIcon).toHaveCSS('height', '18px');
  expect(await searchIcon.evaluate((element) => getComputedStyle(element).maskImage)).not.toBe(
    'none',
  );
  await search.fill('button');
  await expect(page.locator('.nav-link:visible')).toHaveCount(1);
  await search.fill('表单');
  await expect(page.locator('.nav-link:visible')).toContainText(['Form']);
  await search.fill('not-a-component');
  await expect(page.getByText('没有匹配的组件')).toBeVisible();
});
test('Documentation completed hierarchy pages, browser history and direct links work', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/button');
  await page.locator('a[href="/zh-CN/components/tree"]').click();
  await expect(page.locator('h1')).toHaveText('Tree 树');
  await expect(page.locator('.planned-panel')).toHaveCount(0);
  await page.locator('a[href="/zh-CN/components/cascader"]').click();
  await expect(page.locator('h1')).toHaveText('Cascader 级联选择');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Cascader 级联选择');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Tree 树');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Button 按钮');
});
test('Documentation displays actual example source and copies it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const demo = page.locator('#button-basic');
  await expect(demo.locator('pre')).toHaveCount(0);
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function ButtonBasic()');
  await expect(demo.locator('.shiki')).toBeVisible();
  await demo.getByRole('button', { name: '复制代码' }).click();
  await expect(demo.getByRole('button', { name: '已复制' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("from 'jinge-antd'");
  expect(await demo.locator('code').textContent()).toBe(copied);
});
test('Documentation examples remain interactive and page anchors work', async ({ page }) => {
  await page.goto('/zh-CN/components/button');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('button', { name: '保存更改' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('已保存 1 次');
  await page.getByRole('button', { name: '禁用分组', exact: true }).click();
  await expect(
    page.getByRole('group', { name: '记录操作' }).getByRole('button', { name: '编辑' }),
  ).toBeDisabled();
  await page
    .getByRole('complementary', { name: '本页目录' })
    .getByRole('link', { name: 'API', exact: true })
    .click();
  await expect(page).toHaveURL(/section=api$/);
  await expect
    .poll(() =>
      page.locator('#api').evaluate((el) => Math.abs(el.getBoundingClientRect().top - 96)),
    )
    .toBeLessThan(5);
});
test('Documentation navigation is usable on narrow screens and unknown links are explicit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/zh-CN/components/button');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '切换组件导航' }).click();
  await expect(page.getByRole('searchbox', { name: '搜索组件' })).toBeVisible();
  await page.goto('/zh-CN/components/missing');
  await expect(page.locator('h1')).toHaveText('未找到组件');
});

for (const [id, name, selector] of [
  ['typography', 'Typography 排版', 'h3.ja-title'],
  ['space', 'Space / Flex 间距与弹性布局', '.ja-space'],
  ['divider', 'Divider 分割线', '[role=separator]'],
  ['grid', 'Grid 栅格', '.ja-row'],
  ['layout', 'Layout 布局容器', '.ja-layout-sider'],
])
  test(`Documentation ${id} page renders examples and exact source when navigated from Button`, async ({
    page,
  }) => {
    await page.goto('/zh-CN/components/button');
    await page.locator(`a.nav-link[href="/zh-CN/components/${id}"]`).click();
    await expect(page.locator('h1')).toHaveText(name);
    await expect(page.locator(selector).first()).toBeVisible();
    await page.getByRole('button', { name: '查看代码', exact: true }).click();
    await expect(page.locator('.demo-source')).toContainText("from 'jinge-antd'");
    await expect(page.locator('.api-table')).toBeVisible();
  });

test('Space changes its real layout and Flex separates its children', async ({ page }) => {
  await page.goto('/zh-CN/components/space');
  const space = page.locator('.ja-space');
  await expect(space).toHaveCSS('flex-direction', 'row');
  await page.getByRole('button', { name: '切换排列方向' }).click();
  await expect(space).toHaveCSS('flex-direction', 'column');
  await expect(space).toHaveCSS('gap', '16px');
  await expect(page.locator('.ja-flex')).toHaveCSS('justify-content', 'space-between');
});
test('Grid uses real media queries to move from two columns to stacked rows', async ({ page }) => {
  await page.goto('/zh-CN/components/grid');
  const cells = page.locator('.ja-row').first().locator('.ja-col');
  const desktop = await cells.evaluateAll((elements) =>
    elements.map((el) => ({
      top: el.getBoundingClientRect().top,
      width: el.getBoundingClientRect().width,
    })),
  );
  expect(Math.abs(desktop[0].top - desktop[1].top)).toBeLessThan(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      cells.evaluateAll(
        (elements) =>
          elements[1].getBoundingClientRect().top - elements[0].getBoundingClientRect().top,
      ),
    )
    .toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('Layout Sider can be collapsed with keyboard and returns focus to its trigger', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/layout');
  const button = page.getByRole('button', { name: '收起侧边栏' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '展开侧边栏' })).toBeFocused();
  await expect(page.locator('.ja-layout-sider')).toHaveCSS('width', '64px');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ja-layout-sider')).toHaveCSS('width', '160px');
});

for (const [id, title] of [
  ['floating', 'Floating 浮层基础'],
  ['tooltip', 'Tooltip 文字提示'],
  ['popover', 'Popover 气泡卡片'],
  ['popconfirm', 'Popconfirm 气泡确认'],
]) {
  test(`Documentation ${id} page has runnable source, capabilities and limitations`, async ({
    page,
  }) => {
    await page.goto(`/zh-CN/components/${id}`);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('.demo-card')).toHaveCount(1);
    await expect(page.locator('.api-table')).toContainText('open / defaultOpen');
    await page.getByRole('button', { name: '查看代码', exact: true }).click();
    await expect(page.locator('.demo-source')).toContainText("from 'jinge-antd'");
    await expect(page.locator('.notes')).toContainText('离场动画');
  });
}
test('Documentation Floating and Popconfirm examples perform their actual interactions', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/floating');
  await page.getByRole('button', { name: '打开定位示例' }).click();
  await expect(page.getByRole('dialog', { name: '定位演示' })).toBeVisible();
  await page.getByRole('combobox', { name: '浮层方向' }).selectOption('right');
  // This controlled demo retains the panel while the external direction control changes.
  await expect(page.getByRole('dialog', { name: '定位演示' })).toHaveAttribute(
    'data-placement',
    'right',
  );
  await page.goto('/zh-CN/components/popconfirm');
  await page.getByRole('button', { name: '删除记录', exact: true }).click();
  await page.locator('.ja-popconfirm-footer button.primary').click();
  await expect(page.getByRole('status')).toHaveText('已删除 1 条');
  await expect(page.locator('.ja-popconfirm')).toHaveCount(0);
});

test('Documentation Checkbox demonstrates all/mixed selection and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/checkbox');
  await expect(page.locator('h1')).toHaveText('Checkbox 多选框');
  const all = page.getByRole('checkbox', { name: '全部权限' });
  await expect(all).toHaveAttribute('aria-checked', 'mixed');
  await all.click();
  await expect(all).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '导出', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: '编辑', exact: true }).uncheck();
  await expect(all).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.locator('.api-table')).toContainText('CheckboxGroup');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function CheckboxExample()');
});

test('Documentation Radio demonstrates native keyboard, button variant and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/radio');
  await expect(page.locator('h1')).toHaveText('Radio 单选框');
  await page.getByRole('radio', { name: '标准版' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: '专业版' })).toBeChecked();
  await page.getByRole('radio', { name: '卡片', exact: true }).click();
  await expect(page.getByRole('radio', { name: '卡片', exact: true })).toBeChecked();
  await expect(page.locator('.api-table')).toContainText('RadioGroup');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function RadioExample()');
});

test('Documentation Switch demonstrates immediate settings, loading and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/switch');
  await expect(page.locator('h1')).toHaveText('Switch 开关');
  const save = page.getByRole('switch', { name: '自动保存' });
  await save.click();
  await expect(save).toBeChecked();
  await expect(save).toHaveAttribute('aria-busy', 'true');
  await expect(save).toBeDisabled();
  await expect(save).toBeEnabled();
  await expect(page.getByRole('switch', { name: '系统维护（不可修改）' })).toBeDisabled();
  await expect(page.locator('.api-table')).toContainText('checkedLabel');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function SwitchExample()');
  await page.screenshot({ path: 'test/.results/switch.png', fullPage: true });
});

test('Documentation Select supports searchable grouped options, multiple tags and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/select');
  await expect(page.locator('h1')).toHaveText('Select 选择器');
  const owner = page.getByRole('combobox', { name: '项目负责人' });
  await owner.fill('gra');
  await expect(owner).toHaveCSS('outline-style', 'none');
  await expect(owner).toHaveCSS('border-top-width', '0px');
  await expect(owner.locator('..')).toHaveCSS('border-top-color', 'rgb(22, 119, 255)');
  await expect(page.locator('.ja-select-option.highlighted')).toHaveCSS('outline-style', 'none');
  await page.getByRole('option', { name: 'Grace', exact: true }).click();
  await expect(owner).toHaveAttribute('placeholder', 'Grace');
  const textColor = await owner.evaluate((element) => getComputedStyle(element).color);
  await expect
    .poll(() => owner.evaluate((element) => getComputedStyle(element, '::placeholder').color))
    .toBe(textColor);
  await owner.click();
  await expect(owner).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() => owner.evaluate((element) => getComputedStyle(element, '::placeholder').color))
    .not.toBe(textColor);
  await owner.press('Escape');
  const reviewers = page.getByRole('combobox', { name: '评审人' });
  await reviewers.fill('lin');
  await expect(reviewers).toHaveCSS('outline-style', 'none');
  await page.getByRole('option', { name: '小林', exact: true }).click();
  await expect(page.getByRole('button', { name: '移除 小林' })).toBeVisible();
  await expect(page.locator('.api-table')).toContainText('slot:selection');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function SelectExample()');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test/.results/select.png', fullPage: true });
});

test('Documentation AutoComplete demonstrates asynchronous suggestions, free input and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/autocomplete');
  await expect(page.locator('h1')).toHaveText('AutoComplete 自动完成');
  const field = page.getByRole('combobox', { name: '联系邮箱' });
  await field.fill('ada');
  await expect(field).toHaveCSS('outline-style', 'none');
  await expect(field).toHaveCSS('border-top-width', '0px');
  await expect(field.locator('..')).toHaveCSS('border-top-color', 'rgb(22, 119, 255)');
  await expect(page.getByRole('option', { name: 'ada@company.cn', exact: true })).toBeVisible();
  await expect(page.locator('.ja-select-option.highlighted')).toHaveCSS('outline-style', 'none');
  await page.screenshot({ path: 'test/.results/autocomplete-focus.png', animations: 'disabled' });
  await page.getByRole('option', { name: 'ada@company.cn', exact: true }).hover();
  await expect(page.locator('.ja-select-option.highlighted')).toHaveAttribute(
    'aria-label',
    'ada@company.cn',
  );
  await field.press('Enter');
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('ada@company.cn');
  await expect(page.locator('output')).toHaveText('已采用建议：ada@company.cn');
  await page.getByRole('button', { name: '清空输入' }).click();
  await expect(field).toHaveValue('');
  await expect(page.locator('.api-table')).toContainText('on:select');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText(
    'export function AutoCompleteExample()',
  );
});

test('Documentation Form validates, binds mixed controls, saves transformed values and shows exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/form');
  await expect(page.locator('h1')).toHaveText('Form 表单');
  await page.getByRole('button', { name: '保存成员' }).click();
  await expect(page.getByText('姓名至少两个字符', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: '姓名', exact: true }).fill('  小明  ');
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill('member@example.com');
  await page.getByLabel('密码', { exact: true }).fill('secret123');
  await page.getByLabel('确认密码', { exact: true }).fill('secret123');
  await page.getByRole('button', { name: '添加备注' }).click();
  await page.getByRole('textbox', { name: '备注', exact: true }).fill('Temporary note');
  await page.getByRole('button', { name: '移除备注' }).click();
  await page.getByRole('button', { name: '保存成员' }).click();
  await expect(page.getByText('已保存：小明（member）', { exact: true })).toBeVisible();
  await page
    .getByRole('form', { name: '成员信息' })
    .screenshot({ path: 'test/.results/form-demo.png' });
  await expect(page.locator('.api-table')).toContainText('dependencies');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function FormExample()');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test/.results/form.png', fullPage: true });
});

test('Documentation Menu navigates controlled side items and exposes exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/menu');
  await expect(page.locator('h1')).toHaveText('Menu 导航菜单');
  const side = page.getByRole('menu', { name: '后台导航', exact: true });
  await side.getByRole('menuitem', { name: '角色权限', exact: true }).click();
  await expect(page.locator('output')).toHaveText('当前页面：roles');
  await expect(page.locator('.api-table')).toContainText('openKeys');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function MenuExample()');
  await page.locator('.demo-preview').first().screenshot({ path: 'test/.results/menu-demo.png' });
});

test('Documentation Dropdown performs actions, retains selection menus and shows exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/dropdown');
  await expect(page.locator('h1')).toHaveText('Dropdown 下拉菜单');
  await page.getByRole('button', { name: '更多操作' }).click();
  await page.getByRole('menuitem', { name: '复制', exact: true }).click();
  await expect(page.locator('output')).toContainText('最近操作：copy');
  await page.getByRole('button', { name: '显示选项' }).click();
  await page.getByRole('menuitem', { name: '卡片视图', exact: true }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.api-table')).toContainText('closeOnSelect');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText('export function DropdownExample()');
});

test('Documentation Breadcrumb updates paths, intercepts native links and exposes exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/breadcrumb');
  await expect(page.locator('h1')).toHaveText('Breadcrumb 面包屑');
  await page
    .getByRole('navigation', { name: '面包屑', exact: true })
    .getByRole('link', { name: '项目列表' })
    .click();
  await expect(page.locator('output')).toHaveText('最近导航：项目列表');
  await page.getByRole('button', { name: '切换详情' }).click();
  await expect(
    page.getByRole('navigation', { name: '面包屑', exact: true }).locator('[aria-current=page]'),
  ).toHaveText('Grace');
  await expect(page.locator('.api-table')).toContainText('slot:separator');
  await page.getByRole('button', { name: '查看代码' }).click();
  await expect(page.locator('.demo-card code')).toContainText(
    'export function BreadcrumbExample()',
  );
});

test('Tabs documentation demonstrates controlled navigation, disabled items, orientation and actual source', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/tabs');
  const demo = page.locator('#tabs-basic');
  await demo.getByRole('textbox', { name: '项目备注' }).fill('文档测试');
  await demo.getByRole('tab', { name: '成员管理' }).click();
  await expect(demo.getByRole('tabpanel', { name: '成员管理' })).toContainText('成员列表');
  await demo.getByRole('tab', { name: '项目概览' }).click();
  await expect(demo.getByRole('textbox', { name: '项目备注' })).toHaveValue('文档测试');
  await expect(demo.getByRole('tab', { name: '账单（无权限）' })).toBeDisabled();
  await demo.getByRole('button', { name: '切换横纵布局' }).click();
  await expect(demo.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  await expect(page.locator('.api-table')).toContainText('destroyOnHidden');
  await expect
    .poll(() => demo.locator('.indicator').evaluate((el) => el.getBoundingClientRect().width))
    .toBeLessThanOrEqual(2);
  expect(
    await demo
      .getByRole('tab', { name: '账单（无权限）' })
      .evaluate((el) => el.clientWidth >= el.scrollWidth),
  ).toBeTruthy();
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function TabsExample()');
  await demo
    .locator('.demo-preview')
    .screenshot({ path: 'test/.results/tabs-demo.png', animations: 'disabled' });
});
test('Tabs card documentation demonstrates numeric default keys and manual activation', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/tabs');
  const demo = page.locator('#tabs-variants');
  const selected = demo.getByRole('tab', { name: '近七日' });
  await expect(selected).toHaveAttribute('aria-selected', 'true');
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  await expect(selected).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(demo.getByRole('tabpanel', { name: '近三十日' })).toHaveText('近三十日报表。');
});

test('Segmented documentation demonstrates controlled range and native form reset', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/segmented');
  const demo = page.locator('#segmented-basic');
  await demo.getByRole('radio', { name: '近三十日', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('报表范围：30 天');
  await demo.getByRole('radio', { name: '卡片', exact: true }).click();
  await demo.getByRole('button', { name: '重置视图' }).click();
  await expect(demo.getByRole('radio', { name: '列表', exact: true })).toBeChecked();
  await demo.getByRole('button', { name: '切换禁用' }).click();
  await expect(demo.getByRole('radio', { name: '今日', exact: true })).toBeDisabled();
  await expect(page.locator('.api-table')).toContainText('defaultValue');
  expect(
    await demo
      .getByRole('radiogroup', { name: '报表范围' })
      .evaluate((el) => Math.abs(el.clientWidth - el.parentElement.clientWidth)),
  ).toBeLessThanOrEqual(1);
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function SegmentedExample()');
  await demo
    .locator('.demo-preview')
    .screenshot({ path: 'test/.results/segmented-demo.png', animations: 'disabled' });
});
test('Steps documentation demonstrates requests, error status, direction and completed read-only flow', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/steps');
  const demo = page.locator('#steps-basic');
  await demo.getByRole('button', { name: /填写信息/ }).click();
  await expect(demo.locator('[aria-current=step]')).toContainText('填写信息');
  await demo.getByRole('button', { name: '切换错误状态' }).click();
  await expect(demo.locator('.ja-step.error')).toHaveCount(1);
  await demo.getByRole('button', { name: '切换步骤方向' }).click();
  await expect(demo.locator('.ja-steps')).toHaveClass(/vertical/);
  await expect(page.locator('#steps-complete .ja-step.finish')).toHaveCount(3);
  await expect(page.locator('#steps-complete button.ja-step-body')).toHaveCount(0);
  await expect(page.locator('.api-table')).toContainText('on:change');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function StepsExample()');
  await demo
    .locator('.demo-preview')
    .screenshot({ path: 'test/.results/steps-demo.png', animations: 'disabled' });
});

test('Pagination documentation changes pages and size, demonstrates simple mode and exposes exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/pagination');
  const demo = page.locator('#pagination-basic');
  const nav = demo.getByRole('navigation', { name: '用户列表分页' });
  await nav.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('第 4 页，每页 10 条');
  await chooseOption(page, nav.getByRole('combobox', { name: '每页条数' }), '20 条/页');
  await expect(demo.locator('output')).toHaveText('第 1 页，每页 20 条');
  await expect(demo.getByRole('navigation', { name: '精简分页' })).toContainText('2 / 8');
  await expect(page.locator('.api-table')).toContainText('pageSizeOptions');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function PaginationExample()');
  await demo.locator('.demo-preview').screenshot({ path: 'test/.results/pagination-demo.png' });
});

test('Table documentation demonstrates controlled selection, Select filters, row actions, expansion and source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/table');
  const demo = page.locator('#table-basic');
  await demo.getByRole('checkbox', { name: '选择行 1', exact: true }).check();
  await expect(demo.locator('output')).toContainText('已选：1');
  await demo.getByRole('button', { name: '展开行 1', exact: true }).click();
  await expect(demo.locator('.ja-table-expanded')).toContainText('Ada');
  await demo.getByRole('button', { name: '查看详情' }).first().click();
  await expect(demo.locator('output')).toContainText('最近查看：Ada');
  await chooseOption(page, demo.getByRole('combobox', { name: '筛选 团队' }), '平台');
  await expect(demo.locator('tbody [data-column-key=team]')).toHaveText(['平台', '平台', '平台']);
  await expect(page.locator('.api-table')).toContainText('preserveSelectedRowKeys');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function TableExample()');
  await demo.locator('.demo-preview').screenshot({ path: 'test/.results/table-demo.png' });
});
test('Table documentation remote mode sends page/sort requests without double-slicing loaded rows', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/table');
  const demo = page.locator('#table-remote');
  await expect(demo.locator('tbody .ja-table-row')).toHaveCount(2);
  await expect(demo.locator('tbody [data-column-key=name]')).toHaveText(['Ada', 'Grace']);
  await demo.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(demo.locator('tbody [data-column-key=name]')).toHaveText(['Linus', 'Margaret']);
  await demo.getByRole('button', { name: '排序 年龄' }).click();
  await expect(demo.locator('[aria-current=page]')).toHaveText('1');
  await expect(demo.locator('tbody [data-column-key=name]')).toHaveText(['Grace', 'Alan']);
  await expect(demo.locator('th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
});

test('DatePicker documentation demonstrates native dates, strict formats, controlled values and exact source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/date-picker');
  await expect(page.locator('.import-line')).toHaveText(
    "import { DatePicker, RangePicker } from 'jinge-antd';",
  );
  const demo = page.locator('#date-picker-basic');
  const input = demo.getByRole('combobox', { name: '业务日期' });
  await input.fill('2026-11-04');
  await input.press('Enter');
  await expect(demo.locator('output')).toHaveText('ISO 日期：2026-11-04');
  await demo.getByRole('button', { name: '外部更新日期' }).click();
  await expect(input).toHaveValue('2026-11-05');
  await expect(demo.getByRole('combobox', { name: '斜线日期' })).toHaveValue('29/02/2024');
  await input.press('ArrowDown');
  await expect(page.getByRole('dialog', { name: '选择日期', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test/.results/date-picker.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.api-table')).toContainText('Temporal.PlainDate');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function DatePickerExample()');
});
test('RangePicker documentation commits endpoints and exposes its real example source', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/date-picker');
  const demo = page.locator('#range-picker-basic');
  const input = demo.getByRole('combobox', { name: '报表日期范围' });
  await input.press('ArrowDown');
  const dialog = page.getByRole('dialog', { name: '选择日期范围' });
  await dialog.getByRole('button', { name: '2026-11-10', exact: true }).click();
  await expect(input).toHaveValue('');
  await dialog.getByRole('button', { name: '2026-11-03', exact: true }).hover();
  await page.screenshot({ path: 'test/.results/range-picker.png', animations: 'disabled' });
  await dialog.getByRole('button', { name: '2026-11-03', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('ISO 范围：2026-11-03 / 2026-11-10');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function RangePickerExample()');
});
test('DatePicker documentation Form saves native values and resets the controlled field', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/date-picker');
  const demo = page.locator('#date-picker-form'),
    input = demo.getByRole('combobox', { name: '生效日期', exact: true });
  await input.fill('2026-11-03');
  await input.press('Enter');
  await demo.getByRole('button', { name: '保存日期' }).click();
  await expect(demo.locator('output')).toHaveText('保存结果：2026-11-03');
  await demo.getByRole('button', { name: '重置日期' }).click();
  await expect(input).toHaveValue('');
});
test('TimePicker documentation uses native steps and confirmation and displays source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/time-picker');
  const demo = page.locator('#time-picker-basic');
  const input = demo.getByRole('combobox', { name: '预约时间' });
  await input.press('ArrowDown');
  await chooseOption(page, page.getByRole('combobox', { name: '分钟', exact: true }), '15');
  await page.screenshot({ path: 'test/.results/time-picker.png', animations: 'disabled' });
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('预约时间：09:15:00');
  await expect(page.locator('.api-table')).toContainText('disabledHours');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function TimePickerExample()');
});
test('Date documentation reports missing native Temporal without executing native-only examples', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(globalThis, 'Temporal');
  });
  await page.goto('/zh-CN/components/date-picker');
  await expect(page.locator('#date-picker-basic [role=alert]')).toContainText('Temporal');
});

test('Upload documentation validates files, retries simulated failure and shows actual source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/upload');
  const demo = page.locator('#upload-basic');
  await demo
    .locator('input')
    .setInputFiles({ name: 'fail.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name') });
  await expect(demo.getByRole('alert')).toHaveText('模拟失败，请重试');
  await demo.getByRole('button', { name: '重试 fail.csv', exact: true }).click();
  await expect(demo).toContainText('上传完成');
  await demo
    .locator('input')
    .setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') });
  await expect(demo.locator('output')).toHaveText('bad.pdf 未加入：不支持的文件类型');
  await expect(page.locator('.api-table')).toContainText('customRequest');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function UploadExample()');
  await page.screenshot({ path: 'test/.results/upload.png', animations: 'disabled' });
});
test('Upload Form documentation queues manual files, validates completion, saves and resets', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/upload');
  const demo = page.locator('#upload-form');
  await demo
    .locator('input')
    .setInputFiles({ name: 'audit.txt', mimeType: 'text/plain', buffer: Buffer.from('audit') });
  await expect(demo).toContainText('待上传');
  await demo.getByRole('button', { name: '保存附件', exact: true }).click();
  await expect(demo).toContainText('请先完成全部附件上传');
  await demo.getByRole('button', { name: '开始上传附件', exact: true }).click();
  await expect(demo).toContainText('上传完成');
  await demo.getByRole('button', { name: '保存附件', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('保存结果：audit.txt');
  await demo.getByRole('button', { name: '重置附件', exact: true }).click();
  await expect(demo.locator('.ja-upload-item')).toHaveCount(0);
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function UploadFormExample()');
});

test('Tree documentation conducts checks, filters ancestors and exposes its actual source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/tree');
  const demo = page.locator('#tree-basic'),
    root = demo.getByRole('treeitem', { name: '研发中心', exact: true });
  await root.focus();
  await root.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(root).toHaveAttribute('aria-checked', 'mixed');
  await expect(demo.locator('output')).toContainText('[0]');
  await demo.getByRole('textbox', { name: '筛选部门', exact: true }).fill('运维');
  await expect(demo.getByRole('treeitem', { name: '平台开发', exact: true })).toHaveCount(0);
  await expect(demo.getByRole('treeitem', { name: '运维团队', exact: true })).toBeVisible();
  await demo.getByRole('textbox', { name: '筛选部门', exact: true }).clear();
  await expect(page.locator('.api-table')).toContainText('checkStrictly');
  await page.screenshot({ path: 'test/.results/tree.png', animations: 'disabled' });
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function TreeExample()');
});
test('Tree lazy documentation retries failure and selects the loaded node', async ({ page }) => {
  await page.goto('/zh-CN/components/tree');
  const demo = page.locator('#tree-lazy');
  await demo.getByRole('button', { name: '展开 远程组织', exact: true }).click();
  await expect(demo.getByRole('alert')).toContainText('模拟加载失败');
  await demo.getByRole('button', { name: '重试加载 远程组织', exact: true }).click();
  await demo.getByRole('treeitem', { name: '远程业务团队', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('已选择：["remote-team"]');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function TreeLazyExample()');
});
test('Cascader documentation searches loaded paths, selects intermediate levels and exposes source/API', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/cascader');
  const demo = page.locator('#cascader-basic'),
    field = demo.getByRole('combobox', { name: '服务地区', exact: true });
  await field.fill('浙江 西湖');
  await page.getByRole('option', { name: '浙江 / 杭州 / 西湖', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('地区路径：["zj","hz",0]');
  await demo.getByRole('button', { name: '切换中间级选择', exact: true }).click();
  await field.click();
  await page.getByRole('option', { name: '江苏', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('地区路径：["js"]');
  await page.screenshot({ path: 'test/.results/cascader.png', animations: 'disabled' });
  await field.press('Escape');
  await expect(page.locator('.api-table')).toContainText('loadData');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function CascaderExample()');
});
test('Cascader Form documentation validates a path, saves it and resets the field', async ({
  page,
}) => {
  await page.goto('/zh-CN/components/cascader');
  const demo = page.locator('#cascader-form');
  await demo.getByRole('button', { name: '保存地区', exact: true }).click();
  await expect(demo.getByRole('combobox', { name: '审核地区', exact: true })).toBeFocused();
  await demo.getByRole('combobox', { name: '审核地区', exact: true }).press('ArrowDown');
  await page.getByRole('option', { name: '浙江', exact: true }).click();
  await page.getByRole('option', { name: '浙江 / 杭州', exact: true }).click();
  await page.getByRole('option', { name: '浙江 / 杭州 / 西湖', exact: true }).click();
  await demo.getByRole('button', { name: '保存地区', exact: true }).click();
  await expect(demo.locator('output')).toHaveText('保存结果：["zj","hz",0]');
  await demo.getByRole('button', { name: '重置地区', exact: true }).click();
  await expect(demo.getByRole('combobox', { name: '审核地区', exact: true })).toHaveText('请选择');
  await demo.getByRole('button', { name: '查看代码' }).click();
  await expect(demo.locator('code')).toContainText('export function CascaderFormExample()');
});
