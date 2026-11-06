import type { ComponentDoc, ApiRow } from './types';

import { DividerExample } from '../demos/divider';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import dividerSource from '../demos/divider.tsx?raw';
import { IconExample } from '../demos/icon';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import iconSource from '../demos/icon.tsx?raw';
import { SpaceExample } from '../demos/space';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import spaceSource from '../demos/space.tsx?raw';
import { TypographyExample } from '../demos/typography';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import typographySource from '../demos/typography.tsx?raw';

const common: ApiRow[] = [
  { name: 'className / style', type: 'string', description: '附加 class 与内联 CSS。' },
  { name: 'children', type: 'JNode', description: '默认内容插槽。' },
];
export const primitiveDocs: ComponentDoc[] = [
  {
    id: 'space',
    name: 'Space / Flex',
    imports: ['Space', 'Flex'],
    title: '间距与弹性布局',
    category: '布局',
    status: 'ready',
    description: '使用 CSS gap 排列内容。Space 适合一组操作，Flex 适合占满容器的弹性布局。',
    demos: [
      {
        id: 'space-basic',
        title: '排列、间距与对齐',
        description: '点击切换横纵方向；Flex 可以分散对齐。二元间距数组遵循 [rowGap, columnGap]。',
        render: SpaceExample,
        source: spaceSource,
      },
    ],
    api: [
      {
        name: 'Space.size / Flex.gap',
        type: "'sm' | 'md' | 'lg' | number | [SpacingSize, SpacingSize]",
        default: 'Space: sm / Flex: 0',
        description: 'sm=8、md=16、lg=24，数值为像素。',
      },
      {
        name: 'Space.direction',
        type: "'horizontal' | 'vertical'",
        default: "'horizontal'",
        description: '排列方向。',
      },
      {
        name: 'Flex.direction',
        type: "'row' | 'column' | 'row-reverse' | 'column-reverse'",
        default: "'row'",
        description: 'CSS flex-direction。',
      },
      {
        name: 'align',
        type: "'start' | 'end' | 'center' | 'baseline' | 'stretch'",
        default: 'Space: center / Flex: stretch',
        description: '交叉轴对齐。',
      },
      {
        name: 'Flex.justify',
        type: "'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'",
        default: "'start'",
        description: '主轴对齐。',
      },
      {
        name: 'wrap / Space.block',
        type: 'boolean',
        default: 'false',
        description: '换行；Space 是否占满容器。Flex 默认块级。',
      },
      ...common,
    ],
    notes: [
      '不包装、枚举或克隆插槽子组件，间距直接作用于实际 DOM 子项。',
      '暂不提供自动 separator；需要分隔内容时显式组合 Divider。',
    ],
  },
  {
    id: 'divider',
    name: 'Divider',
    title: '分割线',
    category: '布局',
    status: 'ready',
    description: '分隔内容区域，或在一行操作之间建立视觉间隔。',
    demos: [
      {
        id: 'divider-basic',
        title: '横向、文字与竖向分隔',
        description: '文字使用默认插槽，竖向分割线不展示文字。',
        render: DividerExample,
        source: dividerSource,
      },
    ],
    api: [
      {
        name: 'type',
        type: "'horizontal' | 'vertical'",
        default: "'horizontal'",
        description: '分割方向，同时提供 separator 语义。',
      },
      {
        name: 'orientation',
        type: "'left' | 'center' | 'right'",
        default: "'center'",
        description: '文字位置。',
      },
      {
        name: 'dashed / plain',
        type: 'boolean',
        default: 'false',
        description: '虚线 / 普通字重。',
      },
      ...common,
    ],
    notes: ['竖向分割线高度为 .9em，随文字字号缩放。'],
  },
  {
    id: 'typography',
    name: 'Typography',
    imports: ['Title', 'Text', 'Paragraph', 'Link'],
    title: '排版',
    category: '通用',
    status: 'ready',
    description: '使用语义化标题、段落、文本和链接展示业务信息。',
    demos: [
      {
        id: 'typography-basic',
        title: '标题、文本与链接',
        description: '通过具名导出组合使用；不是 Typography.Title 风格的 React 复合 API。',
        render: TypographyExample,
        source: typographySource,
      },
    ],
    api: [
      {
        name: 'Title.level',
        type: '1 | 2 | 3 | 4 | 5',
        default: '1',
        description: '真实 h1–h5，动态切换会重建对应标题节点。',
      },
      {
        name: 'tone',
        type: "'default' | 'secondary' | 'success' | 'warning' | 'danger'",
        default: "'default'",
        description: '语义颜色。',
      },
      {
        name: 'strong / italic / underline / deleted / code / mark',
        type: 'boolean',
        default: 'false',
        description: '常用文本样式，可组合。',
      },
      {
        name: 'ellipsis',
        type: 'boolean',
        default: 'false',
        description: '单行 CSS 省略，需要可约束的宽度。',
      },
      {
        name: 'Link.href / target / rel',
        type: 'string',
        description: '原生链接。target=_blank 默认补充 noopener noreferrer。',
      },
      {
        name: 'Link.disabled / ariaLabel',
        type: 'boolean / string',
        description: '禁用时移除 href 并退出 Tab 顺序；可指定可访问名称。',
      },
      ...common,
    ],
    notes: [
      '暂不实现富文本编辑、复制控制器或 JavaScript 精确多行截断。',
      '修饰标志提供视觉样式；需要额外语义时可在 children 中使用原生 strong、del、code 等标签。',
    ],
  },
  {
    id: 'icon',
    name: 'Icon',
    title: '图标',
    category: '通用',
    status: 'ready',
    description: '使用 Iconify 的 Ant Design 图标集，搭配 Tailwind 插件将业务用到的图标按需打包。',
    demos: [
      {
        id: 'icon-basic',
        title: '常用图标',
        description: '以下 48 个常用图标均通过静态 Tailwind 类名展示，可展开源码复制使用。',
        render: IconExample,
        source: iconSource,
      },
    ],
    api: [],
    notes: [],
  },
];
