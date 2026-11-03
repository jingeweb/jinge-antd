import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, mount, flush } from './harness.mjs';

void test('Space preserves children and reacts to direction, wrapping and gap changes', async () => {
  const props = rt.vm({
    size: 'md',
    direction: 'horizontal',
    wrap: false,
    'slot:default': ui.BodySlot,
  });
  mount(ui.Space, props);
  const el = document.querySelector('.ja-space');
  assert.equal(el.style.gap, '16px');
  assert.equal(el.querySelector('strong').textContent, 'slot body');
  props.size = [4, 12];
  props.direction = 'vertical';
  props.wrap = true;
  await flush();
  assert.equal(el.style.gap, '4px 12px');
  assert.ok(el.classList.contains('vertical') && el.classList.contains('wrap'));
});
void test('Flex forwards layout choices without introducing wrapper children', () => {
  mount(ui.Flex, {
    gap: 'lg',
    justify: 'space-between',
    align: 'center',
    wrap: true,
    'slot:default': ui.BodySlot,
  });
  const el = document.querySelector('.ja-flex');
  assert.equal(el.style.gap, '24px');
  assert.equal(el.style.justifyContent, 'space-between');
  assert.equal(el.style.alignItems, 'center');
  assert.equal(el.style.flexWrap, 'wrap');
  assert.equal(el.children.length, 1);
  assert.equal(el.firstElementChild.tagName, 'STRONG');
});
void test('Divider exposes its orientation and optional text slot', async () => {
  const props = rt.vm({ type: 'horizontal', dashed: true, 'slot:default': ui.BodySlot });
  mount(ui.Divider, props);
  const el = document.querySelector('[role=separator]');
  assert.equal(el.getAttribute('aria-orientation'), 'horizontal');
  assert.ok(el.classList.contains('with-text') && el.classList.contains('dashed'));
  assert.equal(el.querySelector('strong').textContent, 'slot body');
  props.type = 'vertical';
  await flush();
  assert.equal(el.getAttribute('aria-orientation'), 'vertical');
});
void test('Typography Text and Paragraph preserve slots and styling updates', async () => {
  const props = rt.vm({
    tone: 'secondary',
    strong: true,
    ellipsis: true,
    'slot:default': ui.BodySlot,
  });
  mount(ui.Text, props);
  const el = document.querySelector('span.ja-typography');
  assert.ok(el.classList.contains('strong') && el.classList.contains('ellipsis'));
  props.tone = 'danger';
  await flush();
  assert.ok(el.classList.contains('danger'));
  assert.equal(el.classList.contains('secondary'), false);
  mount(ui.Paragraph, { 'slot:default': ui.BodySlot });
  assert.ok(document.querySelector('p.ja-paragraph strong'));
});
void test('Typography Title uses real semantic headings and updates level', async () => {
  const props = rt.vm({ level: 2, 'slot:default': ui.BodySlot });
  mount(ui.Title, props);
  assert.ok(document.querySelector('h2.ja-title strong'));
  props.level = 4;
  await flush();
  await flush();
  assert.equal(document.querySelector('h2'), null);
  assert.equal(document.querySelector('h4 strong').textContent, 'slot body');
});
void test('Typography Link secures external links and removes navigation when disabled', async () => {
  const props = rt.vm({
    href: 'https://example.com',
    target: '_blank',
    disabled: false,
    'slot:default': ui.BodySlot,
  });
  mount(ui.Link, props);
  const el = document.querySelector('a');
  assert.equal(el.getAttribute('rel'), 'noopener noreferrer');
  props.disabled = true;
  await flush();
  assert.equal(el.getAttribute('href'), null);
  assert.equal(el.tabIndex, -1);
  assert.equal(el.getAttribute('aria-disabled'), 'true');
});
void test('SVG icons default to decoration and support meaningful reactive labels and size', async () => {
  const props = rt.vm({ size: 24, color: 'red' });
  mount(ui.AntDesignCheckCircleFilled, props);
  const svg = document.querySelector('svg');
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
  assert.equal(svg.style.fontSize, '24px');
  props.ariaLabel = 'Success';
  await flush();
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.getAttribute('aria-label'), 'Success');
  assert.equal(svg.getAttribute('aria-hidden'), null);
});
void test('LoadingOutlined is optionally a named live status', () => {
  mount(ui.LoadingOutlined, { ariaLabel: 'Loading' });
  assert.equal(document.querySelector('[role=status]').getAttribute('aria-label'), 'Loading');
  assert.equal(document.querySelector('[role=status]').getAttribute('aria-hidden'), null);
});

void test('Grid Row applies tuple gutters, alignment and wrapping', async () => {
  const props = rt.vm({ gutter: [12, 16], justify: 'space-between', 'slot:default': ui.BodySlot });
  mount(ui.Row, props);
  const row = document.querySelector('.ja-row');
  assert.equal(row.style.getPropertyValue('--ja-grid-gutter'), '16px');
  assert.equal(row.style.rowGap, '12px');
  props.gutter = 8;
  props.wrap = false;
  await flush();
  assert.equal(row.style.getPropertyValue('--ja-grid-gutter'), '8px');
  assert.equal(row.style.flexWrap, 'nowrap');
});
void test('Grid Col updates responsive widths and clamps out-of-range spans', async () => {
  const props = rt.vm({ span: 12, md: { span: 8, offset: 4 }, 'slot:default': ui.BodySlot });
  mount(ui.Col, props);
  const col = document.querySelector('.ja-col');
  assert.ok(col.classList.contains('span-12'));
  assert.ok(col.classList.contains('md-span-8') && col.classList.contains('md-offset-4'));
  props.span = 30;
  props.md = 0;
  await flush();
  assert.ok(col.classList.contains('span-24') && col.classList.contains('md-span-0'));
});
void test('Layout exposes semantic parts and an explicit horizontal sider composition', () => {
  mount(ui.Layout, { hasSider: true, 'slot:default': ui.BodySlot });
  mount(ui.LayoutHeader, { 'slot:default': ui.BodySlot });
  mount(ui.Content, { 'slot:default': ui.BodySlot });
  mount(ui.LayoutFooter, { 'slot:default': ui.BodySlot });
  assert.ok(document.querySelector('.ja-layout.has-sider'));
  assert.ok(document.querySelector('header.ja-layout-header strong'));
  assert.ok(document.querySelector('section.ja-layout-content strong'));
  assert.ok(document.querySelector('footer.ja-layout-footer strong'));
});
void test('Sider toggles uncontrolled state without destroying its content', async () => {
  const changes = [];
  mount(ui.Sider, {
    collapsible: true,
    'slot:default': ui.BodySlot,
    'on:collapse': (value) => changes.push(value),
  });
  const body = document.querySelector('strong');
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('aside').style.width, '80px');
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'false');
  assert.equal(document.querySelector('strong'), body);
  assert.deepEqual(changes, [true]);
});
void test('Sider controlled mode requests collapse and waits for updated props', async () => {
  const changes = [];
  const props = rt.vm({
    collapsed: false,
    collapsible: true,
    width: 180,
    collapsedWidth: 60,
    'slot:default': ui.BodySlot,
    'on:collapse': (value) => changes.push(value),
  });
  mount(ui.Sider, props);
  document.querySelector('button').click();
  await flush();
  assert.equal(document.querySelector('aside').style.width, '180px');
  assert.deepEqual(changes, [true]);
  props.collapsed = true;
  await flush();
  assert.equal(document.querySelector('aside').style.width, '60px');
});
