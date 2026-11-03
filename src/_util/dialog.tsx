import {
  type JNode,
  type WithChildren,
  type WithEvents,
  type WithSlots,
  context,
  cx,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  uid,
} from 'jinge';

import { Button } from '../button';
import {
  type FloatingNode,
  FLOATING_CONTEXT,
  containsNode,
  hideNode,
  isTopNode,
  showNode,
} from '../floating/tree';
import { AntDesignCloseOutlined } from '../icon';
import { Z_CONTEXT, z } from './z';

interface DialogEntry {
  node: FloatingNode;
  panel: HTMLElement;
}
const dialogs: DialogEntry[] = [];
const inertValues = new Map<Element, string | null>();
let previousOverflow = '',
  previousPadding = '';
let observer: MutationObserver | undefined;

function syncInert() {
  for (const [element, value] of inertValues) {
    if (value === null) element.removeAttribute('inert');
    else element.setAttribute('inert', value);
  }
  inertValues.clear();
  const top = dialogs.at(-1);
  if (!top) return;
  for (const element of document.body.children) {
    // Permit the active dialog's Portal roots and live announcements.
    if (
      element.contains(top.panel) ||
      containsNode(top.node, element) ||
      element.matches('[data-ja-notices], [aria-live], [role="status"], [role="alert"]')
    )
      continue;
    inertValues.set(element, element.getAttribute('inert'));
    element.setAttribute('inert', '');
  }
}
function addDialog(entry: DialogEntry) {
  if (!dialogs.length) {
    previousOverflow = document.body.style.overflow;
    previousPadding = document.body.style.paddingRight;
    const scrollbar =
      document.documentElement.clientWidth > 0
        ? Math.max(0, window.innerWidth - document.documentElement.clientWidth)
        : 0;
    if (scrollbar)
      document.body.style.paddingRight = `${Number.parseFloat(getComputedStyle(document.body).paddingRight || '0') + scrollbar}px`;
    document.body.style.overflow = 'hidden';
    observer = new window.MutationObserver(syncInert);
    observer.observe(document.body, { childList: true });
  }
  const child = dialogs.findIndex((item) => containsNode(entry.node, item.panel));
  if (child < 0) dialogs.push(entry);
  else dialogs.splice(child, 0, entry);
  syncInert();
}
function removeDialog(entry: DialogEntry) {
  const index = dialogs.indexOf(entry);
  if (index >= 0) dialogs.splice(index, 1);
  syncInert();
  if (!dialogs.length) {
    observer?.disconnect();
    observer = undefined;
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPadding;
  }
}
const focusSelector =
  'button, [href], input, select, textarea, [tabindex], [contenteditable="true"]';
function focusables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(focusSelector)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[hidden], [inert]') &&
      getComputedStyle(element).display !== 'none' &&
      getComputedStyle(element).visibility !== 'hidden' &&
      !hiddenAncestor(element.parentElement),
  );
}
function hiddenAncestor(element: HTMLElement | null): boolean {
  while (element && element !== document.body) {
    if (getComputedStyle(element).display === 'none') return true;
    element = element.parentElement;
  }
  return false;
}

