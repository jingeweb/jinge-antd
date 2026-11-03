import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { flush, mount, sleep, ui, within } from './harness.mjs';

afterEach(() => {
  ui.message.clear();
  ui.notification?.clear();
});

void test('Message clear finishes every lifecycle once and removes an empty container', async () => {
  const calls = [];
  const notices = ['a', 'b'].map((content) =>
    ui.message.info({ content, duration: 0, 'on:close': () => calls.push(content) }),
  );
  await flush();
  ui.message.clear();
  notices[0].close();
  await within(Promise.all(notices.map((n) => n.waitClose())));
  await flush();
  assert.deepEqual(calls, ['a', 'b']);
  assert.equal(document.querySelector('.ja-message-container'), null);
});

void test('Message renders rich content, polite status and error alert without taking focus', async () => {
  const button = document.createElement('button');
  document.body.append(button);
  button.focus();
  ui.message.info({ 'slot:content': ui.ContentSlot, duration: 0 });
  ui.message.error({ content: 'Error', duration: 0 });
  await flush();
  assert.ok(document.querySelector('.ja-message[role="status"] [data-testid="content-slot"]'));
  assert.equal(document.querySelector('.ja-message[role="alert"]').textContent.trim(), 'Error');
  assert.equal(document.activeElement, button);
});

void test('Message update restarts duration, accepts zero, and cannot revive a closed instance', async () => {
  const notice = ui.message.loading({ content: 'Loading', duration: 25 });
  notice.update({ duration: 0, type: 'success', content: 'Ready' });
  await sleep(60);
  assert.equal(document.querySelector('.ja-message .content').textContent, 'Ready');
  notice.update({ duration: 25 });
  await within(notice.waitClose());
  notice.update({ duration: 1, content: 'Late' });
  await flush();
  assert.equal(document.querySelector('.ja-message'), null);
  assert.equal(notice.waitClose(), notice.waitClose());
});

void test('Message config updates a live container and maxCount evicts the oldest instance', async () => {
  ui.message.configContainer({ maxCount: 2 });
  let closed = 0;
  const first = ui.message.info({ content: 'First', duration: 0, 'on:close': () => closed++ });
  ui.message.info({ content: 'Second', duration: 0 });
  ui.message.info({ content: 'Third', duration: 0 });
  ui.message.configContainer({ paddingTop: 32 });
  await flush();
  assert.equal(closed, 1);
  await within(first.waitClose());
  assert.equal(document.querySelectorAll('.ja-message').length, 2);
  assert.equal(document.querySelector('.ja-message-container').style.paddingTop, '32px');
});

void test('Message close remains settled when a close callback throws or opens a replacement', async () => {
  const previous = console.error;
  const errors = [];
  console.error = (error) => errors.push(error);
  try {
    const error = new Error('Callback failure');
    const first = ui.message.info({
      content: 'First',
      duration: 0,
      'on:close': () => {
        ui.message.success({ content: 'Replacement', duration: 0 });
        throw error;
      },
    });
    ui.message.clear();
    await within(first.waitClose());
    await flush();
    assert.deepEqual(errors, [error]);
    assert.equal(document.querySelector('.ja-message .content').textContent, 'Replacement');
  } finally {
    console.error = previous;
  }
});

void test('Notification supports rich title/content/actions, an accessible close button and all waiters', async () => {
  const notice = ui.notification.success({
    title: 'Task complete',
    'slot:content': ui.ContentSlot,
    'slot:actions': ui.FooterSlot,
    duration: 0,
  });
  await flush();
  const card = document.querySelector('.ja-notification');
  assert.equal(card.querySelector('.ja-notification-title').textContent, 'Task complete');
  assert.ok(card.querySelector('[data-testid="content-slot"]'));
  assert.ok(card.querySelector('[data-testid="footer-slot"]'));
  card.querySelector('button[aria-label="关闭通知"]').click();
  await within(notice.waitClose());
  await flush();
  assert.equal(document.querySelector('.ja-notification-container'), null);
});

void test('Notification updates text/type and supports four placements with independent instances', async () => {
  const notices = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((placement) =>
    ui.notification.info({ title: placement, content: 'Before', placement, duration: 0 }),
  );
  notices[0].update({ type: 'warning', title: 'Updated', content: 'After' });
  await flush();
  assert.equal(document.querySelectorAll('.ja-notification').length, 4);
  assert.equal(
    document.querySelector('[data-placement="topLeft"] .ja-notification-title').textContent,
    'Updated',
  );
  assert.equal(document.querySelector('[data-placement="topLeft"] .content').textContent, 'After');
  ui.notification.clear();
  await within(Promise.all(notices.map((n) => n.waitClose())));
});

void test('Notification pauses remaining duration on hover and focus until both have left', async () => {
  const notice = ui.notification.info({
    title: 'Read me',
    'slot:content': ui.FocusContentSlot,
    duration: 100,
  });
  await flush();
  const card = document.querySelector('.ja-notification');
  card.dispatchEvent(new MouseEvent('mouseenter'));
  card.querySelector('input').focus();
  await sleep(120);
  card.dispatchEvent(new MouseEvent('mouseleave'));
  await sleep(120);
  assert.ok(document.querySelector('.ja-notification'));
  card.querySelector('input').blur();
  await within(notice.waitClose(), 250);
});

void test('Message and Notification remain independently clearable and above new dialogs', async () => {
  ui.message.info({ content: 'Message', duration: 0 });
  const notice = ui.notification.info({ title: 'Notification', duration: 0 });
  mount(ui.Modal);
  await flush();
  const dialogZ = Number(document.querySelector('.ja-modal').style.zIndex);
  assert.ok(Number(document.querySelector('.ja-message-container').style.zIndex) > dialogZ);
  assert.ok(Number(document.querySelector('.ja-notification-container').style.zIndex) > dialogZ);
  ui.message.clear();
  await flush();
  assert.ok(document.querySelector('.ja-notification'));
  notice.close();
});

void test('Notification title and icon slots take precedence and closable=false hides the button', async () => {
  ui.notification.error({
    'slot:title': ui.BodySlot,
    'slot:icon': ui.IconSlot,
    content: 'Details',
    closable: false,
    duration: 0,
  });
  await flush();
  const card = document.querySelector('.ja-notification');
  assert.equal(card.getAttribute('role'), 'alert');
  assert.ok(card.querySelector('.ja-notification-title [data-testid="body-slot"]'));
  assert.ok(card.querySelector('.icon [data-testid="icon-slot"]'));
  assert.equal(card.querySelector('.ja-notice-close'), null);
});

void test('Notification config applies future placement/duration and evicts across corner buckets', async () => {
  const first = ui.notification.info({ title: 'First', duration: 0, placement: 'topRight' });
  ui.notification.config({ placement: 'bottomLeft', duration: 200, maxCount: 1 });
  const second = ui.notification.info({ title: 'Second' });
  await flush();
  await within(first.waitClose());
  assert.equal(document.querySelectorAll('.ja-notification').length, 1);
  assert.ok(document.querySelector('[data-placement="bottomLeft"] .ja-notification'));
  await within(second.waitClose(), 500);
});
