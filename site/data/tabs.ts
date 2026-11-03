import type { ComponentDoc } from './types';

import { TabsExample, TabsVariantsExample } from '../demos/tabs';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import source from '../demos/tabs.tsx?raw';
export const tabsDoc: ComponentDoc = {
  id: 'tabs',
  name: 'Tabs',
  title: '标签页',
  category: '导航',
  status: 'ready',
  description: '切换同一工作区的内容，支持横纵布局、受控状态和键盘导航。',
  demos: [
    {
      id: 'tabs-basic',
      title: '项目详情',
      description: '受控切换、禁用与面板保留；输入值保存在父级 VM，销毁内容后也能恢复。',
      render: TabsExample,
      source,
    },
    {
      id: 'tabs-variants',
      title: '卡片与手动激活',
      description: '方向键只移动焦点，Enter 或 Space 才切换内容，适合加载较慢的面板。',
      render: TabsVariantsExample,
      source,
    },
  ],
  api: [
    {
      name: 'options',
      type: 'TabOption<K>[]',
      description:
        '唯一 key（string/number）、label、disabled、ariaLabel、content；固定 slot:label/icon/content 支持自定义展示。不放嵌套交互控件到标签中。',
    },
    {
      name: 'activeKey / defaultActiveKey',
      type: 'K',
      description:
        '受控/初始值。未传时选首个可用项；非受控删除或禁用当前项后回退首个可用项，结构同步不触发 change。受控无效 key 不选中任何项。控制模式初始化固定。',
    },
    {
      name: 'on:change',
      type: '(key: K) => void',
      description: '仅用户请求不同且可用标签时触发；受控模式由父级接受后更新内容。',
    },
    {
      name: 'orientation / activation',
      type: 'horizontal | vertical / automatic | manual',
      default: 'horizontal / automatic',
      description:
        '横向左右键、纵向上下键循环跳过禁用项，Home/End 到首尾；手动模式用 Enter/Space 激活。修饰键及垂直方向以外的滚动键保留浏览器行为。',
    },
    {
      name: 'destroyOnHidden',
      type: 'boolean',
      default: 'false',
      description:
        '面板首次访问才挂载，默认保留已访问的内容；true 时切走立即销毁。需要跨销毁保留的数据请放父级 VM。',
    },
    {
      name: 'disabled / type / size / centered',
      type: 'boolean / line | card / sm | md | lg / boolean',
      default: 'false / line / md / false',
      description:
        '整体禁用、线条/卡片、小中大尺寸、居中。标签溢出时原生滚动，键盘导航自动滚入视口。',
    },
    {
      name: 'ariaLabel / className / style',
      type: 'string',
      default: '标签页',
      description: 'tablist 可访问名称和外框样式；自动生成 tab/tabpanel 的双向关联与唯一 id。',
    },
  ],
  notes: [
    '范围参考 Ant Design Tabs 常用能力与 WAI-ARIA Tabs 模式；编辑/新增/关闭、拖拽排序、自定义标签栏、溢出下拉、上下左右四边位置和内容离场动画暂不支持。',
    '内容插槽在初始化时固定；运行时替换函数属于 F09，暂缓。普通文本和 VM 数据正常响应更新。指示条响应选项增删、标签大小、容器及字体变化，卸载时清理观察器。',
    '参考：https://ant.design/components/tabs/ 和 https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ 。',
  ],
};
