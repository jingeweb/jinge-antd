/**
 * 统一管理各类型组件的 zIndex。
 * Message 监听最高活动层并 +100。Modal/Drawer 每次显示分配独立的 +100 层级，
 * 已显示窗口的层级不随新窗口变化，释放时按活动分配重新计算，支持乱序卸载。
 * 浮层类组件应该在归属于 Modal 的每一层（出现在底层 Modal 上的可被下一层 Modal 挡住），且按 Popover -> Dropdown -> Tooltip 的方式增加 zIndex，因为业务上最可能是这种父子关系。
 */
import { context, vm, vmWatch } from 'jinge';

export const Z_CONTEXT = Symbol('ja-layer-z');
const layers = new Set<number>();

export const z = vm({
  currentIndex: 10,
  /** 增加 z-index 层级（+100)，返回减少层级的函数。 */
  increment,
  acquire,
  getTooltipZ,
  getPopoverZ,
  getDropdownZ,
  watchMessageZ,
});

function watchMessageZ(listener: (z: number) => void) {
  return vmWatch(
    z,
    'currentIndex',
    (v) => {
      listener(v + 100);
    },
    { immediate: true },
  );
}

function getTooltipZ() {
  return (context<number | undefined>(Z_CONTEXT) ?? 10) + 60;
}

function getPopoverZ() {
  return (context<number | undefined>(Z_CONTEXT) ?? 10) + 20;
}

function getDropdownZ() {
  return (context<number | undefined>(Z_CONTEXT) ?? 10) + 40;
}

function increment() {
  const allocation = acquire();
  return () => allocation.release();
}

function acquire() {
  const index = z.currentIndex + 100;
  layers.add(index);
  z.currentIndex = index;
  let released = false;
  return {
    index,
    release() {
      if (released) return;
      released = true;
      layers.delete(index);
      z.currentIndex = Math.max(10, ...layers);
    },
  };
}
