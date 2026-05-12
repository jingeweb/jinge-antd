import {
  type AnyFn,
  type ComponentHost,
  Portal,
  Transition,
  cx,
  getFirstDOM,
  isUndefined,
  onMount,
  registerEvent,
  vm,
  watch,
} from 'jinge';

import { autoUpdate } from './autoupdate';
import {
  type FloatingProps,
  POS_TOP,
  type Point,
  calcPosition,
  getDelayOpt,
  getPlacementOpt,
} from './common';
import { isPointInPolygon } from './safe-polygon';

export function Floating(props: FloatingProps, host: ComponentHost) {
  const ctrlMode = !isUndefined(props.open);
  const triggerOpt = props.triggerMethod ?? 'click';
  const safePolygonOpt = triggerOpt === 'hover' && !!props.safePolygon;
  const placementOpt = getPlacementOpt(props.placement);
  const offsetOpt = props.offset ?? (placementOpt.position === POS_TOP ? 20 : 10);
  const delayOpt = getDelayOpt(props.delay);
  const dismissableOpt = props.dismissable !== false;

  const state = vm({
    pos: '',
    open: !!props.open,
  });

  watch(props, 'open', (v) => {
    state.open = !!v;
  });

  let triggerEl: HTMLElement | undefined = undefined;
  let contentEl: HTMLDivElement | undefined = undefined;
  let dismissDereg: (() => void) | undefined = undefined;
  let hoverDereg: (() => void) | undefined = undefined;
  let cancelAutoUpdate: (() => void) | undefined = undefined;

  let safePolygonPoints: Point[] | undefined = undefined;

  function handleShown() {
    if (!triggerEl || !contentEl) return;
    if (triggerOpt === 'click') {
      if (dismissableOpt) {
        dismissDereg = registerEvent(document.body, 'mousedown', (evt) => {
          const el = evt.target as Node;
          if (triggerEl?.contains(el) || contentEl?.contains(el)) {
            return;
          }
          doClose();
        });
      }
    } else if (triggerOpt === 'hover') {
      hoverDereg = registerEvent(triggerEl, 'mouseleave', () => {
        if (!safePolygonOpt) {
          close();
          return;
        }
        hoverDereg?.();
        hoverDereg = registerEvent(document.body, 'mouseover', (evt) => {
          if (
            !safePolygonPoints?.length ||
            !isPointInPolygon(evt.pageX, evt.pageY, safePolygonPoints)
          ) {
            close();
          }
        });
      });
    }
    cancelAutoUpdate = autoUpdate(triggerEl!, contentEl!, updatePos);
  }
  function handleHiden() {
    if (triggerOpt === 'click') {
      dismissDereg?.();
      dismissDereg = undefined;
    }
    cancelAutoUpdate?.();
    cancelAutoUpdate = undefined;
  }

  function updatePos() {
    if (!triggerEl || !contentEl) {
      return;
    }
    const triggerRect = triggerEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();
    const windowSize = { width: window.innerWidth, height: window.innerHeight };
    const { x, y, polygon } = calcPosition(
      triggerRect,
      contentRect,
      windowSize,
      placementOpt,
      offsetOpt,
      safePolygonOpt,
    );
    if (polygon) {
      safePolygonPoints = polygon;
    }

    state.pos = `left:${x}px;top:${y}px`;
  }
  let openTm = 0;
  let closeTm = 0;
  function clearOpenTm() {
    if (openTm > 0) {
      clearTimeout(openTm);
      openTm = 0;
    }
  }

  function clearCloseTm() {
    if (closeTm > 0) {
      clearTimeout(closeTm);
      closeTm = 0;
    }
  }
  function doOpen() {
    if (ctrlMode) {
      props['on:openChange']?.(true);
    } else {
      state.open = true;
    }
  }
  function open() {
    if (closeTm > 0) {
      clearCloseTm();
      return;
    }
    if (state.open) {
      return;
    }
    clearOpenTm();
    if (delayOpt.open > 0) {
      openTm = window.setTimeout(() => {
        openTm = 0;
        doOpen();
      }, delayOpt.open);
    } else {
      doOpen();
    }
  }
  function close() {
    if (openTm > 0) {
      clearOpenTm();
      return;
    }
    if (!state.open) {
      return;
    }
    clearCloseTm();
    if (delayOpt.close > 0) {
      closeTm = window.setTimeout(() => {
        closeTm = 0;
        doClose();
      }, delayOpt.close);
    } else {
      doClose();
    }
  }
  function doClose() {
    if (ctrlMode) {
      props['on:openChange']?.(false);
    } else {
      state.open = false;
    }
  }

  onMount(() => {
    triggerEl = getFirstDOM(host);
    if (!triggerEl) throw new Error('trigger not found');

    let trigerDereg: AnyFn | undefined = undefined;
    if (triggerOpt === 'hover') {
      trigerDereg = registerEvent(triggerEl, 'mouseenter', open);
    } else if (triggerOpt === 'click') {
      trigerDereg = registerEvent(triggerEl, 'click', (evt) => {
        evt.stopPropagation();
        open();
      });
    }
    return () => {
      console.log('dismiss');
      trigerDereg?.();
      hoverDereg?.();
      dismissDereg?.();
      cancelAutoUpdate?.();
    };
  });

  return (
    <>
      {props['slot:trigger']}
      <Portal>
        <Transition
          isEnter={state.open}
          appear={state.open}
          enterClass={props.enterClass ?? 'ja-enter'}
          enterActiveClass={props.enterActiveClass ?? 'ja-enter-active'}
          leaveActiveClass={props.leaveActiveClass ?? 'ja-leave-active'}
          leaveClass={props.leaveClass ?? 'ja-leave'}
          destroyAfterLeave
          on:beforeEnter={(el) => {
            contentEl = el as HTMLDivElement;
            handleShown();
          }}
          on:afterLeave={() => {
            handleHiden();
            contentEl = undefined;
          }}
        >
          <div
            className={cx(props.className, 'ja-floating')}
            style={`z-index:${props.zIndex};${state.pos};${props.style ?? ''}`}
          >
            {props.children}
          </div>
        </Transition>
      </Portal>
    </>
  );
}
