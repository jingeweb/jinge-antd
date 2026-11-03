import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from './harness.mjs';
const file = (name = 'a.txt', body = 'abc', type = 'text/plain') =>
  new window.File([body], name, { type });
async function select(files) {
  const input = document.querySelector('input[type=file]');
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
}
const buttons = () => [...document.querySelectorAll('button')];
const action = (name) => buttons().find((el) => el.getAttribute('aria-label') === name);
const row = () => document.querySelector('.ja-upload-item');
void test('Upload snapshots default files, exposes focus and never submits its parent form', () => {
  const defaults = [
    { uid: 'old', name: 'old.txt', status: 'done', url: 'https://example.com/file' },
  ];
  const _view = mount(ui.Upload, {
    defaultFileList: defaults,
    ariaLabel: 'Attachments',
  });
  defaults[0].name = 'mutated';
  assert.equal(row().textContent.includes('old.txt'), true);
  _view.host.focus();
  assert.equal(document.activeElement.getAttribute('aria-label'), 'Attachments');
  assert.equal(document.activeElement.type, 'button');
});
void test('Upload selection queues raw native files, resets input and supports manual start once', async () => {
  const requests = [],
    changes = [],
    raw = file();
  const _view = mount(ui.Upload, {
    autoUpload: false,
    customRequest: (options) => {
      requests.push(options);
      return Promise.resolve({ id: 7 });
    },
    'on:change': (list, info) => changes.push([list, info]),
  });
  await select([raw]);
  assert.equal(requests.length, 0);
  assert.equal(changes[0][0][0].originFile, raw);
  assert.equal(document.querySelector('input').value, '');
  _view.host.start();
  _view.host.start();
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].file, raw);
  assert.equal(requests[0].file.slice(0, 1).size, 1);
  assert.equal(changes.at(-1)[1].type, 'success');
  assert.equal(changes.at(-1)[0][0].response.id, 7);
});
void test('Upload enforces extension/MIME, byte size, count and multiple on native selection', async () => {
  const rejects = [],
    changes = [];
  const _view = mount(ui.Upload, {
    autoUpload: false,
    multiple: true,
    accept: '.txt,image/*',
    maxSize: 3,
    maxCount: 2,
    'on:reject': (f, reason) => rejects.push([f.name, reason]),
    'on:change': (list) => changes.push(list),
  });
  await select([
    file('bad.pdf', '', 'application/pdf'),
    file('big.txt', '1234'),
    file('ok.TXT'),
    file('pic.png', 'x', 'image/png'),
    file('extra.txt'),
  ]);
  assert.deepEqual(rejects, [
    ['bad.pdf', 'accept'],
    ['big.txt', 'size'],
    ['extra.txt', 'count'],
  ]);
  assert.deepEqual(
    changes.at(-1).map((f) => f.name),
    ['ok.TXT', 'pic.png'],
  );
});
void test('Upload async beforeUpload preserves selection order and rejects false/throw without sending', async () => {
  const requests = [],
    rejects = [];
  const _view = mount(ui.Upload, {
    multiple: true,
    beforeUpload: async (f) => {
      if (f.name === 'throw.txt') throw new Error('invalid');
      return f.name !== 'skip.txt';
    },
    customRequest: async ({ file: f }) => requests.push(f.name),
    'on:reject': (f, reason) => rejects.push([f.name, reason]),
  });
  await select([file('skip.txt'), file('ok.txt'), file('throw.txt')]);
  assert.deepEqual(requests, ['ok.txt']);
  assert.deepEqual(rejects, [
    ['skip.txt', 'beforeUpload'],
    ['throw.txt', 'beforeUpload'],
  ]);
});
void test('Upload progress is bounded, cancellation aborts and stale results cannot overwrite retries', async () => {
  const calls = [],
    changes = [];
  const _view = mount(ui.Upload, {
    customRequest: (options) => new Promise((resolve) => calls.push({ ...options, resolve })),
    'on:change': (list) => changes.push(list),
  });
  await select([file()]);
  calls[0].onProgress(150);
  await flush();
  assert.equal(changes.at(-1)[0].percent, 100);
  action('取消 a.txt').click();
  await flush();
  assert.equal(calls[0].signal.aborted, true);
  action('重试 a.txt').click();
  await flush();
  assert.equal(calls.length, 2);
  calls[0].resolve({ old: true });
  calls[0].onProgress(10);
  await flush();
  assert.equal(row().textContent.includes('上传中'), true);
  calls[1].resolve({ ok: true });
  await flush();
  assert.equal(changes.at(-1)[0].response.ok, true);
});
void test('Upload request failure becomes retryable and synchronous transport throws become errors', async () => {
  let attempts = 0;
  const _view = mount(ui.Upload, {
    customRequest: () => {
      if (++attempts === 1) throw new Error('Offline');
      return Promise.resolve('ok');
    },
  });
  await select([file()]);
  assert.equal(row().textContent.includes('Offline'), true);
  action('重试 a.txt').click();
  await flush();
  assert.equal(row().textContent.includes('上传完成'), true);
});
void test('Upload controlled rejection does not start requests and accepted external removal aborts them', async () => {
  const requests = [],
    changes = [],
    props = rt.vm({
      fileList: [],
      customRequest: (options) => new Promise(() => requests.push(options)),
      'on:change': (list) => changes.push(list),
    });
  mount(ui.Upload, props);
  await select([file()]);
  assert.equal(requests.length, 0);
  assert.equal(row(), null);
  props.fileList = changes[0];
  await flush();
  assert.equal(requests.length, 1);
  props.fileList = [];
  await flush();
  assert.equal(requests[0].signal.aborted, true);
});
void test('Upload async removal can veto and deduplicates pending removal', async () => {
  let resolveRemove,
    count = 0;
  const props = rt.vm({
    defaultFileList: [{ uid: 'x', name: 'x.txt', status: 'done' }],
    beforeRemove: () => {
      count++;
      return new Promise((resolve) => {
        resolveRemove = resolve;
      });
    },
  });
  mount(ui.Upload, props);
  action('移除 x.txt').click();
  action('移除 x.txt').click();
  await flush();
  assert.equal(count, 1);
  resolveRemove(false);
  await flush();
  assert.ok(row());
  action('移除 x.txt').click();
  await flush();
  resolveRemove(true);
  await flush();
  assert.equal(row(), null);
});
void test('Upload unmount cancels active and invalidates pending validation without late events', async () => {
  let resolveValidation;
  const requests = [],
    changes = [];
  const props = rt.vm({
    multiple: true,
    customRequest: (options) => new Promise(() => requests.push(options)),
    'on:change': (list) => changes.push(list),
  });
  const mounted = mount(ui.Upload, props);
  await select([file()]);
  props.beforeUpload = () =>
    new Promise((resolve) => {
      resolveValidation = resolve;
    });
  const pending = select([file('late.txt')]);
  await Promise.resolve();
  mounted.dispose();
  resolveValidation(true);
  await pending;
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests.length, 1);
  assert.equal(changes.at(-1).length, 1);
});
void test('Upload concurrency limits active transfers and canceled requests release a slot', async () => {
  const requests = [];
  const _view = mount(ui.Upload, {
    multiple: true,
    concurrency: 1,
    customRequest: (options) => new Promise(() => requests.push(options)),
  });
  await select([file('a.txt'), file('b.txt')]);
  assert.equal(requests.length, 1);
  action('取消 a.txt').click();
  await flush();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].file.name, 'b.txt');
});
void test('Upload disabled blocks selection/drop/start/removal and unsafe links are not rendered', async () => {
  const requests = [];
  const _view = mount(ui.Upload, {
    disabled: true,
    drag: true,
    defaultFileList: [{ uid: 'x', name: 'bad', status: 'done', url: 'javascript:alert(1)' }],
    customRequest: async () => requests.push(1),
  });
  await select([file()]);
  _view.host.start();
  assert.equal(requests.length, 0);
  assert.equal(document.querySelector('a'), null);
  assert.equal(action('移除 bad').disabled, true);
});
void test('Upload reset restores the default snapshot, aborts transport and emits no reset change', async () => {
  const requests = [],
    changes = [];
  const form = document.createElement('form');
  form.id = 'owner';
  document.body.append(form);
  const _view = mount(ui.Upload, {
    form: 'owner',
    customRequest: (options) => new Promise(() => requests.push(options)),
    'on:change': (list) => changes.push(list),
  });
  await select([file()]);
  const count = changes.length;
  form.reset();
  await flush();
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(row(), null);
  assert.equal(changes.length, count);
});

