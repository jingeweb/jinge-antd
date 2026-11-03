import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Avatar renders named image semantics, text fallback, size and shape updates', async () => {
  const options = rt.vm({ alt: 'Ada', size: 'sm', shape: 'square', className: 'custom' });
  mount(ui.Avatar, options);
  const avatar = document.querySelector('.ja-avatar');
  assert.equal(avatar.getAttribute('role'), 'img');
  assert.equal(avatar.getAttribute('aria-label'), 'Ada');
  assert.equal(avatar.textContent, 'A');
  assert.equal(avatar.style.width, '24px');
  assert.ok(avatar.classList.contains('square'));
  options.size = 48;
  options.shape = 'circle';
  await flush();
  assert.equal(avatar.style.width, '48px');
  assert.ok(avatar.classList.contains('circle'));
});

void test('Avatar image failure uses fallback and changing src retries the image', async () => {
  const errors = [];
  const options = rt.vm({
    src: '/first.png',
    alt: 'Customer',
    'on:error': (event) => errors.push(event.type),
  });
  mount(ui.Avatar, options);
  const first = document.querySelector('img');
  assert.equal(first.getAttribute('src'), '/first.png');
  assert.equal(first.alt, '');
  first.dispatchEvent(new Event('error'));
  await flush();
  assert.equal(document.querySelector('img'), null);
  assert.equal(document.querySelector('.ja-avatar').textContent, 'C');
  assert.deepEqual(errors, ['error']);
  options.src = '/second.png';
  await flush();
  assert.equal(document.querySelector('img').getAttribute('src'), '/second.png');
});

void test('Avatar supports icon and text slots, custom styles and invalid-size fallback', async () => {
  const first = mount(ui.Avatar, {
    'slot:icon': ui.IconSlot,
    ariaLabel: 'Team',
    size: -1,
    style: 'background:red',
  });
  assert.ok(document.querySelector('[data-testid="icon-slot"]'));
  assert.equal(document.querySelector('.ja-avatar').style.width, '32px');
  assert.equal(document.querySelector('.ja-avatar').style.background, 'red');
  first.dispose();
  mount(ui.Avatar, { 'slot:default': ui.BodySlot, 'slot:icon': ui.IconSlot });
  assert.ok(document.querySelector('[data-testid="body-slot"]'));
  assert.equal(document.querySelector('[data-testid="icon-slot"]'), null);
  await flush();
});
