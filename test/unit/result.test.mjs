import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Result provides a named section and decorative status icon without taking focus or announcing by default', () => {
  const button = document.createElement('button');
  document.body.append(button);
  button.focus();
  mount(ui.Result, { status: 'success' });
  const result = document.querySelector('section.ja-result');
  assert.equal(
    document.getElementById(result.getAttribute('aria-labelledby')).textContent,
    '操作成功',
  );
  assert.equal(result.getAttribute('role'), null);
  assert.equal(document.querySelector('.ja-result-icon').getAttribute('aria-hidden'), 'true');
  assert.equal(document.activeElement, button);
});

void test('Result supports 403/404/500 codes with meaningful default titles and descriptions', () => {
  for (const [status, title] of [
    ['403', '无权访问'],
    ['404', '页面不存在'],
    ['500', '服务器错误'],
  ]) {
    const view = mount(ui.Result, { status });
    assert.equal(document.querySelector('.ja-result-code').textContent, status);
    assert.equal(document.querySelector('.ja-result-title').textContent, title);
    assert.ok(document.querySelector('.ja-result-subtitle').textContent.length > 0);
    view.dispose();
  }
});

void test('Result title/subtitle/icon/extra/detail slots override defaults and optional announcement is reactive', async () => {
  const options = rt.vm({
    title: 'Text',
    'slot:title': ui.ContentSlot,
    'slot:subTitle': ui.BodySlot,
    'slot:icon': ui.IconSlot,
    'slot:extra': ui.TriggerSlot,
    'slot:default': ui.FooterSlot,
    announce: false,
    showIcon: true,
  });
  mount(ui.Result, options);
  assert.equal(document.querySelector('.ja-result-title').textContent, 'custom content');
  assert.ok(document.querySelector('.ja-result-subtitle strong'));
  assert.ok(document.querySelector('.ja-result-icon [data-testid="icon-slot"]'));
  assert.ok(document.querySelector('.ja-result-extra button'));
  assert.ok(document.querySelector('.ja-result-content [data-testid="footer-slot"]'));
  options.showIcon = false;
  options.announce = true;
  await flush();
  assert.equal(document.querySelector('.ja-result-icon'), null);
  assert.equal(document.querySelector('.ja-result').getAttribute('role'), 'status');
});

void test('Result dynamically changes its preset status/title and supports a headerless accessible label', async () => {
  const options = rt.vm({ status: 'warning' });
  mount(ui.Result, options);
  options.status = 'error';
  await flush();
  assert.equal(document.querySelector('.ja-result-title').textContent, '操作失败');
  options.title = '';
  options.ariaLabel = 'Job result';
  await flush();
  assert.equal(document.querySelector('.ja-result-title'), null);
  assert.equal(document.querySelector('.ja-result').getAttribute('aria-label'), 'Job result');
});
