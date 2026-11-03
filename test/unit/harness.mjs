import { JSDOM } from 'jsdom';
import { afterEach, beforeEach } from 'node:test';

const dom = new JSDOM('<!doctype html><body></body>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
for (const name of [
  'window',
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'SVGElement',
  'Text',
  'Comment',
  'Event',
  'MouseEvent',
  'FocusEvent',
  'DocumentFragment',
  'ShadowRoot',
])
  globalThis[name] = dom.window[name];
// jsdom has no OffscreenCanvas; Jinge only checks instanceof for VM exclusions here.
globalThis.OffscreenCanvas = class OffscreenCanvas {};
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

// Both compiled components and tests use this project's installed runtime.
export const rt = await import('jinge');
export const zod = await import('zod');
let serial = 0;
let hosts = [];
let timers = new Set();
const setWindowTimeout = window.setTimeout.bind(window);
const clearWindowTimeout = window.clearTimeout.bind(window);
window.setTimeout = (fn, ms, ...args) => {
  const id = setWindowTimeout(() => {
    timers.delete(id);
    fn(...args);
  }, ms);
  timers.add(id);
  return id;
};
window.clearTimeout = (id) => {
  timers.delete(id);
  clearWindowTimeout(id);
};
const clearNodeTimeout = globalThis.clearTimeout;
// Browser source uses both clearTimeout() and window.clearTimeout() for numeric DOM timer IDs.
globalThis.clearTimeout = (id) =>
  typeof id === 'number' ? window.clearTimeout(id) : clearNodeTimeout(id);
export let ui;
beforeEach(async () => {
  // A fresh bundle resets module singletons (message container and z-index) per test.
  ui = await import(`../.compiled/unit/components.js?test=${serial++}`);
});
afterEach(async () => {
  ui?.message.clear();
  ui?.notification.clear();
  // Let imperative services destroy their empty roots before this fixture clears the DOM.
  await Promise.resolve();
  for (const host of hosts.reverse()) rt.destroyComponent(host);
  hosts = [];
  for (const id of timers) clearWindowTimeout(id);
  timers = new Set();
  document.body.replaceChildren();
  await Promise.resolve();
});
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function flush() {
  await sleep(35);
}
export function mount(fc, props = {}) {
  const host = new rt.ComponentHost();
  hosts.push(host);
  const nodes = rt.renderFunctionComponent(host, fc, rt.vm(props));
  document.body.append(...nodes);
  rt.handleRenderDone(host);
  return {
    host,
    dispose() {
      rt.destroyComponent(host);
    },
  };
}
export function input(value, selector = 'input') {
  const el = document.querySelector(selector);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
export function endTransition(selector) {
  for (const el of document.querySelectorAll(selector)) {
    el.dispatchEvent(new Event('transitionend', { bubbles: true }));
  }
}
export async function within(promise, ms = 150) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Promise did not settle')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
