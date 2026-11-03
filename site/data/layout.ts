import type { ComponentDoc } from './types';

import { GridExample } from '../demos/grid';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import gridSource from '../demos/grid.tsx?raw';
import { LayoutExample } from '../demos/layout';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import layoutSource from '../demos/layout.tsx?raw';
export const layoutDocs: ComponentDoc[] = [
  {
    id: 'grid',
    name: 'Grid',
    imports: ['Row', 'Col'],
    title: '栅格',
    category: '布局',
    status: 'ready',
    description: '基于 24 列的响应式布局，使用 CSS 媒体查询，不监听窗口尺寸。',
    demos: [
      {
        id: 'grid-basic',
        title: '响应式与间距',
        description: '缩小浏览器宽度后，两列自动改为单列。偏移同样遵循 24 列比例。',
        render: GridExample,
        source: gridSource,
      },
    ],
    api: [
      {
        name: 'Row.gutter',
        type: 'SpacingSize | [rowGap, columnGap]',
        default: '0',
        description: '数值像素或 sm/md/lg；列通过 padding 分配水平间距。',
      },
      {
        name: 'Row.align / justify / wrap',
        type: 'Flex 对齐值 / boolean',
        default: 'stretch / start / true',
        description: '交叉轴、主轴与换行。',
      },
      {
        name: 'Col.span / offset / order',
        type: 'number',
        default: '24 / 0 / —',
        description: '列宽 0–24，偏移 0–23；span=0 隐藏，order 控制视觉顺序。',
      },
      {
        name: 'Col.xs / sm / md / lg / xl / xxl',
        type: 'number | { span?: number; offset?: number }',
        description: '分别在 0 / 576 / 768 / 992 / 1200 / 1600px 起生效；未指定的维度继承先前值。',
      },
      {
        name: 'className / style / children',
        type: 'string / string / JNode',
        description: '附加样式与默认插槽。',
      },
    ],
    notes: [
      '响应式判断依据视口宽度，不是父容器宽度。',
      'Row 使用负 margin 平衡列 padding；容器有 overflow 限制时需留出相应水平内边距。',
    ],
  },
  {
    id: 'layout',
    name: 'Layout',
    imports: ['Layout', 'LayoutHeader', 'Sider', 'Content', 'LayoutFooter'],
    title: '布局容器',
    category: '布局',
    status: 'ready',
    description: '组合页头、侧栏、内容和页脚，承载 PC 中台的基础结构。',
    demos: [
      {
        id: 'layout-basic',
        title: '可折叠侧栏',
        description:
          '通过受控 collapsed 和 collapse 事件切换；侧栏内容由使用方决定折叠后如何展示。',
        render: LayoutExample,
        source: layoutSource,
      },
    ],
    api: [
      {
        name: 'Layout.hasSider',
        type: 'boolean',
        default: 'false',
        description: '显式切换为横向包含侧栏；不反射检查 children。',
      },
      {
        name: 'Sider.width / collapsedWidth',
        type: 'number | string',
        default: '200 / 80',
        description: '展开和折叠宽度，数值为像素。',
      },
      {
        name: 'Sider.collapsed / defaultCollapsed',
        type: 'boolean',
        default: 'false',
        description: '受控或非受控的折叠状态；初始化后不切换模式。',
      },
      {
        name: 'Sider.collapsible',
        type: 'boolean',
        default: 'false',
        description: '显示原生键盘可访问的折叠按钮。',
      },
      {
        name: 'Sider.on:collapse',
        type: '(collapsed: boolean) => void',
        description: '请求新的折叠状态。',
      },
      {
        name: 'Sider.ariaLabel',
        type: 'string',
        default: '侧边栏',
        description: '侧栏可访问名称。',
      },
      {
        name: 'className / style / children',
        type: 'string / string / JNode',
        description: '所有布局部件支持。',
      },
    ],
    notes: [
      'Content 使用 section，避免在文档示例或已有 main 内制造嵌套 main 地标。',
      '不自动折叠菜单文字，不自动生成导航，也不提供拖动调整宽度。',
    ],
  },
];
