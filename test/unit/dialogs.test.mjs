import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui, within } from './harness.mjs';

void test('Modal provides dialog naming, default footer and an accessible close button', async () => {
  mount(ui.Modal, { title: 'Edit record', 'slot:default': ui.FocusContentSlot });
  await flush();
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(
    document.getElementById(dialog.getAttribute('aria-labelledby')).textContent,
    'Edit record',
  );
  assert.ok(dialog.querySelector('button[aria-label="关闭"]'));
  assert.equal(document.activeElement, dialog.querySelector('input'));
});

void test('Modal controlled requests wait for the parent and report actual close once', async () => {
  const events = [];
  const options = rt.vm({
    open: true,
    title: 'Controlled',
    'on:openChange': (v) => events.push(v),
    'on:afterClose': (v) => events.push(v),
  });
  mount(ui.Modal, options);
  await flush();
  document.querySelector('.ja-close').click();
  await flush();
  assert.deepEqual(events, [false]);
  assert.ok(document.querySelector('.ja-modal'));
  options.open = false;
  await flush();
  assert.equal(document.querySelector('.ja-modal'), null);
  assert.deepEqual(events, [false, undefined]);
});

void test('Modal rapid open-close destroys content and releases a reference-counted body lock', async () => {
  document.body.style.overflow = 'clip';
  const first = rt.vm({ open: false });
  mount(ui.Modal, first);
  const second = mount(ui.Modal);
  await flush();
  assert.equal(document.body.style.overflow, 'hidden');
  first.open = true;
  await flush();
  first.open = false;
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 1);
  assert.equal(document.body.style.overflow, 'hidden');
  second.dispose();
  assert.equal(document.body.style.overflow, 'clip');
  document.body.style.overflow = '';
});

void test('Modal Escape closes only the top dialog and ignores composition or disabled keyboard', async () => {
  mount(ui.Modal, { title: 'Lower' });
  const upper = rt.vm({ title: 'Upper', keyboard: false });
  mount(ui.Modal, upper);
  await flush();
  const press = (init = {}) =>
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, ...init }),
    );
  press();
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 2);
  upper.keyboard = true;
  await flush();
  press({ isComposing: true });
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 2);
  press();
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 1);
  press();
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 0);
});

void test('Modal async confirmation deduplicates, locks dismissal and keeps errors or false open', async () => {
  let finish;
  let calls = 0;
  const errors = [];
  const options = rt.vm({
    title: 'Async',
    'on:confirm': () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    'on:error': (e) => errors.push(e),
  });
  mount(ui.Modal, options);
  await flush();
  const confirm = () => document.querySelector('.ja-modal-footer .primary');
  confirm().click();
  confirm().click();
  await flush();
  document.querySelector('.ja-modal-mask').click();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(calls, 1);
  assert.ok(document.querySelector('.ja-modal'));
  assert.equal(document.querySelector('.ja-close').disabled, true);
  finish(false);
  await flush();
  assert.equal(confirm().disabled, false);
  const error = new Error('Save failed');
  options['on:confirm'] = () => {
    throw error;
  };
  confirm().click();
  await flush();
  assert.deepEqual(errors, [error]);
  assert.ok(document.querySelector('.ja-modal'));
});

void test('modal.show preserves all waiters and removes its helper mount after immediate close', async () => {
  const before = document.body.children.length;
  const instance = ui.modal.show({ title: 'Result', content: 'Body', width: 640, footer: false });
  const waiting = instance.waitForClose();
  instance.close('done');
  await flush();
  assert.equal(await within(waiting), 'done');
  assert.equal(await instance.waitForClose(), 'done');
  instance.close('other');
  assert.equal(await instance.waitForClose(), 'done');
  assert.equal(document.body.children.length, before);
});

