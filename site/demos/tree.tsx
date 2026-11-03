import { vm } from 'jinge';
import { Button, Input, Space, Tree, type TreeKey, type TreeNode } from 'jinge-antd';
const departments: TreeNode[] = [
  {
    key: 'company',
    label: '研发中心',
    children: [
      { key: 0, label: '平台开发' },
      { key: 'ops', label: '运维团队' },
      {
        key: 'archive',
        label: '已停用部门',
        disabled: true,
        children: [{ key: 'old', label: '历史团队' }],
      },
    ],
  },
];
function keysText(keys: TreeKey[]) {
  return JSON.stringify(keys);
}
export function TreeExample() {
  const state = vm({
    expanded: ['company'] as TreeKey[],
    selected: [] as TreeKey[],
    checked: [] as TreeKey[],
    half: [] as TreeKey[],
    query: '',
    strict: false,
    disabled: false,
  });
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Input
        ariaLabel="筛选部门"
        placeholder="输入部门名称"
        value={state.query}
        on:change={(value) => {
          state.query = value;
        }}
      />
      <Tree
        treeData={departments}
        expandedKeys={state.expanded}
        selectedKeys={state.selected}
        checkedKeys={state.checked}
        checkable
        checkStrictly={state.strict}
        filter={state.query}
        disabled={state.disabled}
        ariaLabel="部门权限树"
        on:expand={(keys) => {
          state.expanded = keys;
        }}
        on:select={(keys) => {
          state.selected = keys;
        }}
        on:check={(keys, info) => {
          state.checked = keys;
          state.half = info.halfCheckedKeys;
        }}
        slot:title={(slot) => <span>{slot.node.label}</span>}
      />
      <Space wrap>
        <Button
          on:click={() => {
            state.strict = !state.strict;
          }}
        >
          切换独立勾选
        </Button>
        <Button
          on:click={() => {
            state.disabled = !state.disabled;
          }}
        >
          切换树禁用
        </Button>
      </Space>
      <output>
        已勾选：{keysText(state.checked)}；半选：{keysText(state.half)}
      </output>
    </Space>
  );
}
export function TreeLazyExample() {
  const state = vm({ selected: [] as TreeKey[] }),
    nodes: TreeNode[] = [{ key: 'remote', label: '远程组织', isLeaf: false }];
  let attempts = 0;
  function load(_node: TreeNode, { signal }: { signal: AbortSignal }): Promise<TreeNode[]> {
    const attempt = ++attempts;
    return new Promise((resolve, reject) => {
      const abort = () => {
        window.clearTimeout(timer);
        reject(new Error('已取消'));
      };
      const timer = window.setTimeout(() => {
        signal.removeEventListener('abort', abort);
        if (attempt === 1) reject(new Error('模拟加载失败，请重试'));
        else resolve([{ key: 'remote-team', label: '远程业务团队' }]);
      }, 250);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  }
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Tree
        treeData={nodes}
        loadData={load}
        ariaLabel="远程组织树"
        on:select={(keys) => {
          state.selected = keys;
        }}
      />
      <output>已选择：{keysText(state.selected)}</output>
    </Space>
  );
}
