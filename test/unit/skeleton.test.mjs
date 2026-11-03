import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Skeleton renders a single named status with decorative title/avatar/paragraph placeholders', () => {
  mount(ui.Skeleton, { avatar: true, rows: 4, active: true });
  assert.equal(document.querySelectorAll('[role="status"]').length, 1);
  assert.equal(document.querySelector('[role="status"]').getAttribute('aria-label'), '加载中');
  assert.ok(document.querySelector('.ja-skeleton-avatar'));
  assert.equal(document.querySelectorAll('.ja-skeleton-line').length, 4);
  assert.ok(document.querySelector('.ja-skeleton-title'));
  assert.ok(document.querySelector('.ja-skeleton.active'));
});

void test('Skeleton lazily mounts content then preserves it across subsequent loading cycles', async () => {
  const options = rt.vm({ loading: true, 'slot:default': ui.FocusContentSlot });
  mount(ui.Skeleton, options);
  assert.equal(document.querySelector('input'), null);
  options.loading = false;
  await flush();
  const input = document.querySelector('input');
  input.value = 'Draft';
  options.loading = true;
  await flush();
  assert.equal(document.querySelector('.ja-skeleton-content').hidden, true);
  options.loading = false;
  await flush();
  assert.equal(document.querySelector('input'), input);
  assert.equal(input.value, 'Draft');
  assert.equal(document.querySelector('[role="status"]'), null);
});

void test('Skeleton updates row counts/widths and can omit its title and avatar', async () => {
  const options = rt.vm({ title: false, rows: 2, widths: ['80%', 100], titleWidth: '40%' });
  mount(ui.Skeleton, options);
  assert.equal(document.querySelector('.ja-skeleton-title'), null);
  assert.equal(document.querySelector('.ja-skeleton-avatar'), null);
  assert.deepEqual(
    [...document.querySelectorAll('.ja-skeleton-line')].map((el) => el.style.width),
    ['80%', '100px'],
  );
  options.rows = 0;
  await flush();
  assert.equal(document.querySelectorAll('.ja-skeleton-line').length, 0);
});

void test('SkeletonBlock supports standalone dimensions, shape and optional announcement', async () => {
  const options = rt.vm({ width: 64, height: 64, shape: 'circle', active: true });
  mount(ui.SkeletonBlock, options);
  const block = document.querySelector('.ja-skeleton-block');
  assert.equal(block.style.width, '64px');
  assert.equal(block.style.height, '64px');
  assert.equal(block.getAttribute('aria-hidden'), 'true');
  options.ariaLabel = 'Loading portrait';
  await flush();
  assert.equal(block.getAttribute('role'), 'status');
  assert.equal(block.getAttribute('aria-hidden'), null);
});
