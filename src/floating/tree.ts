/** Portal content is not a DOM descendant of its trigger. Keep logical ancestry explicitly. */
export interface FloatingNode {
  layer?: number;
  trigger?: HTMLElement;
  content?: HTMLDivElement;
  children: Set<FloatingNode>;
}
export const FLOATING_CONTEXT = Symbol('ja-floating-parent');
const visible: FloatingNode[] = [];
function descendant(parent: FloatingNode, child: FloatingNode): boolean {
  for (const entry of parent.children) if (entry === child || descendant(entry, child)) return true;
  return false;
}
export function showNode(node: FloatingNode) {
  hideNode(node);
  const firstChild = visible.findIndex((entry) => descendant(node, entry));
  if (firstChild < 0) visible.push(node);
  else visible.splice(firstChild, 0, node);
}
export function hideNode(node: FloatingNode) {
  const index = visible.indexOf(node);
  if (index >= 0) visible.splice(index, 1);
}
export function isTopNode(node: FloatingNode) {
  let top: FloatingNode | undefined;
  for (const entry of visible) if (!top || (entry.layer ?? 0) >= (top.layer ?? 0)) top = entry;
  return top === node;
}
export function containsNode(node: FloatingNode, target: Node | null): boolean {
  if (!target) return false;
  if (node.trigger?.contains(target) || node.content?.contains(target)) return true;
  for (const child of node.children) if (containsNode(child, target)) return true;
  return false;
}
