import type { ComponentDoc } from './types';

import { ButtonBasic } from '../demos/button-basic';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import basicSource from '../demos/button-basic.tsx?raw';
import { ButtonGroups } from '../demos/button-group';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import groupSource from '../demos/button-group.tsx?raw';
import { ButtonLoading } from '../demos/button-loading';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import loadingSource from '../demos/button-loading.tsx?raw';
import { ButtonSizes } from '../demos/button-sizes';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import sizesSource from '../demos/button-sizes.tsx?raw';

export const buttonDoc: ComponentDoc = {
  id: 'button',
  name: 'Button',
  title: '按钮',
  category: '通用',
  status: 'ready',
  description: '触发一个操作。区分主要与次要操作，并通过加载和禁用状态防止重复提交。',
  demos: [
    {
      id: 'button-basic',
      title: '按钮类型',
      description: '主要、默认、文字、链接样式及危险操作。链接样式仍使用原生 button 语义。',
      render: ButtonBasic,
      source: basicSource,
    },
    {
      id: 'button-sizes',
      title: '尺寸与形状',
      description: '统一 sm / md / lg；纯图标按钮需要 ariaLabel。',
      render: ButtonSizes,
      source: sizesSource,
    },
    {
      id: 'button-loading',
      title: '加载与禁用',
      description: '点击保存触发模拟异步操作。loading=false 不会覆盖 disabled。',
      render: ButtonLoading,
      source: loadingSource,
    },
    {
      id: 'button-group',
      title: '按钮组',
      description: '通过 context 提供响应式尺寸和禁用状态，不克隆子组件。',
      render: ButtonGroups,
      source: groupSource,
    },
  ],
  api: [
    {
      name: 'type',
      type: "'default' | 'primary' | 'text' | 'link'",
      default: "'default'",
      description: '视觉类型；link 仍是按钮。',
    },
    {
      name: 'htmlType',
      type: "'button' | 'submit' | 'reset'",
      default: "'button'",
      description: '原生 type，普通按钮不会意外提交表单。',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '组件尺寸；未指定时继承 ButtonGroup。',
    },
    {
      name: 'shape',
      type: "'default' | 'circle' | 'round'",
      default: "'default'",
      description: '默认、圆形、胶囊形。',
    },
    {
      name: 'danger / ghost / block',
      type: 'boolean',
      default: 'false',
      description: '危险色、透明底、块级宽度。',
    },
    {
      name: 'disabled / loading',
      type: 'boolean',
      default: 'false',
      description: '两者任一个为 true 都禁止点击，加载时显示 spinner。',
    },
    { name: 'slot:icon / children', type: 'JNode', description: '前置图标与默认内容插槽。' },
    {
      name: 'on:click',
      type: '(event: JMouseEvent<HTMLButtonElement>) => void',
      description: '可用状态下的原生点击事件。',
    },
    { name: 'ariaLabel / ariaDescribedby', type: 'string', description: '无障碍名称与描述关联。' },
    {
      name: 'id / name / value / title / tabIndex',
      type: '原生属性',
      description: '原生按钮和表单相关属性。',
    },
    { name: 'className / style', type: 'string', description: '附加 class 与内联 CSS。' },
    {
      name: 'ref',
      type: 'Ref<{ focus(): void; blur(): void }>',
      description: '暴露聚焦与失焦方法。',
    },
    {
      name: 'ButtonGroup.size / disabled',
      type: 'ButtonSize / boolean',
      description: '组内响应式默认值；子项 size 可覆盖组尺寸，禁用组不可被子项取消。',
    },
    {
      name: 'ButtonGroup.direction / ariaLabel',
      type: "'horizontal' | 'vertical' / string",
      default: "'horizontal'",
      description: '排列方向与组的无障碍名称。',
    },
  ],
  notes: [
    'ButtonGroup 的旧 size="small" / "large" 改为 sm / lg。中尺寸现在可显式传 md。',
    '按钮默认 htmlType="button"；提交或重置表单需显式指定 htmlType。',
    '不提供波纹、渐变算法或模拟链接跳转。真正的导航链接应使用 a 或后续的 Link 组件。',
  ],
};