void test('Drawer shares dialog lifecycle with placements, custom footer and close results', async () => {
  const results = [];
  const options = rt.vm({
    defaultOpen: true,
    title: 'Details',
    placement: 'left',
    width: 420,
    'slot:footer': ui.FooterSlot,
    'on:afterClose': (v) => results.push(v),
  });
  const view = mount(ui.Drawer, options);
  await flush();
  const drawer = document.querySelector('.ja-drawer');
  assert.equal(drawer.dataset.placement, 'left');
  assert.equal(drawer.style.width, '420px');
  assert.ok(drawer.querySelector('[data-testid="footer-slot"]'));
  options.placement = 'top';
  await flush();
  assert.equal(drawer.dataset.placement, 'top');
  view.host.close('dismissed');
  await flush();
  assert.equal(document.querySelector('.ja-drawer'), null);
  assert.deepEqual(results, ['dismissed']);
});

void test('Closed Drawer is dormant and explicitly hidden footers do not render', async () => {
  mount(ui.Drawer, { title: 'Dormant' });
  await flush();
  assert.equal(document.querySelector('.ja-drawer'), null);
  mount(ui.Drawer, { defaultOpen: true, footer: false, 'slot:footer': ui.FooterSlot });
  await flush();
  assert.equal(document.querySelector('.ja-drawer-footer'), null);
});

void test('Modal ignores an obsolete confirmation after close and permits a new transaction on reopen', async () => {
  const pending = [];
  const events = [];
  const options = rt.vm({
    open: true,
    'on:confirm': () => new Promise((resolve) => pending.push(resolve)),
    'on:openChange': (v) => events.push(v),
  });
  mount(ui.Modal, options);
  await flush();
  const confirm = () => document.querySelector('.ja-modal-footer button.primary');
  confirm().click();
  await flush();
  options.open = false;
  await flush();
  options.open = true;
  await flush();
  assert.equal(confirm().disabled, false);
  confirm().click();
  await flush();
  assert.equal(pending.length, 2);
  pending[0](true);
  await flush();
  assert.deepEqual(events, []);
  assert.equal(confirm().disabled, true);
  pending[1](true);
  await flush();
  assert.deepEqual(events, [false]);
});

void test('Modal restores pre-existing inert and scroll styles after out-of-order owner disposal', async () => {
  const background = document.createElement('main');
  background.setAttribute('inert', 'original');
  document.body.append(background);
  document.body.style.paddingRight = '13px';
  const first = mount(ui.Modal);
  await flush();
  const second = mount(ui.Drawer, { defaultOpen: true });
  await flush();
  first.dispose();
  assert.equal(document.body.style.overflow, 'hidden');
  second.dispose();
  assert.equal(document.body.style.overflow, '');
  assert.equal(document.body.style.paddingRight, '13px');
  assert.equal(background.getAttribute('inert'), 'original');
  document.body.style.paddingRight = '';
});

void test('Initially open nested dialogs focus the child and fall back inside the parent on close', async () => {
  mount(ui.InitialDialogs);
  await flush();
  assert.equal(document.activeElement.getAttribute('aria-label'), 'Child field');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.querySelector('.ja-drawer'), null);
  assert.ok(document.activeElement.closest('.ja-modal'));
});

void test('A lower dialog popup opened later cannot intercept Escape from the foreground dialog', async () => {
  const options = rt.vm({ open: false });
  mount(ui.BackgroundPopup, options);
  await flush();
  options.open = true;
  await flush();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flush();
  assert.equal(document.querySelectorAll('.ja-modal').length, 1);
  assert.equal(document.querySelector('.ja-modal-title').textContent, 'Background');
  assert.ok(document.querySelector('.ja-popover'));
});

void test('Modal afterClose observes removed DOM and a released scroll lock', async () => {
  const results = [];
  const view = mount(ui.Modal, {
    'on:afterClose': () => {
      results.push({
        nodes: document.querySelectorAll('.ja-modal-root').length,
        overflow: document.body.style.overflow,
      });
    },
  });
  view.host.close();
  await flush();
  assert.deepEqual(results, [{ nodes: 0, overflow: '' }]);
});
