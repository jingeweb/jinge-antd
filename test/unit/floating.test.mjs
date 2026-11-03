import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ui, rt, mount, flush, sleep } from './harness.mjs';

const rect = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});
const props = (extra = {}) => ({
  zIndex: 10,
  'slot:trigger': ui.TriggerSlot,
  'slot:default': ui.BodySlot,
  ...extra,
});

for (const side of ['top', 'bottom', 'left', 'right'])
  for (const alignment of ['', '-start', '-end']) {
    void test(`Floating positions ${side}${alignment} inside its viewport`, () => {
      const result = ui.calcPosition(
        rect(160, 160, 80, 40),
        rect(0, 0, 90, 60),
        { width: 400, height: 400 },
        ui.getPlacementOpt(`${side}${alignment}`),
        10,
        undefined,
        8,
      );
      assert.ok(result.x >= 8 && result.y >= 8);
      assert.ok(result.x + 90 <= 392 && result.y + 60 <= 392);
      assert.equal(result.placement, `${side}${alignment}`);
    });
  }
void test('Floating constrains oversized content instead of producing negative coordinates', () => {
  const result = ui.calcPosition(
    rect(50, 50, 30, 20),
    rect(0, 0, 400, 400),
    { width: 300, height: 200 },
    ui.getPlacementOpt('top'),
    10,
    undefined,
    8,
  );
  assert.ok(result.x >= 8 && result.y >= 8);
  assert.ok(result.x + result.maxWidth <= 292);
  assert.ok(result.y + result.maxHeight <= 192);
});
void test('Floating left flip accounts for width and returns usable width constraints', () => {
  const result = ui.calcPosition(
    rect(10, 80, 20, 20),
    rect(0, 0, 280, 60),
    { width: 300, height: 300 },
    ui.getPlacementOpt('left-start'),
    10,
    undefined,
    8,
  );
  assert.equal(result.placement, 'right-start');
  assert.ok(result.x + result.maxWidth <= 292);
});
void test('Floating handles empty viewport bounds and normalizes negative delays', () => {
  const result = ui.calcPosition(
    rect(0, 0, 0, 0),
    rect(0, 0, 100, 100),
    { width: 0, height: 0 },
    ui.getPlacementOpt('bottom'),
    10,
    undefined,
    8,
  );
  assert.equal(result.x, 0);
  assert.equal(result.y, 0);
  assert.deepEqual(ui.getDelayOpt({ open: -5, close: -10 }), { open: 0, close: 0 });
});
void test('Floating toggles on repeated clicks and notifies in uncontrolled mode', async () => {
  const changes = [];
  mount(ui.Floating, props({ 'on:openChange': (value) => changes.push(value) }));
  const trigger = document.querySelector('button');
  trigger.click();
  await flush();
  assert.ok(document.querySelector('.ja-floating'));
  trigger.click();
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
  assert.deepEqual(changes, [true, false]);
});
void test('Floating supports defaultOpen and removes content without transitionend', async () => {
  mount(ui.Floating, props({ defaultOpen: true }));
  await flush();
  assert.ok(document.querySelector('.ja-floating'));
  document.documentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
});
void test('Floating opens on focus and closes when focus leaves its whole region', async () => {
  mount(ui.Floating, props({ triggerMethod: 'focus' }));
  document.querySelector('button').focus();
  await flush();
  assert.ok(document.querySelector('.ja-floating'));
  document.querySelector('button').blur();
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
});
void test('Floating Escape closes only the panel and cleans its aria relation', async () => {
  mount(ui.Floating, props({ triggerMethod: ['hover', 'focus'], role: 'tooltip' }));
  const trigger = document.querySelector('button');
  trigger.focus();
  await flush();
  const panel = document.querySelector('[role=tooltip]');
  assert.ok(panel?.id);
  assert.equal(trigger.getAttribute('aria-describedby'), panel.id);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
  assert.equal(trigger.getAttribute('aria-describedby'), null);
  assert.equal(document.activeElement, trigger);
});
void test('Floating is disabled even for a synthetic trigger click', async () => {
  mount(ui.Floating, props({ disabled: true }));
  document.querySelector('button').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
});
void test('Floating dynamic trigger mode and disabled state cancel pending hover opens', async () => {
  const values = [];
  const options = rt.vm(
    props({ triggerMethod: 'hover', delay: 60, 'on:openChange': (value) => values.push(value) }),
  );
  mount(ui.Floating, options);
  document.querySelector('button').dispatchEvent(new MouseEvent('mouseenter'));
  options.disabled = true;
  await sleep(90);
  assert.deepEqual(values, []);
  options.disabled = false;
  options.triggerMethod = 'click';
  options.delay = 0;
  await flush();
  document.querySelector('button').click();
  await flush();
  assert.ok(document.querySelector('.ja-floating'));
});
void test('Floating cancels a pending hover close on return and after unmount', async () => {
  const values = [];
  const view = mount(
    ui.Floating,
    props({
      triggerMethod: 'hover',
      delay: { open: 0, close: 60 },
      'on:openChange': (value) => values.push(value),
    }),
  );
  const trigger = document.querySelector('button');
  trigger.dispatchEvent(new MouseEvent('mouseenter'));
  await flush();
  trigger.dispatchEvent(new MouseEvent('mouseleave'));
  trigger.dispatchEvent(new MouseEvent('mouseenter'));
  await sleep(90);
  assert.ok(document.querySelector('.ja-floating'));
  trigger.dispatchEvent(new MouseEvent('mouseleave'));
  view.dispose();
  await sleep(90);
  assert.deepEqual(values, [true]);
});
void test('Floating restores pre-existing trigger aria attributes when destroyed', async () => {
  const view = mount(ui.Floating, props());
  const trigger = document.querySelector('button');
  trigger.setAttribute('aria-describedby', 'external-description');
  trigger.click();
  await flush();
  view.dispose();
  assert.equal(trigger.getAttribute('aria-describedby'), 'external-description');
  assert.equal(trigger.getAttribute('aria-controls'), null);
  assert.equal(trigger.getAttribute('aria-expanded'), null);
});
void test('Safe polygon helpers include boundaries and reject empty geometry', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(ui.isPointInPolygon(0, 5, square), true);
  assert.equal(ui.isPointInPolygon(10, 5, square), true);
  assert.equal(ui.isPointInPolygon2(0, 0, []), false);
});

