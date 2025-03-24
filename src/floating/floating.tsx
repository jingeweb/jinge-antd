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
  ALI_END,
  ALI_START,
  type FloatingProps,
  POS_BOTTOM,
  POS_LEFT,
  POS_RIGHT,
  POS_TOP,
  getDelayOpt,
  getPlacementOpt,
} from './common';

export function Floating(props: FloatingProps, host: ComponentHost) {
  const ctrlMode = !isUndefined(props.open);
  const triggerOpt = props.triggerMethod ?? 'click';
  const safePolygonOpt = triggerOpt === 'hover' && props.safePolygon;
  const placementOpt = getPlacementOpt(props.placement);
  const offsetOpt = props.offset ?? (placementOpt.position === POS_TOP ? 20 : 10);
  const delayOpt = getDelayOpt(props.delay);
  const dismissableOpt = props.dismissable !== false;

  const state = vm({
    pos: '',
    isOpen: !!props.open,
    // safeX: ''
  });

  watch(props, 'open', (v) => {
    state.isOpen = !!v;
  });

  let triggerEl: HTMLElement | undefined = undefined;
  let contentEl: HTMLDivElement | undefined = undefined;
  let dismissDereg: (() => void) | undefined = undefined;
  let hoverDereg: (() => void) | undefined = undefined;
  let cancelAutoUpdate: (() => void) | undefined = undefined;
  /**
   * safePolygon 简化为覆盖 8 个点的最外矩形。简化后的算法更轻便，但可能交互上不是很符合期待。
   */
  let safeRect: { left: number; top: number; right: number; bottom: number } | undefined =
    undefined;

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
      if (safePolygonOpt) {
        hoverDereg = registerEvent(document.body, 'mouseover', (evt) => {
          if (!safeRect) {
            return;
          }
          const x = evt.pageX;
          const y = evt.pageY;
          if (
            !(
              x >= safeRect.left &&
              x <= safeRect.right &&
              y >= safeRect.top &&
              y <= safeRect.bottom
            )
          ) {
            close();
          }
        });
      } else {
        hoverDereg = registerEvent(triggerEl, 'mouseleave', close);
      }
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

    const { position, align } = placementOpt;
    let x = 0;
    let y = 0;
    if (position === POS_TOP || position === POS_BOTTOM) {
      if (align === ALI_START) {
        x = triggerRect.left;
      } else if (align === ALI_END) {
        x = triggerRect.right - contentRect.width;
      } else {
        x = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      }
    } else if (position == POS_LEFT || position === POS_RIGHT) {
      if (align === ALI_START) {
        y = triggerRect.top;
      } else if (align === ALI_END) {
        y = triggerRect.bottom - contentRect.height;
      } else {
        y = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      }
    }
    if (position === POS_TOP) {
      y = triggerRect.top - offsetOpt - contentRect.height;
    } else if (position === POS_BOTTOM) {
      y = triggerRect.bottom + offsetOpt;
    } else if (position === POS_LEFT) {
      x = triggerRect.left - offsetOpt - contentRect.width;
    } else if (position === POS_RIGHT) {
      x = triggerRect.right + offsetOpt;
    }

    if (safePolygonOpt) {
      safeRect = {
        left: Math.min(triggerRect.left, x),
        top: Math.min(triggerRect.top, y),
        right: Math.max(triggerRect.right, x + contentRect.width),
        bottom: Math.max(triggerRect.bottom, y + contentRect.height),
      };
      // state.safeX = `width:${safeRect.right - safeRect.left}px;height:${safeRect.bottom - safeRect.top}px;left:${safeRect.left}px;top:${safeRect.top}px`;
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
      state.isOpen = true;
    }
  }
  function open() {
    if (closeTm > 0) {
      clearCloseTm();
      return;
    }
    if (state.isOpen) {
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
    if (!state.isOpen) {
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
      state.isOpen = false;
    }
  }

  onMount(() => {
    triggerEl = getFirstDOM(host);
    if (!triggerEl) throw new Error('trigger not found');

    let trigerDereg: AnyFn | undefined = undefined;
    if (triggerOpt === 'hover') {
      trigerDereg = registerEvent(triggerEl, 'mouseenter', open);
    } else if (triggerOpt === 'click') {
      trigerDereg = registerEvent(triggerEl, 'click', open);
    }
    return () => {
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
          isEnter={state.isOpen}
          appear={state.isOpen}
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
            style={`z-index:${props.zIndex};${state.pos}`}
          >
            {props.children}
          </div>
        </Transition>
      </Portal>
    </>
  );
}
