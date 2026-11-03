import type { ComponentDoc, ApiRow } from './types';

import { FloatingExample } from '../demos/floating';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import floatingSource from '../demos/floating.tsx?raw';
import { PopconfirmExample } from '../demos/popconfirm';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import popconfirmSource from '../demos/popconfirm.tsx?raw';
import { PopoverExample } from '../demos/popover';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import popoverSource from '../demos/popover.tsx?raw';
import { TooltipExample } from '../demos/tooltip';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import tooltipSource from '../demos/tooltip.tsx?raw';

const shared: ApiRow[] = [
  {
    name: 'open / defaultOpen',
    type: 'boolean',
    default: 'false',
    description: '受控 / 非受控显隐。初始化后不切换模式。',
  },
  {
    name: 'on:openChange',
    type: '(open: boolean) => void',
    description: '用户请求显隐时通知；受控模式需要使用方写回 open。',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '禁止打开；已打开时卸载浮层内容。',
  },
  {
    name: 'placement',
    type: 'FloatingPlacement（12 个方位）',
    default: 'top',
    description: '方向与 start/end 对齐，支持打开期间动态更新。',
  },
  {
    name: 'className / style',
    type: 'string',
    description: '作用于浮层内容容器。定位和安全尺寸约束由组件管理。',
  },
];
const limits = [
  '触发插槽必须是一个首根为 HTMLElement 的稳定元素/组件；不接裸文本、纯注释或初始隐藏的条件根。',
  '浮层使用当前页面 body 的 fixed 定位。暂不承诺跨 iframe、虚拟锚点、任意自定义定位容器或 body transform 后的特殊包含块。',
  '目前提供 CSS 入场动画，关闭立即卸载。离场动画暂缓，框架 Transition 的快速关闭问题已独立记录为 F04。',
];
export const overlayDocs: ComponentDoc[] = [
  {
    id: 'floating',
    name: 'Floating',
    title: '浮层基础',
    category: '基础机制',
    status: 'ready',
    description:
      '组件库内部共用的定位与交互基础，也可以直接组合使用。沿用本项目实现，不新增定位依赖。',
    demos: [
      {
        id: 'floating-basic',
        title: '受控定位',
        description: '打开后修改方向，观察定位更新、边界翻转和关闭。',
        render: FloatingExample,
        source: floatingSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'slot:trigger / children',
        type: 'JNode',
        description: '触发器插槽 / 浮层内容插槽。',
      },
      {
        name: 'triggerMethod',
        type: "'click' | 'hover' | 'focus' | 'none' | ('click' | 'hover' | 'focus')[]",
        default: 'click',
        description: '支持组合；none 仅由外部 open 控制。',
      },
      {
        name: 'offset / padding',
        type: 'number',
        default: '10 / 8',
        description: '与触发器距离 / 视口安全边距，单位像素。',
      },
      {
        name: 'delay',
        type: 'number | { open: number; close: number }',
        default: '0',
        description:
          'hover 开关 / click 打开延迟；focus 与 click 关闭立即执行。提前离开和卸载取消待执行任务。',
      },
      {
        name: 'safePolygon',
        type: 'boolean',
        default: 'false',
        description: '保持触发器和内容之间的鼠标安全通道，兼容页面滚动。',
      },
      {
        name: 'dismissable / keyboard',
        type: 'boolean',
        default: 'true',
        description: '外部鼠标/触摸关闭 / Esc 关闭最上层浮层。',
      },
      {
        name: 'autoFocus / returnFocus',
        type: 'boolean',
        default: 'false / true',
        description: '打开时聚焦首个可聚焦元素；关闭时按需要恢复触发器焦点，外部点击不抢焦点。',
      },
      {
        name: 'role / ariaLabel',
        type: "'dialog' | 'tooltip' | 'menu' | 'listbox' / string",
        default: 'dialog / 浮层',
        description: '管理触发器的 aria-controls/expanded 或 tooltip 的 describedby。',
      },
      {
        name: 'id / zIndex / motion',
        type: 'string / number / boolean',
        default: '自动生成 / 必填 / true',
        description: 'id 在初始化时固定；zIndex 为层级；motion 控制入场动画并尊重 reduced-motion。',
      },
    ],
    notes: limits,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    title: '文字提示',
    category: '数据展示',
    status: 'ready',
    description: '轻量解释信息，默认通过悬浮和键盘聚焦触发。提示自身不接收焦点。',
    demos: [
      {
        id: 'tooltip-basic',
        title: '悬浮、聚焦与点击',
        description: '使用 Tab 聚焦触发器、Esc 关闭；可配置方向和触发方式。',
        render: TooltipExample,
        source: tooltipSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'content / slot:content',
        type: 'string / JNode（二选一）',
        description: '提示内容；没有内容时不打开。',
      },
      { name: 'children', type: 'JNode', description: '触发器。' },
      {
        name: 'triggerMethod / delay',
        type: 'FloatingTrigger / FloatingDuration',
        default: '[hover, focus] / { open: 300, close: 100 }',
        description: 'hover 延迟与触发方式。',
      },
      {
        name: 'safePolygon / offset / padding / keyboard / motion / id',
        type: '同 Floating',
        default: 'true / 10 / 8 / true / true / 自动生成',
        description: '安全通道、定位与键盘参数。',
      },
    ],
    notes: [
      '需要输入框、按钮等交互内容时应使用 Popover。',
      'role=tooltip 和 aria-describedby 自动管理，不自动给不可聚焦的静态元素添加 Tab 顺序。',
      ...limits,
    ],
  },
  {
    id: 'popover',
    name: 'Popover',
    title: '气泡卡片',
    category: '数据展示',
    status: 'ready',
    description: '展示补充信息或少量交互操作，支持受控显示和嵌套 Portal。',
    demos: [
      {
        id: 'popover-basic',
        title: '交互内容与受控显隐',
        description: 'autoFocus 可以把焦点移入内容；Esc 关闭后恢复触发器焦点。',
        render: PopoverExample,
        source: popoverSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'content / slot:content / children',
        type: 'string / JNode / JNode',
        description: '内容二选一；children 为触发器。',
      },
      {
        name: 'triggerMethod / delay / safePolygon',
        type: 'FloatingTrigger / FloatingDuration / boolean',
        default: 'click / 0 / true',
        description: '与 Floating 相同的交互策略。',
      },
      {
        name: 'autoFocus / returnFocus / dismissable / keyboard',
        type: 'boolean',
        default: 'false / true / true / true',
        description: '非模态焦点管理和关闭策略；不限制 Tab 在浮层中循环。',
      },
      {
        name: 'ariaLabel / offset / padding / motion / id',
        type: '同 Floating',
        default: '更多信息 / 10 / 8 / true / 自动生成',
        description: '对话框名称与定位参数。',
      },
    ],
    notes: ['不自动推断插槽内标题，建议给交互浮层提供明确的 ariaLabel。', ...limits],
  },
  {
    id: 'popconfirm',
    name: 'Popconfirm',
    title: '气泡确认',
    category: '反馈',
    status: 'ready',
    description: '在触发操作附近进行确认。支持同步/异步确认、返回 false 阻止关闭，以及错误反馈。',
    demos: [
      {
        id: 'popconfirm-basic',
        title: '异步确认和阻止关闭',
        description: '提交时禁用按钮与 Escape，避免重复请求；取消按钮明确关闭。',
        render: PopconfirmExample,
        source: popconfirmSource,
      },
    ],
    api: [
      ...shared,
      { name: 'title / slot:title', type: 'string / JNode（二选一）', description: '确认标题。' },
      {
        name: 'content / slot:content',
        type: 'string / JNode',
        description: '说明，插槽优先，不重复渲染两份。',
      },
      { name: 'slot:icon / children', type: 'JNode', description: '图标插槽 / 触发器。' },
      {
        name: 'confirmText / cancelText',
        type: 'string',
        default: '确 认 / 取 消',
        description: '按钮文本。',
      },
      {
        name: 'on:confirm',
        type: '() => void | boolean | Promise<void | boolean>',
        description: 'false 阻止关闭，异步期间去重；抛错或拒绝会保持打开并清理 loading。',
      },
      {
        name: 'on:cancel / on:error',
        type: '() => void / (error: unknown) => void',
        description: '取消按钮事件 / 错误回调，未指定 error 时 console.error。',
      },
      {
        name: 'dismissable / keyboard / delay',
        type: 'boolean / boolean / FloatingDuration',
        default: 'false / true / 0',
        description: '提交期间关闭请求被阻止；父级仍可通过 open 主动关闭。',
      },
      {
        name: 'onPopconfirmConfirm',
        type: '(listener: ConfirmCallback) => void',
        description: '内容子组件注册确认处理；随所属组件卸载解除。',
      },
    ],
    notes: [
      '取消事件只由取消按钮触发；点击触发器、Esc 或允许的外部点击仅请求关闭。',
      '组件卸载后不会提交异步处理的 UI 完成回调；业务自身的异步副作用仍由业务管理。',
      ...limits,
    ],
  },
];