/** Shared Modal/Drawer scope using public lifecycle/context and logical Portal ancestry. */
export function DialogFrame(
  props: {
    kind: 'modal' | 'drawer';
    titleId: string;
    ariaLabel?: string;
    labelled?: boolean;
    describedBy?: string;
    className?: string;
    style?: string;
    maskClassName?: string;
    showMask?: boolean;
    closeWhenMaskClick?: boolean;
    keyboard?: boolean;
    closable?: boolean;
    submitting?: boolean;
    autoFocus?: boolean;
    returnFocus?: boolean;
    width?: string | number;
    height?: string | number;
    centered?: boolean;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    footer?: boolean;
    motion?: boolean;
  } & WithChildren<JNode> &
    WithSlots<{ title?: JNode; footer?: JNode }> &
    WithEvents<{ cancel(): void; hidden(): void }>,
) {
  const allocation = z.acquire();
  context(Z_CONTEXT, allocation.index);
  const parent = context<FloatingNode | undefined>(FLOATING_CONTEXT);
  const node: FloatingNode = { children: new Set(), layer: allocation.index + 1 };
  parent?.children.add(node);
  context(FLOATING_CONTEXT, node);
  const panel = ref<HTMLDivElement>();
  const id = `ja-dialog-${uid()}`;
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  let entry: DialogEntry | undefined;
  let stops: (() => void)[] = [];
  function focusFirst() {
    const body = panel.value?.querySelector('.ja-dialog-body');
    const first =
      panel.value?.querySelector<HTMLElement>('[autofocus]:not(:disabled)') ??
      (body ? focusables(body)[0] : undefined) ??
      (panel.value ? focusables(panel.value)[0] : undefined);
    (first ?? panel.value)?.focus({ preventScroll: true });
  }
  onMount(() => {
    node.content = panel.value!;
    entry = { node, panel: panel.value! };
    showNode(node);
    addDialog(entry);
    stops = [
      registerEvent(document, 'keydown', (event) => {
        if (dialogs.at(-1) !== entry || event.defaultPrevented || event.isComposing) return;
        if (event.key === 'Escape' && isTopNode(node)) {
          event.preventDefault();
          if (props.keyboard !== false && !props.submitting) props['on:cancel']();
        } else if (event.key === 'Tab') {
          const candidates = focusables(document).filter((element) => containsNode(node, element));
          candidates.sort(
            (a, b) =>
              (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity),
          );
          const current = candidates.indexOf(document.activeElement as HTMLElement);
          const next =
            current < 0
              ? event.shiftKey
                ? candidates.length - 1
                : 0
              : (current + (event.shiftKey ? -1 : 1) + candidates.length) % candidates.length;
          event.preventDefault();
          (candidates[next] ?? panel.value)?.focus();
        }
      }),
      registerEvent(document, 'focusin', (event) => {
        if (dialogs.at(-1) === entry && !containsNode(node, event.target as Node)) focusFirst();
      }),
    ];
    if (
      props.autoFocus !== false &&
      dialogs.at(-1) === entry &&
      !containsNode(node, document.activeElement)
    )
      focusFirst();
  });
  onUnmount(() => {
    for (const stop of stops) stop();
    const wasTop = dialogs.at(-1) === entry;
    hideNode(node);
    parent?.children.delete(node);
    if (entry) removeDialog(entry);
    allocation.release();
    const top = dialogs.at(-1);
    if (
      props.returnFocus !== false &&
      wasTop &&
      previousFocus?.isConnected &&
      !previousFocus.closest('[inert]') &&
      (!top || containsNode(top.node, previousFocus))
    )
      previousFocus.focus({ preventScroll: true });
    else if (props.returnFocus !== false && wasTop && top)
      (focusables(top.panel)[0] ?? top.panel).focus({ preventScroll: true });
    props['on:hidden']();
  });
  function dimension(value: string | number | undefined) {
    return typeof value === 'number' ? `${Math.max(0, value)}px` : value;
  }
  return (
    <div
      className={cx('ja-dialog-root', `ja-${props.kind}-root`)}
      style={`z-index:${allocation.index}`}
    >
      {props.showMask !== false && (
        <div
          className={cx('ja-dialog-mask', `ja-${props.kind}-mask`, props.maskClassName)}
          style={`z-index:${allocation.index}`}
          on:click={(event) => {
            if (
              event.target === event.currentTarget &&
              dialogs.at(-1) === entry &&
              props.closeWhenMaskClick !== false &&
              !props.submitting
            )
              props['on:cancel']();
          }}
        />
      )}
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.labelled ? props.titleId : undefined}
        aria-label={
          props.labelled
            ? undefined
            : (props.ariaLabel ?? (props.kind === 'modal' ? '对话框' : '抽屉'))
        }
        aria-describedby={props.describedBy}
        aria-busy={props.submitting ? 'true' : undefined}
        tabIndex={-1}
        data-placement={props.kind === 'drawer' ? (props.placement ?? 'right') : undefined}
        className={cx(
          'ja-dialog-panel',
          `ja-${props.kind}`,
          props.centered && 'ja-dialog-centered',
          props.motion !== false && 'ja-dialog-motion',
          props.className,
        )}
        style={`${props.style ?? ''};z-index:${allocation.index + 1};width:${dimension(props.width) ?? ''};height:${dimension(props.height) ?? ''}`}
      >
        {props.closable !== false && (
          <Button
            type="text"
            size="lg"
            className="ja-close"
            ariaLabel="关闭"
            disabled={props.submitting}
            slot:icon={<AntDesignCloseOutlined />}
            on:click={props['on:cancel']}
          />
        )}
        {props.labelled && (
          <div id={props.titleId} className={`ja-${props.kind}-title`}>
            {props['slot:title']}
          </div>
        )}
        <div className={cx('ja-dialog-body', `ja-${props.kind}-content`)}>{props.children}</div>
        {props.footer !== false && props['slot:footer'] && (
          <div className={`ja-${props.kind}-footer`}>{props['slot:footer']}</div>
        )}
      </div>
    </div>
  );
}
