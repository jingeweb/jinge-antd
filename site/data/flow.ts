import type { ComponentDoc } from './types';

import { SegmentedExample } from '../demos/segmented';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import segmentedSource from '../demos/segmented.tsx?raw';
import { StepsExample, StepsCompleteExample } from '../demos/steps';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import stepsSource from '../demos/steps.tsx?raw';
export const flowDocs: ComponentDoc[] = [
  {
    id: 'segmented',
    name: 'Segmented',
    title: '分段控制',
    category: '导航',
    status: 'ready',
    description: '紧凑的互斥选项组，适合视图和筛选范围切换。',
    demos: [
      {
        id: 'segmented-basic',
        title: '报表与视图切换',
        description: '数字值、受控、禁用、铺满宽度与原生表单重置。',
        render: SegmentedExample,
        source: segmentedSource,
      },
    ],
    api: [
      {
        name: 'options',
        type: 'SegmentedOption<T>[]',
        description:
          '唯一 value（string/number）、label、disabled、id、初始化固定 slot:label；复杂图文/图标通过 label 插槽组合，并提供可访问文本。',
      },
      {
        name: 'value / defaultValue',
        type: 'T | null / T',
        description:
          '受控/初始值；未指定时选首个可用项。非受控当前项被移除或禁用后回退；受控 null 或无效值为空选择。控制模式初始化固定。',
      },
      {
        name: 'on:change',
        type: '(value: T | undefined, event: Event) => void',
        description:
          '只在用户选择新值时触发。原生 radio 的短暂勾选会在下一帧按父值校正，支持父级拒绝请求。',
      },
      {
        name: 'disabled / block / direction / size',
        type: 'boolean / boolean / horizontal | vertical / sm | md | lg',
        default: 'false / false / horizontal / md',
        description: '整组禁用、铺满父容器、横纵布局与尺寸。长列表原生滚动。',
      },
      {
        name: 'name / form / required / id',
        type: 'string / string / boolean / string',
        description:
          '真实 radio 的表单提交、外部表单关联与校验。未传 name 自动生成独立组名。非受控 reset 回到初始值；受控 reset 保留父值。',
      },
      {
        name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid / legend',
        type: 'string / string / string / boolean / string',
        description:
          '命名 radiogroup、关联说明和错误，legend 可提供可见标题。className/style 作用于 fieldset。',
      },
    ],
    notes: [
      '复用 Radio 与已有组状态逻辑。原生方向键移动并选中，跳过禁用项，Tab 进入组内选中项；与 Tabs 不同，本组件不创建关联内容面板。',
      '首轮统一使用对象选项，不接收 string[]/number[] 简写；不内置滑块动画、异步加载、拖动或圆角形状配置。复杂图标/标签可用稳定插槽。',
      '参考：https://ant.design/components/segmented/ 。',
    ],
  },
  {
    id: 'steps',
    name: 'Steps',
    title: '步骤条',
    category: '导航',
    status: 'ready',
    description: '显示任务进度，支持状态、说明、可选导航和响应式方向。',
    demos: [
      {
        id: 'steps-basic',
        title: '发布流程',
        description: '父级管理当前步骤；已禁用步骤不可跳转，错误状态可直接显示。',
        render: StepsExample,
        source: stepsSource,
      },
      {
        id: 'steps-complete',
        title: '小尺寸完成流程',
        description: 'current 等于步骤数表示全部完成，展示模式没有多余的焦点目标。',
        render: StepsCompleteExample,
        source: stepsSource,
      },
    ],
    api: [
      {
        name: 'items',
        type: 'StepItem[]',
        description:
          '唯一 key、title、description、disabled、status；固定 slot:title/description/icon 支持自定义内容，标题插槽不要嵌套交互控件。',
      },
      {
        name: 'current',
        type: 'number',
        default: '0',
        description:
          '从 0 开始的当前索引；之前为 finish，之后为 wait。-1 全未开始，items.length 全完成。组件不自动维护业务流程。',
      },
      {
        name: 'status / item.status',
        type: 'wait | process | finish | error',
        default: 'process',
        description: '全局 status 仅影响当前步骤，逐项状态优先；状态同时用图标、文字和颜色呈现。',
      },
      {
        name: 'on:change',
        type: '(index: number) => void',
        description:
          '提供回调后启用原生按钮导航，请求后由父级更新 current；当前项、禁用项不重复触发。Tab 移动、Enter/Space 激活。无回调时只展示有序列表。',
      },
      {
        name: 'direction / responsive / size / disabled',
        type: 'horizontal | vertical / boolean / sm | md / boolean',
        default: 'horizontal / true / md / false',
        description: '横纵方向，窄于 600px 默认转纵向，可关闭响应式；支持小尺寸及整体禁止跳转。',
      },
      {
        name: 'ariaLabel / className / style',
        type: 'string',
        default: '步骤',
        description: '有序列表名称和外框样式，当前项使用 aria-current=step，装饰图标不会重复播报。',
      },
    ],
    notes: [
      '步骤条不内置向导页面、校验、路由或异步推进，业务负责接受跳转请求及控制当前值。待用户可访问前可将后续项 disabled。',
      '百分比圆环、点状/导航/内联变体、折叠大量步骤与复杂自定义布局暂缓；基础横纵流程覆盖首轮中后台使用。',
      '参考：https://ant.design/components/steps/ 。',
    ],
  },
];
