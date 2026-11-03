import type { JNode, WithEvents, WithExpose, WithSlots } from 'jinge';
export type SelectValue = string | number;
export type SelectOption<T extends SelectValue = SelectValue> = {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
};
export type ComboHandle = { focus(options?: FocusOptions): void; blur(): void };
export type ComboBase<T extends SelectValue> = {
  options: SelectOption<T>[];
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  filterOption?: boolean | ((query: string, option: SelectOption<T>) => boolean);
  size?: 'sm' | 'md' | 'lg';
  status?: 'error' | 'warning';
  id?: string;
  name?: string;
  form?: string;
  required?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  showSearch?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
  style?: string;
  triggerClassName?: string;
  popupClassName?: string;
  popupWidth?: number;
} & WithEvents<{
  openChange?(open: boolean, event?: Event): void;
  search?(query: string, event: Event): void;
  focus?(event: FocusEvent): void;
  blur?(event: FocusEvent): void;
}>;
export type SelectProps<T extends SelectValue = SelectValue> = ComboBase<T> &
  WithSlots<{
    option?: (props: { option: SelectOption<T> }) => JNode;
    selection?: (props: { option: SelectOption<T> }) => JNode;
  }> &
  WithExpose<ComboHandle> &
  (
    | ({ mode?: 'single'; value?: T | null; defaultValue?: T } & WithEvents<{
        change?(value: T | undefined, event: Event): void;
      }>)
    | ({
        mode: 'multiple';
        value?: T[] | null;
        defaultValue?: T[];
        maxTagCount?: number;
      } & WithEvents<{ change?(value: T[], event: Event): void }>)
  );
export type ComboRow<T extends SelectValue> = SelectOption<T> & { id: string };
export type ComboGroup<T extends SelectValue> = {
  key: string;
  label?: string;
  rows: ComboRow<T>[];
};
export type ComboState<T extends SelectValue> = {
  open: boolean;
  query: string;
  rows: ComboRow<T>[];
  groups: ComboGroup<T>[];
  active: string;
  width: number;
};
export function includesValue<T>(values: T[], value: T) {
  return values.includes(value);
}
export function optionId(id: string, value: SelectValue) {
  return `${id}-${typeof value}-${encodeURIComponent(String(value))}`;
}
