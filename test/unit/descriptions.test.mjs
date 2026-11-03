import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Descriptions renders semantic terms/definitions, a named heading, zero and missing values', () => {
  mount(ui.Descriptions, {
    title: 'Customer',
    items: [
      { key: 'name', label: 'Name', content: 'Ada' },
      { key: 'count', label: 'Count', content: 0 },
      { key: 'note', label: 'Note', content: null },
    ],
  });
  const section = document.querySelector('section.ja-descriptions');
  assert.equal(
    document.getElementById(section.getAttribute('aria-labelledby')).textContent,
    'Customer',
  );
  assert.equal(document.querySelectorAll('dl dt').length, 3);
  assert.deepEqual(
    [...document.querySelectorAll('dl dd')].map((el) => el.textContent),
    ['Ada', '0', '—'],
  );
});

void test('Descriptions supports title/label/content/extra slots with vertical/bordered presentation', () => {
  mount(ui.Descriptions, {
    'slot:title': ui.ContentSlot,
    'slot:extra': ui.TriggerSlot,
    layout: 'vertical',
    bordered: true,
    size: 'sm',
    items: [{ key: 'a', 'slot:label': ui.IconSlot, 'slot:content': ui.BodySlot, span: 'filled' }],
  });
  assert.ok(document.querySelector('.ja-descriptions.vertical.bordered.sm'));
  assert.equal(document.querySelector('.ja-descriptions-title').textContent, 'custom content');
  assert.ok(document.querySelector('dt [data-testid="icon-slot"]'));
  assert.ok(document.querySelector('dd strong'));
  assert.ok(document.querySelector('.ja-descriptions-extra button'));
  assert.ok(document.querySelector('.ja-descriptions-item.filled'));
});

void test('Descriptions keyed items keep their content state through reorder and update text reactively', async () => {
  const items = rt.vm([
    { key: 'a', label: 'A', 'slot:content': ui.FocusContentSlot },
    { key: 'b', label: 'B', content: 'Before' },
  ]);
  mount(ui.Descriptions, { items });
  const input = document.querySelector('input');
  input.value = 'Local value';
  items.reverse();
  items[0].content = 'After';
  await flush();
  assert.equal(document.querySelector('input'), input);
  assert.equal(input.value, 'Local value');
  assert.equal(document.querySelector('dd').textContent, 'After');
});

void test('Descriptions updates responsive columns, layout and custom empty text without rejecting empty items', async () => {
  const options = rt.vm({
    column: { xs: 1, md: 2, lg: 3 },
    colon: false,
    items: [{ key: 'a', label: 'A' }],
    emptyText: 'Not supplied',
  });
  const view = mount(ui.Descriptions, options);
  assert.equal(document.querySelector('dd').textContent, 'Not supplied');
  assert.equal(document.querySelector('dt').classList.contains('colon'), false);
  options.column.md = 4;
  options.column.lg = 4;
  await flush();
  assert.equal(
    document.querySelector('.ja-descriptions').style.getPropertyValue('--ja-descriptions-cols-md'),
    '4',
  );
  view.dispose();
  assert.doesNotThrow(() => mount(ui.Descriptions, { items: [] }));
});
