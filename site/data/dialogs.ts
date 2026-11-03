import type { ApiRow, ComponentDoc } from './types';

import { DrawerExample } from '../demos/drawer';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import drawerSource from '../demos/drawer.tsx?raw';
import { ModalExample, ModalResultExample } from '../demos/modal';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import modalSource from '../demos/modal.tsx?raw';

const shared: ApiRow[] = [
  {
    name: 'open / defaultOpen',
    type: 'boolean',
    description: '受控显隐 / 默认显隐，初始化后不切换模式。Modal 默认打开，Drawer 默认关闭。',
  },
  {
    name: 'on:openChange',
    type: '(open: boolean) => void',
    description: '请求关闭时通知；受控模式需写回 open。',
  },
  {
    name: 'title / slot:title / children',
    type: 'string / JNode / JNode',
    description: '标题文本或插槽；children 为内容。',
  },
  {
    name: 'slot:footer / footer',
    type: 'JNode / boolean',
    description: '自定义页脚；footer=false 隐藏包括自定义内容的整个页脚。',
  },
  {
    name: 'closable / keyboard / closeWhenMaskClick',
    type: 'boolean',
    default: 'true',
    description: '关闭按钮 / Escape / 遮罩点击关闭；只处理最上层的关闭操作。',
  },
  {
    name: 'showMask',
    type: 'boolean',
    default: 'true',
    description: '显示遮罩。隐藏遮罩仍是模态窗口，背景不可交互。',
  },
  {
    name: 'autoFocus / returnFocus',
    type: 'boolean',
    default: 'true',
    description:
      '默认聚焦正文首个可聚焦元素，Tab 留在模态范围；关闭后恢复原焦点。子浮层 Portal 属于同一焦点范围。',
  },
  {
    name: 'ariaLabel / describedBy',
    type: 'string',
    description: '无标题时的可访问名称 / 描述元素 id。标题存在时自动使用 aria-labelledby。',
  },
  {
    name: 'className / style / maskClassName',
    type: 'string',
    description: '面板类名与样式 / 遮罩类名。',
  },
  {
    name: 'on:cancel / on:afterClose',
    type: '() => void / (result?: Result) => void',
    description:
      '取消按钮、关闭按钮、允许的遮罩或 Escape 触发 cancel；实际关闭后触发 afterClose，owner 卸载不触发。',
  },
  {
    name: 'ref.close',
    type: '(result?: Result) => void',
    description: '请求关闭并携带结果。可由外部主动结束，包括正在提交的窗口。',
  },
  {
    name: 'motion',
    type: 'boolean',
    default: 'true',
    description: '入场动画，尊重 reduced-motion。关闭立即卸载。',
  },
];
const limits = [
  '首轮关闭即销毁内容，再次打开会重新挂载。需要保留的表单值应放在父级 VM；暂不提供保留内部状态的关闭模式。',
  'Portal 渲染到当前页面 body；不支持自定义挂载容器、跨 iframe 或 body transform 特殊包含块。',
  '没有离场动画，afterClose 表示实际卸载，不等待动画。框架 Transition 的快速关闭问题记录为 F04。',
  '背景 inert 与滚动锁按层管理；第三方自行创建的 Portal 不自动属于焦点范围，优先使用本库浮层。',
];
export const dialogDocs: ComponentDoc[] = [
  {
    id: 'modal',
    name: 'Modal',
    title: '对话框',
    category: '反馈',
    status: 'ready',
    description: '用于编辑、确认等需要暂时阻断页面的操作。支持多层、键盘焦点管理与异步确认。',
    imports: ['Modal', 'modal', 'onModalConfirm'],
    demos: [
      {
        id: 'modal-basic',
        title: '编辑与异步确认',
        description: '模拟异步保存；返回 false 保持打开，提交期间禁用关闭操作。',
        render: ModalExample,
        source: modalSource,
      },
      {
        id: 'modal-result',
        title: '等待结果',
        description: 'modal.show 返回 close 和 waitForClose；关闭后再次等待仍得到同一结果。',
        render: ModalResultExample,
        source: modalSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'width / size / centered',
        type: "number | string / 'sm' | 'md' | 'lg' / boolean",
        default: '520 / md / true',
        description: '宽度；预设 360/520/800px；默认居中，false 时距顶部 10vh。均受视口约束。',
      },
      {
        name: 'on:confirm',
        type: 'ConfirmCallback<Result>',
        description:
          '可返回 Promise、false 或 { result }。false 或错误保持打开；期间去重，关闭后的旧请求不能影响新一轮打开。',
      },
      {
        name: 'on:error',
        type: '(error: unknown) => void',
        description: '确认异常回调；未指定时 console.error。',
      },
      {
        name: 'confirmText / cancelText / confirmValue / cancelValue',
        type: 'string / string / Result / Result',
        default: '确 认 / 取 消 / undefined / undefined',
        description: '默认页脚按钮文本与结果。注册 confirm 时以回调结果为准。',
      },
      {
        name: 'modal.show / ModalInstance',
        type: '(options: ShowModalOptions<Result>) => { close, waitForClose }',
        description:
          '同 Modal 的配置，正文用 content 或 slot:content；独立根无法继承调用方 context。Promise 在卸载清理后完成。',
      },
      {
        name: 'onModalConfirm',
        type: '(listener: ConfirmCallback<Result>) => void',
        description: '正文子组件注册确认处理，卸载自动解除。',
      },
    ],
    notes: limits,
  },
  {
    id: 'drawer',
    name: 'Drawer',
    title: '抽屉',
    category: '反馈',
    status: 'ready',
    description: '从页面边缘展示详情或编辑内容，共用 Modal 的多层、滚动锁和焦点管理。',
    demos: [
      {
        id: 'drawer-basic',
        title: '方向与嵌套',
        description: '四个方向和自定义页脚；关联记录展示第二层抽屉。',
        render: DrawerExample,
        source: drawerSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'placement',
        type: "'left' | 'right' | 'top' | 'bottom'",
        default: 'right',
        description: '抽屉方向，支持打开期间修改。',
      },
      {
        name: 'width / height / size',
        type: "number | string / number | string / 'sm' | 'md' | 'lg'",
        default: '378 / 378 / md',
        description:
          '左右方向使用 width，上下使用 height；预设宽度 256/378/736px。另一轴铺满视口。',
      },
    ],
    notes: [
      '没有默认页脚和确认流程，业务通过 slot:footer 与受控 open 组合提交/加载；不做拖拽缩放或嵌套推挤效果。',
      ...limits,
    ],
  },
];