void test('Floating restores tooltip descriptions when changing role while open', async () => {
  const options = rt.vm(props({ role: 'tooltip', triggerMethod: 'click' }));
  mount(ui.Floating, options);
  const trigger = document.querySelector('button');
  trigger.click();
  await flush();
  assert.ok(trigger.getAttribute('aria-describedby'));
  options.role = 'dialog';
  await flush();
  assert.equal(trigger.getAttribute('aria-describedby'), null);
  assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog');
});

void test('Floating nested portals treat child actions as inside their parent and Escape closes one level', async () => {
  mount(ui.NestedFloating, { initiallyOpen: true });
  await flush();
  assert.equal(document.querySelectorAll('.ja-floating').length, 2);
  document
    .querySelector('#child-action')
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await flush();
  assert.equal(document.querySelectorAll('.ja-floating').length, 2);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.querySelectorAll('.ja-floating').length, 1);
  assert.ok(document.querySelector('#parent-action'));
});
void test('Floating optionally focuses its content and restores trigger focus without reopening', async () => {
  mount(
    ui.Floating,
    props({
      autoFocus: true,
      triggerMethod: ['click', 'focus'],
      'slot:default': ui.FocusContentSlot,
    }),
  );
  const trigger = document.querySelector('button');
  trigger.focus();
  await flush();
  assert.equal(document.activeElement, document.querySelector('input'));
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.activeElement, trigger);
  assert.equal(document.querySelector('.ja-floating'), null);
});
void test('Floating observers, pending frames and ancestor listeners are released on close', async () => {
  const previousObserver = globalThis.ResizeObserver;
  const previousRAF = globalThis.requestAnimationFrame,
    previousCancel = globalThis.cancelAnimationFrame;
  const observers = [],
    cancelled = [];
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.active = true;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.active = false;
    }
  };
  globalThis.requestAnimationFrame = () => 99;
  globalThis.cancelAnimationFrame = (id) => cancelled.push(id);
  let view;
  try {
    view = mount(ui.Floating, props());
    const trigger = document.querySelector('button');
    let measurements = 0;
    trigger.getBoundingClientRect = () => {
      measurements++;
      return rect(100, 100, 60, 20);
    };
    trigger.click();
    await flush();
    const count = measurements;
    window.dispatchEvent(new Event('resize'));
    assert.ok(measurements > count);
    observers.at(-1).callback([{ target: trigger }]);
    trigger.click();
    await flush();
    const after = measurements;
    window.dispatchEvent(new Event('resize'));
    assert.equal(measurements, after);
    assert.ok(observers.every((observer) => !observer.active));
    assert.ok(cancelled.includes(99));
  } finally {
    view?.dispose();
    globalThis.ResizeObserver = previousObserver;
    globalThis.requestAnimationFrame = previousRAF;
    globalThis.cancelAnimationFrame = previousCancel;
  }
});

