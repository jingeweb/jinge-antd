import { icons } from '@iconify-json/ant-design';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

function geometry(svg) {
  return [...svg.querySelectorAll('*')].map((element) => ({
    tag: element.tagName,
    attributes: [...element.attributes]
      .map(({ name, value }) => [name, value])
      .sort(([a], [b]) => a.localeCompare(b)),
  }));
}
void test('Internal SVG components preserve the upstream Ant Design paths and remain decorative', () => {
  const names = Object.keys(ui).filter((name) => name.startsWith('AntDesign'));
  assert.ok(names.length >= 20);
  for (const name of names) {
    const key = name
      .slice('AntDesign'.length)
      .replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())
      .slice(1);
    const data = icons.icons[key];
    assert.ok(data, `Unknown upstream icon ${key}`);
    const view = mount(ui[name]);
    const actual = document.querySelector('svg');
    const template = document.createElement('div');
    template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${data.body}</svg>`;
    assert.deepEqual(geometry(actual), geometry(template.firstElementChild), key);
    assert.equal(
      actual.getAttribute('viewBox'),
      `0 0 ${data.width ?? icons.width} ${data.height ?? icons.height}`,
    );
    assert.equal(actual.getAttribute('aria-hidden'), 'true');
    assert.equal(actual.getAttribute('focusable'), 'false');
    view.dispose();
  }
});
void test('Internal icons are absent from the public component entry point', () => {
  assert.equal(
    Object.keys(ui.publicComponents).some((name) => name.startsWith('AntDesign')),
    false,
  );
});
void test('Steps use SVG status symbols while preserving step numbers and accessible status text', async () => {
  const props = rt.vm({
    items: [
      { key: 'first', title: 'First' },
      { key: 'second', title: 'Second' },
    ],
    current: 1,
  });
  mount(ui.Steps, props);
  assert.ok(document.querySelector('.finish .ja-step-icon svg'));
  assert.equal(document.querySelector('.process .ja-step-icon').textContent, '2');
  props.status = 'error';
  await flush();
  assert.ok(document.querySelector('.error .ja-step-icon svg'));
  assert.equal(document.querySelector('.error .ja-step-status').textContent, '错误');
});
void test('Avatar without text or image uses the internal user SVG and retains its accessible name', () => {
  mount(ui.Avatar, { ariaLabel: 'Account' });
  assert.ok(document.querySelector('.ja-avatar-fallback svg'));
  assert.equal(document.querySelector('.ja-avatar').getAttribute('aria-label'), 'Account');
  assert.equal(document.querySelector('.ja-avatar').textContent, '');
});
void test('Select renders real SVG arrow, loading and selection indicators', async () => {
  const props = rt.vm({ value: 0, options: [{ value: 0, label: 'Zero' }], loading: false });
  mount(ui.Select, props);
  assert.ok(document.querySelector('.ja-select-arrow svg'));
  document.querySelector('[role=combobox]').click();
  await flush();
  assert.ok(document.querySelector('[role=option] .ja-select-check'));
  assert.equal(document.querySelector('[role=option]').textContent.trim(), 'Zero');
  props.loading = true;
  await flush();
  assert.ok(document.querySelector('.ja-select-arrow .ja-icon-spin'));
});
