import type { ComponentDoc } from './types';

import { AlertExample } from '../demos/alert';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import alertSource from '../demos/alert.tsx?raw';
import { ProgressExample } from '../demos/progress';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import progressSource from '../demos/progress.tsx?raw';
import { ResultExample } from '../demos/result';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import resultSource from '../demos/result.tsx?raw';
import { SkeletonExample } from '../demos/skeleton';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import skeletonSource from '../demos/skeleton.tsx?raw';
import { SpinExample } from '../demos/spin';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import spinSource from '../demos/spin.tsx?raw';

export const feedbackDocs: ComponentDoc[] = [
  {
    id: 'result',
    name: 'Result',
    title: '结果',
    category: '反馈',
    status: 'ready',
    description: '展示操作结果和下一步动作，支持常用状态及无权限、未找到、服务错误页面。',
    demos: [
      {
        id: 'result-basic',
        title: '状态与后续操作',
        description: '切换状态查看默认标题和图标；操作由业务处理，组件不会自动导航。',
        render: ResultExample,
        source: resultSource,
      },
    ],
    api: [
      {
        name: 'status',
        type: "'success' | 'info' | 'warning' | 'error' | '403' | '404' | '500'",
        default: 'info',
        description: '四种结果和三个常见错误页，复用内置图标或状态码，不依赖外部插画。',
      },
      {
        name: 'title / slot:title / subTitle / slot:subTitle',
        type: 'string / JNode',
        description:
          '插槽优先；未提供标题时使用状态标题，错误页有默认说明。显式空字符串可以隐藏对应文本。文字标题为 h2。',
      },
      {
        name: 'showIcon / slot:icon / slot:extra / children',
        type: 'boolean / JNode',
        default: 'true',
        description: '图标开关、自定义图标、操作区与结果详情；图标是装饰性内容。',
      },
      {
        name: 'announce / ariaLabel / className / style',
        type: 'boolean / string / string / string',
        default: 'false / 无标题时 操作结果',
        description:
          '显式开启礼貌播报；默认命名 section，不抢焦点。自定义无标题页面可使用 ariaLabel。',
      },
    ],
    notes: [
      '不提供自动重试、路由跳转或表单错误汇总；操作插槽由业务明确控制。',
      '初轮不引入复杂插画、设计规范或动效依赖；小视口按内容自然换行。',
    ],
  },
  {
    id: 'progress',
    name: 'Progress',
    title: '进度条',
    category: '反馈',
    status: 'ready',
    description: '展示确定进度，支持线形、圆形、常用状态与自定义说明。',
    demos: [
      {
        id: 'progress-basic',
        title: '进度与状态',
        description: '数值限制在 0–100；未显式指定状态时，100 自动使用成功色。',
        render: ProgressExample,
        source: progressSource,
      },
    ],
    api: [
      {
        name: 'percent / type / status',
        type: "number / 'line' | 'circle' / 'normal' | 'active' | 'success' | 'exception'",
        default: '0 / line / 自动',
        description:
          '非有限值为 0，数值截到 0–100 并保留两位精度；显式状态优先。active 提供线形动效。',
      },
      {
        name: 'size / width / strokeWidth',
        type: "'sm' | 'md' | 'lg' / number / number",
        default: 'md / 圆形 120 / 8',
        description:
          '预设尺寸；width 只用于圆形，限制 48–512px 且不超过父容器；线宽限制 1–20，线形为 px，圆形为 viewBox 单位。',
      },
      {
        name: 'strokeColor / trailColor / showInfo',
        type: 'string / string / boolean',
        default: '状态色 / #f0f0f0 / true',
        description: 'CSS 颜色和视觉说明开关。',
      },
      {
        name: 'format / slot:info',
        type: '(percent, status) => string / (info: ProgressInfo) => JNode',
        description:
          '格式函数应为仅依赖参数的纯函数；info 插槽优先，用归一化值和解析后的状态渲染。',
      },
      {
        name: 'ariaLabel / valueText / className / style',
        type: 'string',
        default: '进度 / format 或 百分比及完成/失败说明',
        description:
          'progressbar 名称、可访问数值说明及样式；默认完成/失败增加非颜色符号和语义说明，定制 info 插槽时可另外提供 valueText。',
      },
    ],
    notes: [
      '不模拟任务进度或自动计时；未知进度请使用 Spin。',
      '首轮不支持仪表盘、分段成功率、渐变或复杂 SVG 特效。几何和过渡尊重 reduced-motion。',
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    imports: ['Skeleton', 'SkeletonBlock'],
    title: '骨架屏',
    category: '反馈',
    status: 'ready',
    description: '加载前展示文字、头像和块级占位，完成后显示实际内容。',
    demos: [
      {
        id: 'skeleton-basic',
        title: '组合占位与内容保留',
        description: '首次加载不挂载正文，首次完成后会保留输入，后续加载只隐藏正文。',
        render: SkeletonExample,
        source: skeletonSource,
      },
    ],
    api: [
      {
        name: 'loading / active / loadingText',
        type: 'boolean / boolean / string',
        default: 'true / false / 加载中',
        description: '加载状态、脉冲动画、status 名称；动画尊重 reduced-motion。',
      },
      {
        name: 'avatar / avatarSize / avatarShape',
        type: "boolean / number / 'circle' | 'square'",
        default: 'false / 40 / circle',
        description: '可选头像占位，非法尺寸回退 40px。',
      },
      {
        name: 'title / titleWidth / rows / widths',
        type: 'boolean / number | string / number / (number | string)[]',
        default: 'true / 38% / 3 / 最后一行 60%',
        description: '标题与段落；rows 限制为 0–20，数值宽度为像素，字符串可用百分比。',
      },
      {
        name: 'children / className / style',
        type: 'JNode / string / string',
        description: '实际内容和根样式入口；初次完成后使用 hidden 保留挂载。',
      },
      {
        name: 'SkeletonBlock.width / height / shape / active',
        type: "number | string / number | string / 'rect' | 'round' | 'circle' / boolean",
        default: '100% / 16 / rect / false',
        description: '独立块占位；数值尺寸用像素，圆形建议提供相同宽高。',
      },
      {
        name: 'SkeletonBlock.ariaLabel / className / style',
        type: 'string',
        description: '块默认装饰性隐藏；显式命名时独立成为 status。',
      },
    ],
    notes: [
      '正文状态不由骨架读取或克隆，内容始终由业务插槽提供。',
      '首轮不提供专门的 Button/Input/Image 静态子组件和复杂列表生成器，可用 SkeletonBlock 组合。',
    ],
  },
  {
    id: 'spin',
    name: 'Spin',
    title: '加载中',
    category: '反馈',
    status: 'ready',
    description: '独立加载指示或内容区域遮罩，支持延迟显示和无障碍状态。',
    demos: [
      {
        id: 'spin-basic',
        title: '尺寸、延迟与内容遮罩',
        description: '指示器延迟显示，内容从请求开始就不可操作；停止后保留输入。',
        render: SpinExample,
        source: spinSource,
      },
    ],
    api: [
      {
        name: 'spinning / delay',
        type: 'boolean / number',
        default: 'true / 0',
        description:
          '是否加载 / 显示延迟（毫秒）；短请求、关闭及卸载会取消待执行任务。修改延迟会重排未显示的任务，不隐藏已显示的指示器。',
      },
      {
        name: 'size / tip / slot:tip / ariaLabel',
        type: "'sm' | 'md' | 'lg' / string / JNode / string",
        default: 'md / — / — / tip 或 加载中',
        description: '三尺寸与说明，定制说明时可显式指定 status 的名称。',
      },
      {
        name: 'slot:indicator / children',
        type: 'JNode',
        description: '自定义图标 / 被加载区域；有正文时按块级容器覆盖，正文始终保留挂载。',
      },
      {
        name: 'className / style',
        type: 'string',
        description: '根容器样式入口；原四个点移动到 .ja-spin-dots 内。',
      },
    ],
    notes: [
      '加载开始即设置 aria-busy 和正文 inert，含延迟期间；停止后解除，不主动抓取或恢复焦点。操作入口应放在外部。',
      '不取消业务请求；不支持全屏加载服务或请求进度模拟。动画尊重 reduced-motion。',
    ],
  },
  {
    id: 'alert',
    name: 'Alert',
    title: '警告提示',
    category: '反馈',
    status: 'ready',
    description: '在页面内展示需要关注的信息，可附带说明和明确操作。',
    demos: [
      {
        id: 'alert-basic',
        title: '状态、关闭与操作',
        description: '错误使用 alert 语义，普通通知用 status；静态信息可关闭播报。',
        render: AlertExample,
        source: alertSource,
      },
    ],
    api: [
      {
        name: 'title / slot:title / description / slot:description',
        type: 'string / JNode',
        description: '标题必填（文字或插槽），说明可选；插槽优先。',
      },
      {
        name: 'type / showIcon / slot:icon',
        type: "'info' | 'success' | 'warning' | 'error' / boolean / JNode",
        default: 'info / true / 状态图标',
        description: '四种状态和图标；showIcon=false 也隐藏自定义图标。',
      },
      {
        name: 'closable / closeLabel / slot:action',
        type: 'boolean / string / JNode',
        default: 'false / 关闭提示',
        description: '原生关闭按钮、按钮名称和独立操作区。',
      },
      {
        name: 'visible / defaultVisible / on:visibleChange',
        type: 'boolean / boolean / (visible: boolean) => void',
        default: 'true',
        description: '受控 / 默认可见 / 用户关闭请求，初始化后不切换模式。',
      },
      {
        name: 'on:close',
        type: '(event: MouseEvent) => void',
        description: '关闭前调用，可 preventDefault；关闭按钮停止冒泡，非受控关闭幂等。',
      },
      {
        name: 'role / banner / className / style',
        type: "'alert' | 'status' | 'none' / boolean / string / string",
        default: 'error 为 alert，其余 status / false',
        description: 'none 关闭 live region 语义；banner 去掉圆角和外框；样式作用于根。',
      },
    ],
    notes: [
      '关闭立即卸载，没有离场动画、跑马灯或框架级 ErrorBoundary。',
      '不自动执行重试或导航，操作插槽由业务明确处理。',
    ],
  },
];
