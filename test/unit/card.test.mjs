import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Card renders a named section, heading and its body', () => {
  mount(ui.Card, { title: 'Account', 'slot:default': ui.BodySlot });
  const card = document.querySelector('section.ja-card');
  assert.ok(card);
  assert.equal(
    document.getElementById(card.getAttribute('aria-labelledby')).textContent,
    'Account',
  );
  assert.equal(card.querySelector('h3').textContent, 'Account');
  assert.ok(card.querySelector('.ja-card-body [data-testid="body-slot"]'));
});

void test('Card prioritizes title slots and exposes extra, cover and actions without changing them', () => {
  mount(ui.Card, {
    title: 'Plain',
    'slot:title': ui.ContentSlot,
    'slot:extra': ui.TriggerSlot,
    'slot:cover': ui.IconSlot,
    'slot:actions': ui.FooterSlot,
  });
  assert.equal(document.querySelector('.ja-card-title').textContent, 'custom content');
  assert.ok(document.querySelector('.ja-card-extra button'));
  assert.ok(document.querySelector('.ja-card-cover [data-testid="icon-slot"]'));
  assert.ok(document.querySelector('.ja-card-actions [data-testid="footer-slot"]'));
});

void test('Card loading hides but preserves its body and restores its input value', async () => {
  const options = rt.vm({ title: 'Edit', loading: false, 'slot:default': ui.FocusContentSlot });
  mount(ui.Card, options);
  const input = document.querySelector('input');
  input.value = 'Unsaved edit';
  options.loading = true;
  await flush();
  assert.equal(document.querySelector('.ja-card').getAttribute('aria-busy'), 'true');
  assert.equal(document.querySelector('.ja-card-body').hidden, true);
  assert.ok(document.querySelector('[role="status"]'));
  options.loading = false;
  await flush();
  assert.equal(document.querySelector('.ja-card-body').hasAttribute('hidden'), false);
  assert.equal(document.querySelector('input'), input);
  assert.equal(input.value, 'Unsaved edit');
});

void test('Card supports a headerless body, reactive presentation and optional content', async () => {
  const options = rt.vm({
    size: 'sm',
    bordered: false,
    hoverable: true,
    className: 'custom',
    style: 'width:320px',
  });
  mount(ui.Card, options);
  assert.equal(document.querySelector('.ja-card-header'), null);
  assert.ok(document.querySelector('.ja-card.sm.borderless.hoverable.custom'));
  assert.equal(document.querySelector('.ja-card').style.width, '320px');
  options.size = 'md';
  await flush();
  assert.ok(document.querySelector('.ja-card.md'));
});
