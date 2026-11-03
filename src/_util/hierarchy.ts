import { vmRaw } from 'jinge';
export type HierarchyKey = string | number;
export interface HierarchyEntry<N> {
  id: string;
  key: HierarchyKey;
  path: HierarchyKey[];
  labels: string[];
  node: N;
  parent?: string;
  level: number;
  pos: number;
  size: number;
  label: string;
  disabled: boolean;
  checkDisabled: boolean;
  children: HierarchyEntry<N>[];
  branch: boolean;
  lazy: boolean;
  loading: boolean;
  error?: string;
}
export function pathId(path: HierarchyKey[]) {
  return JSON.stringify(path);
}
function loadMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error)) || '加载失败';
}
export function createHierarchy<N extends { children?: N[] }>(config: {
  roots(): N[];
  key(node: N): HierarchyKey;
  label(node: N): string;
  disabled(node: N): boolean;
  checkDisabled?(node: N): boolean;
  lazy(node: N): boolean;
  unique?: boolean;
  loader(): ((node: N, options: { signal: AbortSignal }) => Promise<N[]>) | undefined;
  change(): void;
  error?(error: unknown, node: N): void;
}) {
  type Cached = { node: N; children: N[] };
  type Task = { node: N; controller: AbortController };
  let entries = new Map<string, HierarchyEntry<N>>(),
    roots: HierarchyEntry<N>[] = [],
    disposed = false;
  const cache = new Map<string, Cached>(),
    tasks = new Map<string, Task>(),
    errors = new Map<string, { node: N; message: string }>();
  function refresh() {
    const next = new Map<string, HierarchyEntry<N>>(),
      ancestors = new Set<N>(),
      keys = new Set<HierarchyKey>();
    function visit(nodes: N[], parent?: HierarchyEntry<N>): HierarchyEntry<N>[] {
      const siblings = new Set<HierarchyKey>();
      return nodes.map((node, index) => {
        const raw = vmRaw(node),
          key = config.key(node);
        if (ancestors.has(raw)) throw new Error('Hierarchy data must not contain cycles');
        if (siblings.has(key) || (config.unique && keys.has(key)))
          throw new Error('Hierarchy keys must be unique');
        if (typeof key !== 'string' && (typeof key !== 'number' || !Number.isFinite(key)))
          throw new Error('Hierarchy keys must be strings or finite numbers');
        siblings.add(key);
        keys.add(key);
        const path = [...(parent?.path ?? []), key],
          id = config.unique ? pathId([key]) : pathId(path);
        const cached = cache.get(id),
          explicit = node.children;
        const children = explicit ?? (cached?.node === raw ? cached.children : undefined);
        const lazy = children === undefined && config.lazy(node) && !!config.loader();
        const blocked = !!parent?.disabled || config.disabled(node);
        const entry: HierarchyEntry<N> = {
          id,
          key,
          path,
          labels: [...(parent?.labels ?? []), config.label(node)],
          node,
          parent: parent?.id,
          level: (parent?.level ?? 0) + 1,
          pos: index + 1,
          size: nodes.length,
          label: config.label(node),
          disabled: blocked,
          checkDisabled: blocked || !!config.checkDisabled?.(node),
          children: [],
          branch: !!children?.length || lazy,
          lazy,
          loading: lazy && tasks.get(id)?.node === raw,
          error: lazy && errors.get(id)?.node === raw ? errors.get(id)?.message : undefined,
        };
        next.set(id, entry);
        ancestors.add(raw);
        entry.children = visit(children ?? [], entry);
        ancestors.delete(raw);
        return entry;
      });
    }
    roots = visit(config.roots());
    entries = next;
    for (const [id, task] of tasks)
      if (entries.get(id)?.lazy && vmRaw(entries.get(id)!.node) === task.node) continue;
      else {
        tasks.delete(id);
        task.controller.abort();
      }
    for (const [id, item] of cache)
      if (
        !entries.has(id) ||
        vmRaw(entries.get(id)!.node) !== item.node ||
        entries.get(id)!.node.children !== undefined
      )
        cache.delete(id);
    for (const [id, item] of errors)
      if (
        !entries.has(id) ||
        vmRaw(entries.get(id)!.node) !== item.node ||
        entries.get(id)!.node.children !== undefined
      )
        errors.delete(id);
    return { roots, entries };
  }
  function load(id: string) {
    const entry = entries.get(id),
      loader = config.loader();
    if (disposed || !entry?.lazy || !loader || tasks.has(id)) return;
    const task = { node: vmRaw(entry.node), controller: new AbortController() };
    tasks.set(id, task);
    errors.delete(id);
    config.change();
    let result: Promise<N[]>;
    try {
      result = loader(entry.node, { signal: task.controller.signal });
    } catch (error) {
      result = Promise.reject(error);
    }
    void Promise.resolve(result)
      .then((children) => {
        if (!Array.isArray(children)) throw new Error('loadData must return an array');
        if (disposed || tasks.get(id) !== task || vmRaw(entries.get(id)?.node ?? {}) !== task.node)
          return;
        tasks.delete(id);
        cache.set(id, { node: task.node, children: [...children] });
        try {
          config.change();
        } catch (error) {
          cache.delete(id);
          errors.set(id, { node: task.node, message: loadMessage(error) });
          config.change();
          config.error?.(error, entry.node);
        }
      })
      .catch((error: unknown) => {
        if (disposed || tasks.get(id) !== task) return;
        tasks.delete(id);
        errors.set(id, {
          node: task.node,
          message: loadMessage(error),
        });
        config.change();
        config.error?.(error, entry.node);
      });
  }
  function dispose() {
    disposed = true;
    for (const task of tasks.values()) task.controller.abort();
    tasks.clear();
    cache.clear();
    errors.clear();
  }
  return {
    refresh,
    load,
    dispose,
    get entries() {
      return entries;
    },
    get roots() {
      return roots;
    },
  };
}