void test('autoUpdate ignores already queued observer callbacks after cleanup', () => {
  const previousIO = globalThis.IntersectionObserver,
    previousRO = globalThis.ResizeObserver;
  const previousTimeout = window.setTimeout;
  const intersections = [],
    resizes = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      intersections.push(this);
    }
    observe() {}
    disconnect() {}
  };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      resizes.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  let stop;
  try {
    const anchor = document.createElement('button'),
      panel = document.createElement('div');
    document.body.append(anchor, panel);
    anchor.getBoundingClientRect = () => rect(100, 100, 60, 20);
    let updates = 0,
      lateTimers = 0;
    stop = ui.autoUpdate(anchor, panel, () => updates++);
    const count = updates;
    stop();
    window.setTimeout = (...args) => {
      lateTimers++;
      return previousTimeout(...args);
    };
    intersections.at(-1).callback([{ intersectionRatio: 0 }]);
    resizes.at(-1).callback([{ target: anchor }]);
    assert.equal(updates, count);
    assert.equal(lateTimers, 0);
  } finally {
    stop?.();
    window.setTimeout = previousTimeout;
    globalThis.IntersectionObserver = previousIO;
    globalThis.ResizeObserver = previousRO;
  }
});

void test('Floating installs document dismiss handlers only while its panel is mounted', async () => {
  // oxlint-disable-next-line typescript/unbound-method -- Preserve the original for restoration; invoked with .call(this).
  const add = document.addEventListener;
  // oxlint-disable-next-line typescript/unbound-method -- Preserve the original for restoration; invoked with .call(this).
  const remove = document.removeEventListener;
  const types = new Set(['focusin', 'mousedown', 'touchstart', 'keydown']);
  let added = 0,
    removed = 0,
    view;
  document.addEventListener = function (type, ...args) {
    if (types.has(type)) added++;
    return add.call(this, type, ...args);
  };
  document.removeEventListener = function (type, ...args) {
    if (types.has(type)) removed++;
    return remove.call(this, type, ...args);
  };
  try {
    view = mount(ui.Floating, props());
    assert.equal(added, 0);
    const trigger = document.querySelector('button');
    trigger.click();
    await flush();
    assert.equal(added, 4);
    trigger.click();
    await flush();
    assert.equal(removed, 4);
  } finally {
    view?.dispose();
    document.addEventListener = add;
    document.removeEventListener = remove;
  }
});

void test('Floating focus-only mode closes when a focused content input is blurred', async () => {
  mount(
    ui.Floating,
    props({ autoFocus: true, triggerMethod: 'focus', 'slot:default': ui.FocusContentSlot }),
  );
  document.querySelector('button').focus();
  await flush();
  const input = document.querySelector('input');
  assert.equal(document.activeElement, input);
  input.blur();
  await flush();
  assert.equal(document.querySelector('.ja-floating'), null);
});
