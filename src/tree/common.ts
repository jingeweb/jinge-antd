import type { JNode, WithEvents, WithExpose, WithSlots } from 'jinge';
export type TreeKey = string | number;
export interface TreeNode {
  key: TreeKey;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  isLeaf?: boolean;
}
export type TreeHandle = { focus(key?: TreeKey): void; blur(): void };
export type TreeProps = {
  treeData: TreeNode[];
  expandedKeys?: TreeKey[];
  defaultExpandedKeys?: TreeKey[];
  defaultExpandAll?: boolean;
  selectedKeys?: TreeKey[];
  defaultSelectedKeys?: TreeKey[];
  multiple?: boolean;
  selectable?: boolean;
  checkedKeys?: TreeKey[];
  defaultCheckedKeys?: TreeKey[];
  checkable?: boolean;
  checkStrictly?: boolean;
  disabled?: boolean;
  filter?: string;
  filterNode?(this: void, query: string, node: TreeNode): boolean;
  loadData?(this: void, node: TreeNode, options: { signal: AbortSignal }): Promise<TreeNode[]>;
  emptyText?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: string;
} & WithExpose<TreeHandle> &
  WithSlots<{ title?: (props: { node: TreeNode }) => JNode }> &
  WithEvents<{
    expand?(keys: TreeKey[], info: { node: TreeNode; expanded: boolean }, event: Event): void;
    select?(keys: TreeKey[], info: { node: TreeNode; selected: boolean }, event: Event): void;
    check?(
      keys: TreeKey[],
      info: { node: TreeNode; checked: boolean; halfCheckedKeys: TreeKey[] },
      event: Event,
    ): void;
    loadError?(error: unknown, node: TreeNode): void;
  }>;
