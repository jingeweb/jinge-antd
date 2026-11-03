import type { JNode, WithEvents, WithExpose, WithSlots } from 'jinge';
export type MenuValue = string | number;
export type MenuOption<T extends MenuValue = MenuValue> = {
  value: T;
  label?: string;
  ariaLabel?: string;
  type?: 'item' | 'group' | 'divider';
  disabled?: boolean;
  danger?: boolean;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
  children?: MenuOption<T>[];
} & WithSlots<{ label?: JNode; icon?: JNode }>;
export type MenuHandle = { focus(edge?: 'first' | 'last'): void };
export type MenuProps<T extends MenuValue = MenuValue> = {
  options: MenuOption<T>[];
  value?: T | null;
  defaultValue?: T;
  openKeys?: T[];
  defaultOpenKeys?: T[];
  mode?: 'vertical' | 'horizontal';
  accordion?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  emptyText?: string;
  className?: string;
  style?: string;
  /** Embedding in an existing menu container (Dropdown/Floating). */
  rootRole?: 'menu' | 'menubar' | 'presentation';
} & WithExpose<MenuHandle> &
  WithEvents<{
    change?(value: T, event: Event): void;
    openChange?(keys: T[], event?: Event): void;
    dismiss?(event: KeyboardEvent): void;
  }>;
export function menuLabel<T extends MenuValue>(option: MenuOption<T>) {
  return option.label ?? option.ariaLabel ?? String(option.value);
}
export function menuChildren<T extends MenuValue>(children?: MenuOption<T>[]) {
  return !!children?.length;
}
export function menuOpen<T>(keys: T[], value: T) {
  return keys.includes(value);
}
