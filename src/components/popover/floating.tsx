
import { type AnyFn, type ComponentHost, type JNode, Portal, type Props, Transition, getFirstDOM, isNumber, isUndefined, onMount, registerEvent, vm, watch } from 'jinge';
import { z } from '../message/z';


export type FloatingPlacement = 'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end' | 'left-start' | 'right' | 'left-end' | 'right' | 'right-start' | 'right-end';
export type FloatingDuration = number | { open: number; close: number };
export type FloatingProps = Props<{
  props: {
    open?: boolean;
    className?: string;
    /** 位置，默认是 top */
    placement?: FloatingPlacement;
    /** 触发方式，默认是 click。指定为 none 时完全由外部通过 visible 属性控制。*/
    triggerMethod?: 'click' | 'hover' | 'none';
    /** 延迟显示，毫秒。trigger 为 hover 时默认为 300，trigger 为 click 时默认为 0 */
    delay?: FloatingDuration;
    /** 偏移量。当 placement 是 topXX 时默认为 20，其它时默认为 10 */
    offset?: number;
  }
  children: JNode,
  slots: {
    trigger: JNode
  },
  events: {
    openChange?(v: boolean, evt?: Event): void;
  }
}>;


function getDelayOpt(delay: FloatingDuration | undefined, isTriggerClick: boolean) {
  return isUndefined(delay) ? (isTriggerClick ? { open: 0, close: 0 } : { open: 300, close: 0 }) : (isNumber(delay) ? { open: delay, close: delay } : delay);
}

const POS_BOTTOM = 0;
const POS_TOP = 1;
const POS_LEFT = 2;
const POS_RIGHT = 3;
const ALI_START = 1;
const ALI_END = 2;
const ALI_CENTER = 0;
function getPlacementOpt(placement?: FloatingPlacement) {
  const pl = placement ?? 'top';
  const align = pl.endsWith('-end') ? ALI_END : pl.endsWith('-start') ? ALI_START : ALI_CENTER;
  const position = pl.startsWith('top') ? POS_TOP : pl.startsWith('bottom') ? POS_BOTTOM : pl.startsWith('left') ? POS_LEFT : POS_RIGHT;
  return { position, align };
}

export function Floating(props: FloatingProps, host: ComponentHost) {
  const ctrlMode = !isUndefined(props.open);
  const triggerOpt = props.triggerMethod ?? 'click';
  const placementOpt = getPlacementOpt(props.placement);
  const offsetOpt = props.offset ?? (placementOpt.position === POS_TOP ? 20 : 10);
  const delayOpt = getDelayOpt(props.delay, props.triggerMethod !== 'hover');

  const state = vm({
    pos: '',
    isOpen: !!props.open,
  });
  watch(props, 'open', (v) => {
    state.isOpen = !!v;
  });

  let triggerEl: HTMLElement | undefined = undefined;
  let contentEl: HTMLDivElement | undefined = undefined;

  function update() {
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
      clearCloseTm()
      return;
    }
    if (state.isOpen) {
      return;
    }
    clearOpenTm();
    if (delayOpt.open > 0) {
      openTm = window.setTimeout(doOpen, delayOpt.open);
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
      openTm = window.setTimeout(doClose, delayOpt.close);
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
    const deregs: AnyFn[] = [];
    if (triggerOpt === 'hover') {
      const dereg = registerEvent(triggerEl, 'mouseenter', () => {
        open();
      });
      const dereg2 = registerEvent(triggerEl, 'mouseleave', () => {
        close();
      });
      deregs.push(dereg, dereg2);
    } else if (triggerOpt === 'click') {
      const dereg = registerEvent(triggerEl, 'click', () => {
        open();
      });
      const dereg2 = registerEvent(document.body, 'mousedown', (evt) => {
        const el = evt.target as Node;
        if (triggerEl?.contains(el) || contentEl?.contains(el)) {
          return;
        }
        doClose();
      });
      deregs.push(dereg, dereg2);
    }

    return () => deregs.forEach(fn => fn());
  });


  return (
    <>
      {props['slot:trigger']}
      <Portal>
        <Transition
          isEnter={state.isOpen}
          enterClass='opacity-100 scale-100'
          enterActiveClass='transition-[opacity,transform] duration-[0.25s,0.1s] ease-in'
          leaveActiveClass='transition-[opacity,transform] duration-[0.25s,0.2s] ease-out'
          leaveClass='opacity-0 scale-[1.05]'
          destroyAfterLeave
          on:beforeEnter={(el) => {
            contentEl = el as HTMLDivElement;
            update();
          }}
          on:afterLeave={() => {
            contentEl = undefined;
          }}
        >
          <div
            className={props.className}
            style={`z-index:${z.currentIndex + 1};${state.pos}`}
          >
            {props.children}
          </div>
        </Transition>
      </Portal>

    </>
  );
};