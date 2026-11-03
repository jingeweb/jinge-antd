import type { JNode, WithEvents, WithExpose, WithSlots } from 'jinge';
export type CascaderKey = string | number;
export type CascaderValue = CascaderKey[];
export interface CascaderOption {
  value: CascaderKey;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
  isLeaf?: boolean;
}
export type CascaderHandle = { focus(options?: FocusOptions): void; blur(): void };
export type CascaderProps = {
  options: CascaderOption[];
  value?: CascaderValue | null;
  defaultValue?: CascaderValue;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  changeOnSelect?: boolean;
  showSearch?: boolean;
  allowClear?: boolean;
  loadData?(
    this: void,
    node: CascaderOption,
    options: { signal: AbortSignal },
  ): Promise<CascaderOption[]>;
  placeholder?: string;
  emptyText?: string;
  id?: string;
  name?: string;
  form?: string;
  required?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: 'error' | 'warning';
  className?: string;
  style?: string;
} & WithExpose<CascaderHandle> &
  WithSlots<{ option?: (props: { option: CascaderOption; path: CascaderValue }) => JNode }> &
  WithEvents<{
    change?(value: CascaderValue | null, options: CascaderOption[], event: Event): void;
    openChange?(open: boolean, event?: Event): void;
    search?(query: string, event: Event): void;
    loadError?(error: unknown, node: CascaderOption): void;
    focus?(event: FocusEvent): void;
    blur?(event: FocusEvent): void;
  }>;