void test('Upload controlled removal rejection retains its active transfer until the owner accepts', async () => {
  const calls = [];
  let requested;
  const props = rt.vm({
    fileList: [],
    customRequest: (options) => new Promise(() => calls.push(options)),
    'on:change': (list, info) => {
      if (info.type === 'remove') requested = list;
      else props.fileList = list;
    },
  });
  const view = mount(ui.Upload, props);
  await select([file()]);
  const id = props.fileList[0].uid;
  assert.equal(await view.host.remove(id), false);
  assert.equal(calls[0].signal.aborted, false);
  props.fileList = requested;
  await flush();
  assert.equal(calls[0].signal.aborted, true);
});
void test('Upload disabling invalidates pending validation and allows a new batch after reenabling', async () => {
  let resolveOld;
  const props = rt.vm({
    autoUpload: false,
    beforeUpload: () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  });
  mount(ui.Upload, props);
  const pending = select([file('old.txt')]);
  await Promise.resolve();
  props.disabled = true;
  await flush();
  props.disabled = false;
  props.beforeUpload = () => true;
  await flush();
  await select([file('new.txt')]);
  assert.equal(row().textContent.includes('new.txt'), true);
  resolveOld(true);
  await pending;
  assert.equal(document.querySelectorAll('.ja-upload-item').length, 1);
});
void test('Upload missing transport configuration fails explicitly and never automatically loops', async () => {
  const changes = [];
  mount(ui.Upload, { 'on:change': (_, info) => changes.push(info.type) });
  await select([file()]);
  assert.equal(row().textContent.includes('请配置 action 或 customRequest'), true);
  assert.deepEqual(changes, ['select', 'start', 'error']);
});
void test('Upload canceled form reset retains the list and active request', async () => {
  const calls = [];
  const form = document.createElement('form');
  form.id = 'owner';
  document.body.append(form);
  form.addEventListener('reset', (event) => event.preventDefault());
  mount(ui.Upload, {
    form: 'owner',
    customRequest: (options) => new Promise(() => calls.push(options)),
  });
  await select([file()]);
  form.reset();
  await flush();
  assert.ok(row());
  assert.equal(calls[0].signal.aborted, false);
});
