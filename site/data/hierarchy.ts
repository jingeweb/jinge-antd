import type { ComponentDoc } from './types';

import { CascaderExample, CascaderFormExample } from '../demos/cascader';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import cascaderSource from '../demos/cascader.tsx?raw';
import { TreeExample, TreeLazyExample } from '../demos/tree';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import treeSource from '../demos/tree.tsx?raw';
const loading = {
  name: 'loadData / on:loadError',
  type: '(node,{signal:AbortSignal}) => Promise<Node[]> / (error,node) => void',
  description:
    '无 children 且 isLeaf=false 的节点可懒加载；返回子节点数组，不需修改父数据。同节点去重、成功缓存，空数组成为叶子，失败可重试。替换节点对象/移除节点/提供显式 children/卸载会中止旧请求并隔离旧结果。折叠或关闭可继续完成缓存；自定义 loader 应响应 AbortSignal 清理资源。',
};
export const hierarchyDocs: ComponentDoc[] = [
  {
    id: 'tree',
    name: 'Tree',
    title: '树',
    category: '数据展示',
    status: 'ready',
    description: '层级展开、选择、关联或独立勾选、过滤、异步加载与键盘导航。',
    demos: [
      {
        id: 'tree-basic',
        title: '部门权限与过滤',
        description:
          '勾选父级关联可用子项，部分子项勾选时父级半选。停用部门形成禁用边界；筛选保留祖先并展开路径，清空后恢复原展开状态。选中与勾选分别受控。',
        render: TreeExample,
        source: treeSource,
      },
      {
        id: 'tree-lazy',
        title: '异步组织与失败重试',
        description:
          '展开远程组织加载子节点；示例首次模拟失败，可点击重试或按右方向键重试。仅本地模拟，不访问外部服务。',
        render: TreeLazyExample,
        source: treeSource,
      },
    ],
    api: [
      {
        name: 'treeData / TreeNode',
        type: 'TreeNode[] / {key,label,children?,disabled?,disableCheckbox?,selectable?,isLeaf?}',
        description:
          'key 是全树唯一的 string/有限 number，0 与字符串 0 不同；label 为搜索/可访问名称。禁止循环和重复 key，错误配置会明确抛出。children 缺失与空数组语义不同：isLeaf=false 且无 children 时才加载。',
      },
      {
        name: 'expandedKeys / defaultExpandedKeys / defaultExpandAll',
        type: 'TreeKey[] / TreeKey[] / boolean',
        description:
          '初始化 expandedKeys 非 undefined 为受控。defaultExpandAll 仅展开首次已有分支，不无限加载未来节点。default 数组做快照；后续默认值变更不覆盖用户操作。',
      },
      {
        name: 'selectedKeys / defaultSelectedKeys / multiple / selectable',
        type: 'TreeKey[] / TreeKey[] / boolean / boolean',
        default: '[] / [] / false / true',
        description:
          '选择与勾选独立。单选点击产生单元素数组，多选不要求 Ctrl，点击/Enter/非勾选树 Space 可切换；节点 selectable=false 仅禁止自身选择。受控父级可拒绝。',
      },
      {
        name: 'checkedKeys / defaultCheckedKeys / checkable / checkStrictly',
        type: 'TreeKey[] / TreeKey[] / boolean / boolean',
        default: '[] / [] / false / false',
        description:
          '默认关联勾选，返回全部已知完整勾选节点，halfCheckedKeys 单列。关闭 checkStrictly 时勾选传递给可用后代并向祖先汇总。尚未加载的已勾选父级会在加载后传递给新子项；未触发用户操作时不额外发 check。',
      },
      {
        name: 'disabled / TreeNode.disabled / disableCheckbox',
        type: 'boolean',
        description:
          '全局 disabled 禁止操作。节点 disabled 禁止自身及其整个子树；disableCheckbox 仅禁止当前勾选并打断关联，后代可独立操作。禁用子树不计入上级全选/半选汇总；外部已勾选的禁用值保留显示。',
      },
      {
        name: 'filter / filterNode',
        type: 'string / (query,node) => boolean',
        description:
          '默认按 label 不区分大小写匹配，保留匹配节点及祖先。过滤期间祖先强制展开，清空恢复用户展开状态；不后台加载未展开数据。自定义匹配器在普通 JS 中执行。',
      },
      loading,
      {
        name: 'on:expand / on:select',
        type: '(keys,{node,expanded | selected},event) => void',
        description:
          '分别请求新的展开/选择数组。控制模式初始化固定，受控父级需写回相应 keys；展开/选择不会隐式触发勾选。',
      },
      {
        name: 'on:check',
        type: '(keys,{node,checked,halfCheckedKeys},event) => void',
        description:
          '请求完整勾选数组与半选信息；键盘 Space 和点击复选标记一致。输出顺序为树的深度优先顺序，未知 key 保留等待后续数据。',
      },
      {
        name: 'slot:title',
        type: '({node:TreeNode}) => JNode',
        description:
          '组件级稳定标题插槽。label 仍是必需文本；不支持运行中给单个数据节点插入渲染函数。',
      },
      {
        name: '键盘 / ref',
        type: 'focus(key?) / blur()',
        description:
          '上/下在可见可用节点间移动；右展开或进入子项，左收起或回父级，Home/End 首末，Enter 选择，Space 勾选，字符前缀定位。只有一个 Tab 停靠点。focus 定位可见节点；外部收起/移除焦点节点回最近可见祖先，外部焦点不被夺取。',
      },
      {
        name: 'id / ariaLabel / ariaLabelledby / ariaDescribedby',
        type: 'string',
        description:
          'tree/treeitem、level/posinset/setsize、selected/checked/mixed/expanded/busy 与 roving focus 语义。Tree 不是原生表单字段；通过 keys 事件绑定业务字段。',
      },
      {
        name: 'size / className / style / emptyText',
        type: 'sm | md | lg / string / string / string',
        default: 'md / — / — / 暂无数据',
        description: '尺寸、外层样式和无结果/空数据说明。',
      },
    ],
    notes: [
      '首轮不含拖动、虚拟化、大树增量计算、连线或任意每节点渲染函数；更新时遍历已加载节点，不提供增量计算，适合中小规模业务树。',
      '节点键稳定且全树唯一；可对已有 VM 数据做响应式修改，也可替换 treeData。异步子项由组件缓存而非回写业务对象。替换父节点对象会使其缓存失效。',
      '数据遍历位于普通 .ts 模块；TSX 普通回调返回 node.children 被误识别为插槽的框架问题已记录为 F14，独立探针保持真实失败，未修改框架。',
    ],
  },
  {
    id: 'cascader',
    name: 'Cascader',
    title: '级联选择',
    category: '数据录入',
    status: 'ready',
    description: '单一路径、逐级选择、可选中间层、路径搜索、异步加载、清空与表单。',
    demos: [
      {
        id: 'cascader-basic',
        title: '服务地区与路径搜索',
        description:
          '选择完整地区路径，搜索已加载的完整名称；切换中间级选择后可选择省/市。远程地区首次模拟失败，可重试。',
        render: CascaderExample,
        source: cascaderSource,
      },
      {
        id: 'cascader-form',
        title: 'Form 字段与重置',
        description: '完整路径进入业务字段，支持必填校验、首错焦点、保存与重置。数字 0 原样保留。',
        render: CascaderFormExample,
        source: cascaderSource,
      },
    ],
    api: [
      {
        name: 'options / CascaderOption',
        type: '{value,label,children?,disabled?,isLeaf?}[]',
        description:
          'value 为 string/有限 number，同级唯一；不同父级允许重复 value，完整路径区分节点。disabled 作用于整个子树。无 children 且 isLeaf=false 表示懒加载。禁止循环数据和同级重复值。',
      },
      {
        name: 'value / defaultValue / on:change',
        type: 'CascaderValue | null / CascaderValue / (value,options,event) => void',
        description:
          'CascaderValue 为 (string | number)[]，空值统一 null。初始化 value 非 undefined 时受控，默认值做快照。只有选择可提交项或清空时发 change；导航、加载和搜索不提交。未知外部路径保留，选项到达后补全标签。',
      },
      {
        name: 'changeOnSelect',
        type: 'boolean',
        default: 'false',
        description:
          '默认选叶子才提交。开启后点击中间层也提交并保留面板，仍可继续选择下级；方向键导航不提交。',
      },
      {
        name: 'showSearch / on:search',
        type: 'boolean / (query,event) => void',
        default: 'false',
        description:
          '搜索已加载的叶子完整标签路径；开启 changeOnSelect 时也包含中间层。空格分词，各词均须匹配。不自动加载未知后代或提供远程搜索；IME 期间不选中，结束后报告一次搜索。',
      },
      loading,
      {
        name: 'open / defaultOpen / on:openChange',
        type: 'boolean / boolean / (open,event?) => void',
        description:
          '独立受控/默认浮层。ArrowDown/Enter 打开；Escape 仅关闭当前浮层并保留父 Modal。Tab 自然离开，外部点击保留外部焦点。父级可以拒绝显隐请求。',
      },
      {
        name: 'disabled / readOnly / allowClear',
        type: 'boolean',
        default: 'false',
        description:
          '禁用或只读关闭并禁止打开/修改。只读保留提交值；disabled 不参加原生提交。清空发 null，受控父级可拒绝。',
      },
      {
        name: 'name / form / required',
        type: 'string / string / boolean',
        description:
          '隐藏字段以 JSON 数组序列化，保留数字类型、特殊字符及层级，空值为空字符串。原生必填校验聚焦可见触发器；reset 恢复默认快照或受控父值，不发 change。',
      },
      {
        name: 'slot:option',
        type: '({option,path}) => JNode',
        description: '组件级稳定选项内容插槽；label 用于触发器展示、搜索与可访问名称。',
      },
      {
        name: '键盘 / ref',
        type: 'focus(options?) / blur()',
        description:
          '上/下、Home/End 在当前列可用项间移动；右进入下级/加载，左返回上级；Enter 提交叶子或按 changeOnSelect 规则选择，Escape 取消浏览草稿，Tab 离开。非搜索模式支持字符前缀定位。',
      },
      {
        name: 'id / ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid',
        type: 'string / boolean',
        description:
          '可关联 label/FormField。combobox 控制一个 listbox，列为命名 group，选项以完整路径命名，aria-activedescendant 保留触发器焦点。',
      },
      {
        name: 'size / status / className / style / placeholder / emptyText / autoFocus',
        type: 'sm | md | lg / error | warning / string / string / string / string / boolean',
        description: '尺寸、状态、外层样式、占位/空态和初始焦点。',
      },
      {
        name: 'on:focus / on:blur',
        type: '(event:FocusEvent) => void',
        description: 'focus 为原生触发器事件，blur 在离开控件后发送，可与 FormField 绑定。',
      },
    ],
    notes: [
      '首轮为单一路径；多选级联、悬浮展开、字段别名适配、虚拟化、远程搜索和每节点运行时新增插槽暂缓。多节点选择优先使用 Tree 勾选。',
      '加载结果按节点对象和完整路径缓存。浏览面板关闭后可以继续缓存结果，不会自动选中；数据替换与卸载中止旧请求。Cascader 不改变传入 options。',
      '原生表单使用 JSON 路径字符串；FormField 使用原生路径数组，并将 change 的第一个参数传给字段回调。示例不访问外部服务。',
    ],
  },
];
