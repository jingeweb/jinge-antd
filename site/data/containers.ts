import type { ComponentDoc } from './types';

import { CardExample } from '../demos/card';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import cardSource from '../demos/card.tsx?raw';
import { CollapseExample } from '../demos/collapse';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import collapseSource from '../demos/collapse.tsx?raw';
import { DescriptionsExample } from '../demos/descriptions';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import descriptionsSource from '../demos/descriptions.tsx?raw';
import { EmptyExample } from '../demos/empty';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import emptySource from '../demos/empty.tsx?raw';

export const containerDocs: ComponentDoc[] = [
  {
    id: 'empty',
    name: 'Empty',
    title: '空状态',
    category: '数据展示',
    status: 'ready',
    description: '用简洁说明和可选操作解释当前无数据的原因，支持自定义插图。',
    demos: [
      {
        id: 'empty-basic',
        title: '说明与操作',
        description: '从空列表创建记录；示例同时展示自定义内容和纯文字空态。',
        render: EmptyExample,
        source: emptySource,
      },
    ],
    api: [
      {
        name: 'description / slot:description',
        type: 'string | false / JNode',
        default: '暂无数据',
        description: '说明插槽优先，false 隐藏整块说明，包括插槽。',
      },
      {
        name: 'image / slot:image',
        type: 'string | false / JNode',
        default: '内置装饰插图',
        description:
          '图片 URL 或插槽；false 隐藏全部插图。URL 加载失败回退到内置 SVG，换源后重试。',
      },
      {
        name: 'children',
        type: 'JNode',
        description: '操作区，通常放新建、重试或清除筛选的按钮。',
      },
      {
        name: 'size / announce',
        type: "'sm' | 'md' / boolean",
        default: 'md / false',
        description:
          '插图和留白尺寸；announce=true 使用 status 语义进行礼貌播报，静态空态默认不主动播报。',
      },
      {
        name: 'on:error',
        type: '(event: Event) => void',
        description: '原生图片失败事件，不影响说明和操作区。',
      },
      { name: 'className / style', type: 'string', description: '根容器样式入口。' },
    ],
    notes: [
      '插图区域按装饰内容隐藏于读屏；有意义的信息放在说明，交互元素放在操作区。',
      '不提供设计规范、外部插画依赖或自动识别列表状态；加载、错误和空态由业务区分。',
    ],
  },
  {
    id: 'descriptions',
    name: 'Descriptions',
    title: '描述列表',
    category: '数据展示',
    status: 'ready',
    description: '以语义化的定义列表展示只读详情，支持响应式列数、字段跨度和自定义内容。',
    demos: [
      {
        id: 'descriptions-basic',
        title: '响应式详情',
        description: '窄屏一列、桌面三列；数字 0 正常显示，缺失值使用占位，字段可包含标签或链接。',
        render: DescriptionsExample,
        source: descriptionsSource,
      },
    ],
    api: [
      {
        name: 'items',
        type: 'DescriptionItem[]',
        description:
          '每项 key 唯一且稳定；label/slot:label 必填，content/slot:content、span 可选。使用 dl、dt、dd 表达字段和值。',
      },
      {
        name: 'title / slot:title / slot:extra / ariaLabel',
        type: 'string / JNode / JNode / string',
        description: '标题插槽优先，extra 是标题旁操作；无标题时可命名容器。',
      },
      {
        name: 'column',
        type: 'number | Partial<Record<DescriptionsBreakpoint, number>>',
        default: '{ xs: 1, sm: 2, lg: 3 }',
        description:
          '固定或六档响应式列数；范围 1–6，遗漏断点继承前档，初始为 1。使用与 Grid 相同的视口断点。',
      },
      {
        name: 'items[].span',
        type: "number | 'filled'",
        default: '1',
        description:
          '数值跨逻辑列，超过总列数时限制为整行；filled 始终整行。剩余空间不足则换行，不自动补齐上一行。',
      },
      {
        name: 'layout / bordered / colon / size',
        type: "'horizontal' | 'vertical' / boolean / boolean / 'sm' | 'md' | 'lg'",
        default: 'horizontal / false / true / md',
        description: '字段内标签和值的方向、边框、水平冒号与间距。',
      },
      {
        name: 'emptyText',
        type: 'string',
        default: '—',
        description: '仅替代 null/undefined，数字 0 和明确的空字符串不会丢失。内容插槽优先。',
      },
      { name: 'className / style', type: 'string', description: '根容器样式入口。' },
    ],
    notes: [
      '响应式按视口宽度变化，不自动测量外层容器，也不做精确表格列对齐。',
      '展示字段不提供输入绑定；编辑流程应组合 Form/Input。',
      '首轮不提供复杂行合并或自动推算填充跨度，避免改变字段列表的身份与插槽状态。',
    ],
  },
  {
    id: 'collapse',
    name: 'Collapse',
    title: '折叠面板',
    category: '数据展示',
    status: 'ready',
    description: '按需展开内容，支持多面板、手风琴、受控状态和键盘导航。',
    demos: [
      {
        id: 'collapse-basic',
        title: '受控与手风琴',
        description: '默认首次展开才挂载，折叠后保留输入；附加操作放在独立区域，不会触发展开。',
        render: CollapseExample,
        source: collapseSource,
      },
    ],
    api: [
      {
        name: 'items',
        type: 'CollapseItem[]',
        description:
          '每项 key 为唯一且稳定的字符串；label 或 slot:label 必填，content/slot:content、slot:extra、disabled 可选。',
      },
      {
        name: 'activeKeys / defaultActiveKeys / on:change',
        type: 'string[] / string[] / (keys: string[]) => void',
        default: '[]',
        description:
          '受控 / 默认展开 / 用户请求。忽略重复与不存在的 key；受控数组原地修改同样更新。初始化后不切换控制模式。',
      },
      {
        name: 'accordion',
        type: 'boolean',
        default: 'false',
        description: '最多展开一项。多个有效 key 时使用首项，不自动展开其他面板。',
      },
      {
        name: 'disabled / items[].disabled',
        type: 'boolean',
        default: 'false',
        description: '禁止触发器操作，不强制关闭已展开内容。附加操作由业务自己控制。',
      },
      {
        name: 'destroyOnHidden',
        type: 'boolean',
        default: 'false',
        description: '首次展开前不挂载正文；之后默认通过 hidden 保留，true 时折叠即销毁。',
      },
      {
        name: 'size / bordered / ghost',
        type: "'sm' | 'md' | 'lg' / boolean / boolean",
        default: 'md / true / false',
        description: '间距、外框与透明背景。',
      },
      { name: 'className / style', type: 'string', description: '根容器样式入口。' },
    ],
    notes: [
      'Enter/Space 切换；上下方向键、Home/End 在同级可用触发器间导航。ARIA 的 expanded、controls、region 标题自动关联。',
      'label 插槽不要放按钮或链接；交互操作应放在 slot:extra 或内容中。',
      '没有展开/折叠动画，不枚举或反向解析 children；项目按 items 的 key 保持身份。',
    ],
  },
  {
    id: 'card',
    name: 'Card',
    title: '卡片',
    category: '数据展示',
    status: 'ready',
    description: '信息分组容器，支持标题、封面、操作和加载占位。',
    demos: [
      {
        id: 'card-basic',
        title: '内容与加载',
        description: '加载期间隐藏正文并保留内部输入状态；标题和操作区仍可使用。',
        render: CardExample,
        source: cardSource,
      },
    ],
    api: [
      {
        name: 'title / slot:title / ariaLabel',
        type: 'string / JNode / string',
        description: '标题插槽优先；文字标题用 h3。无标题时可用 ariaLabel 命名 section。',
      },
      {
        name: 'children / slot:extra / slot:cover / slot:actions',
        type: 'JNode',
        description: '正文 / 标题旁操作 / 封面 / 底部操作；不枚举、克隆或注入子组件。',
      },
      {
        name: 'loading / loadingText',
        type: 'boolean / string',
        default: 'false / 加载中',
        description:
          '正文保留挂载但通过 hidden 禁止显示和聚焦，同时显示有状态语义的占位。额外操作、封面和底部操作不禁用。',
      },
      {
        name: 'size / bordered / hoverable',
        type: "'sm' | 'md' / boolean / boolean",
        default: 'md / true / false',
        description: '紧凑间距、边框和悬浮阴影；hoverable 不会把整个卡片变成按钮。',
      },
      {
        name: 'className / style',
        type: 'string',
        description: '根容器样式入口，宽度由外部布局控制。',
      },
    ],
    notes: [
      '加载时正文仍会初始化，业务需要确保数据为空时也能安全渲染。',
      '首轮不提供 Card.Grid、内置 Tabs、拖拽、子项克隆或完整 Skeleton 配置；可组合现有布局组件。',
    ],
  },
];
