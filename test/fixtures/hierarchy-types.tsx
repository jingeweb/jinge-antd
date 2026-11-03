import { ref } from 'jinge';

import {
  Tree,
  Cascader,
  type TreeProps,
  type CascaderProps,
  type TreeNode,
  type CascaderValue,
} from '../../src';
export function HierarchyTypes() {
  const tree = ref<typeof Tree>(),
    cascader = ref<typeof Cascader>();
  // @ts-expect-error keys are stable primitives.
  const badTree: TreeProps = { treeData: [{ key: { id: 1 }, label: 'bad' }] };
  // @ts-expect-error single cascader values are full paths.
  const badPath: CascaderProps = { options: [], value: 'a' };
  // @ts-expect-error loader must return children, not mutate an implicit global cache.
  const badLoad: TreeProps = { treeData: [], loadData: async () => undefined };
  void badTree;
  void badPath;
  void badLoad;
  return (
    <>
      <Tree
        ref={tree}
        treeData={[]}
        loadData={async (node, { signal }) => {
          const expected: TreeNode = node;
          void expected;
          void signal;
          return [];
        }}
      />
      <Cascader
        ref={cascader}
        options={[]}
        on:change={(path) => {
          const expected: CascaderValue | null = path;
          void expected;
        }}
      />
    </>
  );
}
