/**
 * 统一管理各类型组件的 zIndex。
 * Message 组件应该始终在最顶层，不论有多少层 Modal。需要监听最新的 zIndex 并 + 10。
 * Modal 组件每出现一层，应该调用 increment + 10，销毁时调用  decrement - 10。
 * 浮层类组件应该在归属于 Modal 的每一层（出现在底层 Modal 上的可被下一层 Modal 挡住），且按 Popover -> Dropdown -> Tooltip 的方式增加 zIndex，因为业务上最可能是这种父子关系。
 */
import { vm, vmWatch } from 'jinge';

export const z = vm({
  currentIndex: 10,
  /** 增加 z-index 层级（+100)，返回减少层级的函数。 */
  increment,
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
  return z.currentIndex + 60;
}

function getPopoverZ() {
  return z.currentIndex + 20;
}

function getDropdownZ() {
  return z.currentIndex + 40;
}

function increment() {
  z.currentIndex += 100;
  return () => (z.currentIndex -= 100);
}
