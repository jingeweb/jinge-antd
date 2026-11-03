import type { ComponentDoc } from './types';

import { AvatarExample } from '../demos/avatar';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import avatarSource from '../demos/avatar.tsx?raw';
import { BadgeExample } from '../demos/badge';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import badgeSource from '../demos/badge.tsx?raw';
import { TagExample } from '../demos/tag';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import tagSource from '../demos/tag.tsx?raw';

export const displayDocs: ComponentDoc[] = [
  {
    id: 'tag',
    name: 'Tag',
    title: '标签',
    category: '数据展示',
    status: 'ready',
    description: '标识状态或分类，支持图标、无边框和键盘可操作的关闭按钮。',
    demos: [
      {
        id: 'tag-basic',
        title: '状态与移除',
        description: '受控关闭可恢复；on:close 中 preventDefault 可以保留固定标签。',
        render: TagExample,
        source: tagSource,
      },
    ],
    api: [
      {
        name: 'color / bordered',
        type: "'default' | 'success' | 'processing' | 'error' | 'warning' / boolean",
        default: 'default / true',
        description: '语义色和边框；自定义颜色用 style，不内置颜色算法。',
      },
      { name: 'children / slot:icon', type: 'JNode', description: '内容 / 可选图标。' },
      {
        name: 'closable / disabled / closeLabel',
        type: 'boolean / boolean / string',
        default: 'false / false / 移除标签',
        description: '关闭按钮 / 禁止关闭 / 按钮可访问名称。',
      },
      {
        name: 'visible / defaultVisible',
        type: 'boolean',
        default: 'true',
        description: '受控 / 默认可见；初始化后不切换模式。',
      },
      {
        name: 'on:close / on:visibleChange',
        type: '(event: MouseEvent) => void / (visible: boolean) => void',
        description:
          '关闭前事件，可 preventDefault；请求隐藏事件，受控方需写回 visible。关闭按钮不冒泡到外层点击处理。',
      },
      { name: 'className / style', type: 'string', description: '根 span 样式入口。' },
    ],
    notes: [
      '关闭立即卸载内容；没有离场动画。',
      '首轮不含 CheckableTag、标签组、拖拽和自动颜色算法。',
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    title: '徽标',
    category: '数据展示',
    status: 'ready',
    description: '展示未读数量、圆点或状态，可独立使用或附着在子内容角落。',
    demos: [
      {
        id: 'badge-basic',
        title: '数量和状态',
        description: '数字溢出显示上限，圆点不展示数量；状态有独立语义和文字说明。',
        render: BadgeExample,
        source: badgeSource,
      },
    ],
    api: [
      {
        name: 'count / overflowCount / showZero',
        type: 'number | string / number / boolean',
        default: '0 / 99 / false',
        description:
          '非负整数计数，超限显示上限+；负数/非有限数按 0，字符串原样展示。默认隐藏数字 0。',
      },
      {
        name: 'dot / status / text',
        type: "boolean / 'default' | 'success' | 'processing' | 'error' | 'warning' / string",
        description: '圆点或状态优先于计数；text 是相邻说明。',
      },
      {
        name: 'children',
        type: 'JNode',
        description: '有子内容时定位到右上角，不克隆或改写子组件；无子内容时作为行内标记。',
      },
      {
        name: 'size / offset / color',
        type: "'sm' | 'md' / [number, number] / string",
        default: 'md / [0, 0] / 状态色',
        description: '数字高度 16/20px；角标偏移为向右/向下；可用 CSS 颜色覆盖。',
      },
      {
        name: 'title / ariaLabel',
        type: 'string',
        description: '鼠标提示 / 可访问名称，数字名称使用完整计数而非上限+。',
      },
      { name: 'className / style', type: 'string', description: '外层样式入口。' },
    ],
    notes: [
      '不支持 Ribbon、数字滚动动画、自动推断子内容的 aria 描述。',
      'count 为字符串时按标签展示，例如 NEW；不会自动转换数字字符串。',
    ],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    title: '头像',
    category: '数据展示',
    status: 'ready',
    description: '图片、文字或图标头像，支持失败回退和重试，提供可访问名称。',
    demos: [
      {
        id: 'avatar-basic',
        title: '类型与图片回退',
        description: '图片失败后显示文字；切换源后重新尝试加载。',
        render: AvatarExample,
        source: avatarSource,
      },
    ],
    api: [
      {
        name: 'src / srcSet',
        type: 'string',
        description: '原生图片源和候选源，修改后清除失败状态并重试。',
      },
      {
        name: 'alt / ariaLabel',
        type: 'string',
        default: '— / alt 或 头像',
        description: '外层 role=img 的可访问名称；内部图片为空 alt，避免重复朗读。',
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg' | number",
        default: 'md',
        description: '预设 24/32/40px 或正数像素；非法数值回退到 32px。',
      },
      {
        name: 'shape',
        type: "'circle' | 'square'",
        default: 'circle',
        description: '圆形或圆角方形。',
      },
      {
        name: 'children / slot:icon',
        type: 'JNode',
        description: '图片失败或未提供图片时回退；优先文字内容，其次图标，最后 alt 首字符或 ?。',
      },
      {
        name: 'className / style',
        type: 'string',
        description: '外层样式入口；图片 cover 裁切，长文字单行裁切。',
      },
      {
        name: 'on:load / on:error',
        type: '(event: Event) => void',
        description: '原生图片加载结果，失败回调前已请求切换回退。',
      },
    ],
    notes: [
      'size 从旧 small/large 统一为 sm/md/lg；暂不支持自动测量缩字、响应式尺寸和自动折叠头像组。',
      '建议为文字、图标或图片都提供 alt/ariaLabel，避免只读到通用名称。',
    ],
  },
];
