import {
  type ComponentHost,
  Portal,
  context,
  getFirstDOM,
  onMount,
  onUnmount,
  registerEvent,
  uid,
  vm,
  watch,
} from 'jinge';

import { autoUpdate } from './autoupdate';
import {
  type FloatingProps,
  type Point,
  calcPosition,
  getDelayOpt,
  getPlacementOpt,
} from './common';
import { FloatingPanel } from './panel';
import { isPointInPolygon, isPointInPolygon2 } from './safe-polygon';
import {
  type FloatingNode,
  FLOATING_CONTEXT,
  containsNode,
  hideNode,
  isTopNode,
  showNode,
} from './tree';

export function Floating(props: FloatingProps, host: ComponentHost) {
  const controlled = props.open !== undefined;
  const id = props.id ?? `ja-floating-${uid()}`;
  const parent = context<FloatingNode | undefined>(FLOATING_CONTEXT);
  const node: FloatingNode = { children: new Set(), layer: props.zIndex };
  parent?.children.add(node);
  context(FLOATING_CONTEXT, node);
  const state = vm({ open: props.open ?? props.defaultOpen ?? false, pos: '' });
  let disposed = false,
    hovered = false,
    contentHovered = false,
    suppressFocus = false;
  let openTimer = 0,
    closeTimer = 0;
  let stopAutoUpdate: (() => void) | undefined;
  let stopTracking: (() => void) | undefined;
  let visibleStops: (() => void)[] = [];
  let polygon: Point[] | undefined, contentRect: Point[] | undefined;
  let reason = 'programmatic';
  const originalAria = new Map<string, string | null>();
  function hasMethod(method: 'click' | 'hover' | 'focus') {
    const methods = props.triggerMethod ?? 'click';
    return Array.isArray(methods) ? methods.includes(method) : methods === method;
  }
  function disabled() {
    return (
      !!props.disabled ||
      !!node.trigger?.matches(':disabled') ||
      node.trigger?.getAttribute('aria-disabled') === 'true'
    );
  }
  function clearOpen() {
    window.clearTimeout(openTimer);
    openTimer = 0;
  }
  function clearClose() {
    window.clearTimeout(closeTimer);
    closeTimer = 0;
  }
  function clearTracking() {
    stopTracking?.();
    stopTracking = undefined;
  }
  function focusWithin() {
    return containsNode(node, document.activeElement);
  }
  function clearVisibleEvents() {
    for (const stop of visibleStops) stop();
    visibleStops = [];
  }
  function bindVisibleEvents() {
    clearVisibleEvents();
    visibleStops = [
      registerEvent(document, 'focusin', (event) => {
        if (
          hasMethod('focus') &&
          state.open &&
          !containsNode(node, event.target as Node) &&
          !(hasMethod('hover') && (hovered || contentHovered))
        )
          request(false, event, 'focus');
      }),
      registerEvent(
        document,
        'mousedown',
        (event) => {
          if (
            state.open &&
            props.dismissable !== false &&
            !containsNode(node, event.target as Node)
          )
            request(false, event, 'outside');
        },
        true,
      ),
      registerEvent(
        document,
        'touchstart',
        (event) => {
          if (
            state.open &&
            props.dismissable !== false &&
            !containsNode(node, event.target as Node)
          )
            request(false, event, 'outside');
        },
        true,
      ),
      registerEvent(document, 'keydown', (event) => {
        if (
          event.key !== 'Escape' ||
          event.isComposing ||
          event.defaultPrevented ||
          props.keyboard === false ||
          !state.open ||
          !isTopNode(node)
        )
          return;
        event.preventDefault();
        request(false, event, 'escape');
      }),
    ];
  }
  function handleFocusOut(event: FocusEvent) {
    if (
      !hasMethod('focus') ||
      (event.relatedTarget instanceof Node && containsNode(node, event.relatedTarget))
    )
      return;
    if (!(hasMethod('hover') && (hovered || contentHovered))) request(false, event, 'focus');
  }
  function request(open: boolean, event?: Event, why = 'programmatic') {
    clearOpen();
    clearClose();
    if (disposed || (open && disabled()) || open === state.open) return;
    reason = why;
    if (!controlled) state.open = open;
    props['on:openChange']?.(open, event);
  }
  function open(event: Event, delayed: boolean) {
    clearClose();
    clearTracking();
    if (disposed || disabled() || state.open) return;
    clearOpen();
    const delay = delayed ? getDelayOpt(props.delay).open : 0;
    if (!delay) request(true, event, 'trigger');
    else
      openTimer = window.setTimeout(() => {
        openTimer = 0;
        request(true, event, 'trigger');
      }, delay);
  }
  function closeHover(event?: Event) {
    clearOpen();
    clearClose();
    if (!state.open || hovered || contentHovered || (hasMethod('focus') && focusWithin())) return;
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      request(false, event, 'hover');
    }, getDelayOpt(props.delay).close);
  }
  function restoreAria() {
    if (!node.trigger) return;
    for (const [name, value] of originalAria) {
      if (value === null) node.trigger.removeAttribute(name);
      else node.trigger.setAttribute(name, value);
    }
  }
  function syncAria() {
    const trigger = node.trigger;
    if (!trigger || disposed) return;
    // Preserve unrelated description tokens even if another component changes them while mounted.
    const descriptions = (trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== id);
    restoreAria();
    if (props.role === 'tooltip' && state.open && !props.disabled) descriptions.push(id);
    if (descriptions.length) trigger.setAttribute('aria-describedby', descriptions.join(' '));
    else trigger.removeAttribute('aria-describedby');
    if (props.role !== 'tooltip') {
      trigger.setAttribute('aria-haspopup', props.role ?? 'dialog');
      trigger.setAttribute('aria-expanded', String(state.open && !props.disabled));
      if (state.open && !props.disabled) trigger.setAttribute('aria-controls', id);
    }
  }
  function updatePos() {
    const trigger = node.trigger,
      content = node.content;
    if (!trigger || !content || disposed) return;
    const windowSize = {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: window.innerHeight,
    };
    const placement = getPlacementOpt(props.placement);
    const offset = props.offset ?? 10;
    const safe = props.safePolygon ? { x: 0, y: 0 } : undefined;
    const geometry = calcPosition(
      trigger.getBoundingClientRect(),
      content.getBoundingClientRect(),
      windowSize,
      placement,
      offset,
      safe,
      props.padding ?? 8,
    );
    content.style.maxWidth = `${geometry.maxWidth}px`;
    content.style.maxHeight = `${geometry.maxHeight}px`;
    const final = calcPosition(
      trigger.getBoundingClientRect(),
      content.getBoundingClientRect(),
      windowSize,
      placement,
      offset,
      safe,
      props.padding ?? 8,
    );
    polygon = final.polygon;
    contentRect = final.rect;
    content.style.left = `${final.x}px`;
    content.style.top = `${final.y}px`;
    content.dataset.placement = final.placement;
    state.pos = `left:${final.x}px;top:${final.y}px;max-width:${final.maxWidth}px;max-height:${final.maxHeight}px`;
  }
  function trackLeave(event: MouseEvent) {
    clearOpen();
    if (!hasMethod('hover') || hovered || contentHovered || (hasMethod('focus') && focusWithin()))
      return;
    const next = event.relatedTarget;
    if (next instanceof Node && containsNode(node, next)) {
      clearClose();
      return;
    }
    if (!props.safePolygon || !state.open || !node.content) {
      closeHover(event);
      return;
    }
    clearTracking();
    updatePos();
    stopTracking = registerEvent(document, 'mousemove', (move) => {
      if (move.target instanceof Node && containsNode(node, move.target)) {
        clearClose();
        return;
      }
      if (contentRect && isPointInPolygon2(move.clientX, move.clientY, contentRect)) {
        clearClose();
        return;
      }
      if (polygon && isPointInPolygon(move.clientX, move.clientY, polygon)) {
        clearClose();
        return;
      }
      clearTracking();
      closeHover(move);
    });
  }
  function handleShown(content: HTMLDivElement) {
    stopAutoUpdate?.();
    clearTracking();
    node.content = content;
    showNode(node);
    syncAria();
    bindVisibleEvents();
    if (node.trigger) stopAutoUpdate = autoUpdate(node.trigger, content, updatePos);
    if (props.autoFocus && props.role !== 'tooltip') {
      const first = content.querySelector<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      (first ?? content).focus();
    }
  }
  function handleHidden() {
    clearVisibleEvents();
    const shouldFocus =
      !disposed &&
      props.returnFocus !== false &&
      reason !== 'outside' &&
      !!node.content?.contains(document.activeElement);
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    clearTracking();
    clearClose();
    contentHovered = false;
    hideNode(node);
    node.content = undefined;
    polygon = undefined;
    contentRect = undefined;
    syncAria();
    if (shouldFocus && node.trigger?.isConnected && !disabled()) {
      suppressFocus = true;
      node.trigger.focus();
      suppressFocus = false;
    }
  }
  watch(props, 'open', (value) => {
    if (controlled) {
      clearOpen();
      clearClose();
      state.open = !!value;
    }
  });
  watch(state, 'open', () => {
    syncAria();
    if (!state.open) clearTracking();
  });
  watch(props, 'disabled', (value) => {
    clearOpen();
    clearClose();
    if (value) {
      clearTracking();
      request(false);
    }
    syncAria();
  });
  watch(props, 'triggerMethod', () => {
    clearOpen();
    clearClose();
    clearTracking();
    hovered = false;
  });
  for (const key of ['placement', 'offset', 'padding', 'style'] as const)
    watch(props, key, updatePos);
  watch(props, 'role', syncAria);
  watch(props, 'zIndex', (layer) => {
    node.layer = layer;
  });
  onMount(() => {
    const trigger = getFirstDOM<Node>(host);
    if (!(trigger instanceof HTMLElement))
      throw new Error('Floating trigger must have a single stable HTMLElement root.');
    node.trigger = trigger;
    for (const name of ['aria-expanded', 'aria-controls', 'aria-haspopup'])
      originalAria.set(name, trigger.getAttribute(name));
    syncAria();
    const stops = [
      registerEvent(trigger, 'click', (event) => {
        if (!hasMethod('click') || disabled()) return;
        if (openTimer) clearOpen();
        else if (state.open) request(false, event, 'trigger');
        else open(event, true);
      }),
      registerEvent(trigger, 'mouseenter', (event) => {
        hovered = true;
        if (hasMethod('hover')) open(event, true);
      }),
      registerEvent(trigger, 'mouseleave', (event) => {
        hovered = false;
        trackLeave(event);
      }),
      registerEvent(trigger, 'focusin', (event) => {
        if (!suppressFocus && hasMethod('focus')) open(event, false);
      }),
      registerEvent(trigger, 'focusout', handleFocusOut),
    ];
    // Panels initially open mount before their owning trigger's onMount.
    if (node.content) {
      stopAutoUpdate?.();
      stopAutoUpdate = autoUpdate(trigger, node.content, updatePos);
    }
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    clearVisibleEvents();
    clearOpen();
    clearClose();
    clearTracking();
    stopAutoUpdate?.();
    hideNode(node);
    parent?.children.delete(node);
    node.children.clear();
    if (node.trigger) {
      const descriptions = (node.trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((token) => token && token !== id);
      if (descriptions.length)
        node.trigger.setAttribute('aria-describedby', descriptions.join(' '));
      else node.trigger.removeAttribute('aria-describedby');
    }
    restoreAria();
  });
  return (
    <>
      {props['slot:trigger']}
      <Portal>
        {state.open && !props.disabled && (
          <FloatingPanel
            id={id}
            role={props.role ?? 'dialog'}
            ariaLabel={props.ariaLabel ?? (props.role === 'tooltip' ? undefined : '浮层')}
            ariaMultiselectable={props.ariaMultiselectable}
            motion={props.motion}
            className={props.className}
            style={`${props.style ?? ''};z-index:${props.zIndex};${state.pos}`}
            on:mount={handleShown}
            on:unmount={handleHidden}
            on:blur={handleFocusOut}
            on:enter={() => {
              contentHovered = true;
              clearClose();
              clearTracking();
            }}
            on:leave={(event) => {
              contentHovered = false;
              trackLeave(event);
            }}
          >
            {props.children}
          </FloatingPanel>
        )}
      </Portal>
    </>
  );
}
