import type { ComponentDoc } from './types';

import { BreadcrumbExample } from '../demos/breadcrumb';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import breadcrumbSource from '../demos/breadcrumb.tsx?raw';
import { DropdownExample } from '../demos/dropdown';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import dropdownSource from '../demos/dropdown.tsx?raw';
import { MenuExample } from '../demos/menu';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import menuSource from '../demos/menu.tsx?raw';
export const navigationDocs: ComponentDoc[] = [
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    title: '面包屑',
    category: '导航',
    status: 'ready',
    description: '路径导航、真实祖先链接、当前页面和可定制分隔符。',
    demos: [
      {
        id: 'breadcrumb-basic',
        title: '工作空间路径',
        description: '末项始终标记当前页，祖先可通过链接或回调接入业务路由。',
        render: BreadcrumbExample,
        source: breadcrumbSource,
      },
    ],
    api: [
      {
        name: 'items',
        type: 'BreadcrumbItem[]',
        description:
          '唯一 key、文本 label、href/target/rel/disabled，及初始化固定的 slot:label/slot:icon。最后一项为当前页，显示文本而不导航。',
      },
      {
        name: 'separator / slot:separator / item.separator',
        type: 'string / JNode / string',
        default: '/',
        description:
          '全局插槽优先，其次逐项分隔符、全局文本；分隔符有 aria-hidden，不作为路径项播报。装饰插槽中不要放交互控件。',
      },
      {
        name: 'on:click',
        type: '(item, MouseEvent) => void',
        description:
          '祖先真实链接点击事件，默认保留浏览器行为，可 preventDefault 交给业务路由；禁用/危险协议和当前页不触发导航。',
      },
      {
        name: 'ariaLabel / className / style',
        type: 'string',
        default: '面包屑',
        description: 'nav 名称和外框样式；内部 ol/li 按唯一路径 key 保持身份，窄屏允许换行。',
      },
    ],
    notes: [
      '当前页面唯一 aria-current=page，祖先链接支持键盘及浏览器原生修饰键/新标签。_blank 补齐安全 rel，disabled 和不支持的协议显示为不可导航文本。',
      '不自动推断 jinge-router、参数或异步路由数据，不内置折叠省略和下拉路径；可在业务中构造 items 并接入 click。',
    ],
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    title: '下拉菜单',
    category: '导航',
    status: 'ready',
    description: '操作菜单，支持键盘打开、焦点返回、受控显隐及选择保留。',
    demos: [
      {
        id: 'dropdown-basic',
        title: '操作与视图',
        description: '普通动作选中后关闭；视图菜单可保持展开，重复操作仍可通知。',
        render: DropdownExample,
        source: dropdownSource,
      },
    ],
    api: [
      {
        name: 'options / on:change / selectable / value / defaultValue',
        type: 'MenuOption<T>[] / (value, event) => void / boolean / T | null / T',
        description:
          '默认动作模式；显式 value/defaultValue 或 selectable 可标记当前项。默认值在弹层多次打开间保留。菜单选中和回调遵循受控写回。',
      },
      {
        name: 'open / defaultOpen / on:openChange / closeOnSelect',
        type: 'boolean / boolean / (open, event?) => void / boolean',
        default: 'false / true(closeOnSelect)',
        description:
          '初始化显隐模式固定；关闭可受控，closeOnSelect=false 用于保持菜单，不等待业务 Promise。',
      },
      {
        name: 'triggerMethod / placement / disabled / ariaLabel',
        type: 'FloatingTrigger / FloatingPlacement / boolean / string',
        default: 'click / bottom-start / false / 操作菜单',
        description:
          '复用 Floating；键盘 ArrowDown/Up、Enter/Space 可打开，Escape/Tab 关闭并处理焦点。',
      },
      {
        name: 'loading / loadingText / emptyText / slot:content / children',
        type: 'boolean / string / JNode',
        description:
          '加载和空内容有状态说明。默认插槽必须是稳定的可聚焦 HTML 根；content 可替换默认菜单，复杂交互正文建议用 Popover。',
      },
      {
        name: 'className / style',
        type: 'string',
        description: '作用于弹出的浮层；触发按钮的样式直接传给 children。',
      },
    ],
    notes: [
      '默认操作菜单保持真实 menu/menuitem 语义；ArrowUp 打开末项，Tab 以触发器为起点自然离开 body Portal，Escape 返回触发器。外部点击保留外部目标焦点；hover/focus 展示菜单时不抢走现有焦点，方向键可进入菜单。',
      'disabled 阻止触发动作并管理 aria-disabled；如需从 Tab 顺序跳过，请同时给触发 Button 设置 disabled，不克隆插槽元素。',
      '复用 Floating 的嵌套、定位、清理及模态层上下文；关闭立即卸载。右键坐标菜单、自动拆分按钮和复杂级联弹出菜单不在首轮范围。',
      '稳定的 content 插槽由调用方负责其菜单语义与交互；首轮不支持运行中替换插槽函数（F09），动作业务的加载/错误和异步结果由业务管理。',
    ],
  },
  {
    id: 'menu',
    name: 'Menu',
    title: '导航菜单',
    category: '导航',
    status: 'ready',
    description: '垂直展开和水平菜单，支持原生链接、选择、分组及键盘焦点。',
    demos: [
      {
        id: 'menu-basic',
        title: '后台导航',
        description: '水平子菜单使用 Floating；侧栏展开可受控，方向键跳过禁用项。',
        render: MenuExample,
        source: menuSource,
      },
    ],
    api: [
      {
        name: 'options',
        type: 'MenuOption<T>[]，T 为 string | number',
        description:
          '全树 value 唯一；label 或静态 slot:label、slot:icon，type=item/group/divider；支持 children/disabled/danger/href/target/rel/ariaLabel。分组/分隔线也须提供 value。',
      },
      {
        name: 'value / defaultValue / on:change',
        type: 'T | null / T / (value, event) => void',
        description:
          '初始化 value 非 undefined 为受控，null 表示受控无选择；父级写回请求，拒绝时保持原值。默认值只初始化。',
      },
      {
        name: 'openKeys / defaultOpenKeys / on:openChange / accordion',
        type: 'T[] / T[] / (keys, event?) => void / boolean',
        description:
          '展开模式初始化固定，按父子关系清理关闭项；手风琴关闭同级及其后代，移除选项会归一化展开。',
      },
      {
        name: 'mode / selectable / disabled / ariaLabel / emptyText',
        type: 'vertical | horizontal / boolean / boolean / string',
        default: 'vertical / true / false',
        description:
          '垂直子菜单原地展开，水平子菜单 Portal 显示；点击或键盘展开。disabled 作用于整棵树，父级禁用传到后代。',
      },
      {
        name: 'ref.focus / on:dismiss / className / style',
        type: '(first | last?) => void / KeyboardEvent / string',
        description: '公开方法聚焦当前或边界项。Tab/根 Escape 可交给容器处理；样式作用于外框。',
      },
    ],
    notes: [
      '方向键、Home/End、Enter/Space、文字前缀查找使用单一 roving tab stop；Escape/Left 关闭当前子菜单并恢复父项。水平叶子激活后关闭子菜单。',
      'href 渲染真实 a，支持原生新标签和修饰键；禁用项不执行动作，危险协议被禁用，_blank 自动补 noopener/noreferrer。路由由业务监听 change 并选择 preventDefault 接入，不自动解析 jinge-router。',
      'Menu 的受控选中不再采用旧版的先本地修改、再等待外部值的混合行为。逐项插槽在初始化固定，F09 的运行中新增/替换仍暂缓；label/children/禁用数据可更新。',
      'mode 初始化后固定；首轮不做自动折叠溢出导航、收起侧栏图标模式、任意拖动或超大树虚拟化。',
    ],
  },
];
