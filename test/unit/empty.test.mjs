import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Empty has a default decorative illustration and description without an unsolicited live region', () => {
  mount(ui.Empty);
  assert.equal(document.querySelector('.ja-empty-description').textContent, '暂无数据');
  assert.ok(document.querySelector('.ja-empty-image svg'));
  assert.equal(document.querySelector('.ja-empty-image').getAttribute('aria-hidden'), 'true');
  assert.equal(document.querySelector('.ja-empty').getAttribute('role'), null);
});

void test('Empty supports description/image slots and an independent action area', () => {
  mount(ui.Empty, {
    description: 'Plain',
    image: '/image.svg',
    'slot:description': ui.ContentSlot,
    'slot:image': ui.IconSlot,
    'slot:default': ui.TriggerSlot,
    size: 'sm',
    style: 'color:red',
  });
  assert.equal(document.querySelector('.ja-empty-description').textContent, 'custom content');
  assert.ok(document.querySelector('.ja-empty-image [data-testid="icon-slot"]'));
  assert.ok(document.querySelector('.ja-empty-footer button'));
  assert.ok(document.querySelector('.ja-empty.sm'));
  assert.equal(document.querySelector('.ja-empty').style.color, 'red');
});

void test('Empty false values hide image/description including their slots and announce can be enabled', async () => {
  const options = rt.vm({
    image: false,
    description: false,
    announce: false,
    'slot:image': ui.IconSlot,
    'slot:description': ui.ContentSlot,
    'slot:default': ui.TriggerSlot,
  });
  mount(ui.Empty, options);
  assert.equal(document.querySelector('.ja-empty-image'), null);
  assert.equal(document.querySelector('.ja-empty-description'), null);
  assert.ok(document.querySelector('.ja-empty-footer'));
  options.announce = true;
  await flush();
  assert.equal(document.querySelector('.ja-empty').getAttribute('role'), 'status');
});

void test('Empty image failures fall back to the built-in illustration and a new source retries', async () => {
  const errors = [];
  const options = rt.vm({ image: '/first.svg', 'on:error': (event) => errors.push(event.type) });
  mount(ui.Empty, options);
  document.querySelector('.ja-empty-image img').dispatchEvent(new Event('error'));
  await flush();
  assert.equal(document.querySelector('.ja-empty-image img'), null);
  assert.ok(document.querySelector('.ja-empty-image svg'));
  assert.deepEqual(errors, ['error']);
  options.image = '/second.svg';
  await flush();
  assert.equal(document.querySelector('.ja-empty-image img').getAttribute('src'), '/second.svg');
});
