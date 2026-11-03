import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, input, mount, rt, ui } from './harness.mjs';

void test('TextArea supports multiline defaults, native form attributes, rows and exposed selection', () => {
  const view = mount(ui.TextArea, {
    defaultValue: 'First\nSecond',
    rows: 4,
    name: 'notes',
    ariaLabel: 'Notes',
    maxLength: 100,
  });
  const field = document.querySelector('textarea');
  assert.equal(field.value, 'First\nSecond');
  assert.equal(field.rows, 4);
  assert.equal(field.name, 'notes');
  view.host.focus();
  view.host.select();
  assert.equal(document.activeElement, field);
  assert.equal(field.selectionEnd, field.value.length);
  assert.doesNotThrow(() => view.host.resize());
});

void test('TextArea controlled updates, counting and clearing follow the text empty-value contract', async () => {
  const changes = [];
  const options = rt.vm({
    value: 'Notes',
    allowClear: true,
    showCount: true,
    maxLength: 20,
    'on:change': (value) => {
      changes.push(value);
      options.value = value;
    },
  });
  mount(ui.TextArea, options);
  input('New\nNotes', 'textarea');
  await flush();
  assert.equal(document.querySelector('.ja-input-count').textContent, '9 / 20');
  document.querySelector('.ja-input-clear').click();
  await flush();
  assert.deepEqual(changes, ['New\nNotes', '']);
  assert.equal(document.querySelector('textarea').value, '');
});

void test('TextArea autoSize observers disconnect and ignore callbacks after owner destruction', () => {
  const previous = window.ResizeObserver;
  const callbacks = [];
  let disconnected = 0;
  window.ResizeObserver = class {
    constructor(callback) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {
      disconnected++;
    }
  };
  try {
    const view = mount(ui.TextArea, { autoSize: { minRows: 2, maxRows: 4 } });
    assert.equal(callbacks.length, 1);
    view.dispose();
    assert.equal(disconnected, 1);
    assert.doesNotThrow(() => callbacks[0]([{ contentRect: { width: 200 } }]));
    assert.equal(document.querySelector('textarea'), null);
  } finally {
    window.ResizeObserver = previous;
  }
});
