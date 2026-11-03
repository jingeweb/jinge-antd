import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';

void test('Progress clamps values, provides a named progressbar and infers completion', async () => {
  const options = rt.vm({ percent: -5, ariaLabel: 'Upload' });
  mount(ui.Progress, options);
  const bar = document.querySelector('[role="progressbar"]');
  assert.equal(bar.getAttribute('aria-label'), 'Upload');
  assert.equal(bar.getAttribute('aria-valuemin'), '0');
  assert.equal(bar.getAttribute('aria-valuemax'), '100');
  assert.equal(bar.getAttribute('aria-valuenow'), '0');
  options.percent = 130;
  await flush();
  assert.equal(bar.getAttribute('aria-valuenow'), '100');
  assert.ok(bar.classList.contains('success'));
  assert.equal(bar.getAttribute('aria-valuetext'), '100%（完成）');
  assert.equal(document.querySelector('.ja-progress-info').textContent, '✓ 100%');
  assert.equal(document.querySelector('.ja-progress-bar').style.width, '100%');
  options.percent = Number.NaN;
  await flush();
  assert.equal(bar.getAttribute('aria-valuenow'), '0');
});

void test('Progress circle uses normalized SVG geometry and updates with its value', async () => {
  const options = rt.vm({ type: 'circle', percent: 65, width: 72, strokeWidth: 4 });
  mount(ui.Progress, options);
  const circle = document.querySelector('.ja-progress-path');
  assert.equal(circle.getAttribute('r'), '48');
  assert.equal(circle.getAttribute('pathLength'), '100');
  assert.equal(circle.getAttribute('stroke-dasharray'), '65 100');
  assert.equal(document.querySelector('.ja-progress').style.width, '72px');
  options.percent = 30;
  await flush();
  assert.equal(circle.getAttribute('stroke-dasharray'), '30 100');
  options.percent = 0;
  await flush();
  assert.equal(circle.getAttribute('opacity'), '0');
});

void test('Progress supports formats, explicit status, colors and information hiding', async () => {
  const options = rt.vm({
    percent: 100,
    status: 'exception',
    format: (p) => `${p} of 100`,
    strokeColor: '#123456',
    trailColor: '#eeeeee',
    showInfo: true,
  });
  mount(ui.Progress, options);
  const progress = document.querySelector('.ja-progress');
  assert.ok(progress.classList.contains('exception'));
  assert.equal(progress.getAttribute('aria-valuetext'), '100 of 100');
  assert.equal(document.querySelector('.ja-progress-info').textContent, '100 of 100');
  assert.equal(progress.style.getPropertyValue('--ja-progress-color'), '#123456');
  options.showInfo = false;
  await flush();
  assert.equal(document.querySelector('.ja-progress-info'), null);
  options.format = undefined;
  options.percent = 70;
  options.showInfo = true;
  await flush();
  assert.equal(progress.getAttribute('aria-valuetext'), '70%（失败）');
  assert.equal(document.querySelector('.ja-progress-info').textContent, '! 70%');
});

void test('Progress scoped info receives normalized values and a separate accessible value text', async () => {
  const options = rt.vm({
    percent: 25,
    status: 'active',
    'slot:info': ui.ProgressInfoSlot,
    valueText: 'A quarter complete',
  });
  mount(ui.Progress, options);
  assert.equal(document.querySelector('.ja-progress-info strong').textContent, '25:active');
  assert.equal(
    document.querySelector('.ja-progress').getAttribute('aria-valuetext'),
    'A quarter complete',
  );
  options.percent = 50;
  await flush();
  assert.equal(document.querySelector('.ja-progress-info strong').textContent, '50:active');
});
