import type { HierarchyEntry } from '../_util/hierarchy';
import type { TreeKey, TreeNode } from './common';
export function treeChecks(roots: HierarchyEntry<TreeNode>[], seeds: TreeKey[], strict: boolean) {
  const full = new Set(seeds),
    half = new Set<TreeKey>(),
    all: HierarchyEntry<TreeNode>[] = [];
  function descend(entry: HierarchyEntry<TreeNode>, inherited: boolean) {
    all.push(entry);
    if (inherited && !entry.checkDisabled) full.add(entry.key);
    for (const child of entry.children)
      descend(child, !strict && !entry.checkDisabled && full.has(entry.key));
    if (strict || entry.checkDisabled) return;
    const children = entry.children.filter((child) => !child.checkDisabled);
    if (!children.length) return;
    if (children.every((child) => full.has(child.key))) full.add(entry.key);
    else {
      full.delete(entry.key);
      if (children.some((child) => full.has(child.key) || half.has(child.key))) half.add(entry.key);
    }
  }
  for (const root of roots) descend(root, false);
  const known = new Set(all.map((entry) => entry.key));
  return {
    full,
    half,
    keys: [
      ...all.filter((entry) => full.has(entry.key)).map((entry) => entry.key),
      ...seeds.filter((key) => !known.has(key)),
    ],
    halfKeys: all.filter((entry) => half.has(entry.key)).map((entry) => entry.key),
  };
}
