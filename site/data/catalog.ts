import type { ComponentDoc } from './types';

import { buttonDoc } from './button';
import { choiceDocs } from './choices';
import { containerDocs } from './containers';
import { dialogDocs } from './dialogs';
import { displayDocs } from './display';
import { feedbackDocs } from './feedback';
import { flowDocs } from './flow';
import { formDoc } from './forms';
import { hierarchyDocs } from './hierarchy';
import { inputDocs } from './inputs';
import { layoutDocs } from './layout';
import { navigationDocs } from './navigation';
import { noticeDocs } from './notices';
import { overlayDocs } from './overlays';
import { paginationDoc } from './pagination';
import { pickerDocs } from './pickers';
import { primitiveDocs } from './primitives';
import { selectDocs } from './selects';
import { tableDoc } from './table';
import { tabsDoc } from './tabs';
import { uploadDoc } from './upload';

const planned: [string, string, string, string, string][] = [
  ['icon', 'Icon', '图标', '通用', 'SVG 图标、颜色尺寸和可访问名称。'],
  ['typography', 'Typography', '排版', '通用', '标题、文本、段落与链接。'],
  ['space', 'Space / Flex', '间距与弹性布局', '布局', '横纵排列、间距、对齐和换行。'],
  ['divider', 'Divider', '分割线', '布局', '横纵分割线、虚线和带文字分割。'],
  ['grid', 'Grid', '栅格', '布局', '24 栅格与响应式列宽。'],
  ['layout', 'Layout', '布局容器', '布局', '页头、侧栏、内容和页脚。'],
  ['input', 'Input', '输入框', '数据录入', '基础、文本域、密码、清空和输入法处理。'],
  ['input-number', 'InputNumber', '数字输入框', '数据录入', '数值、精度、步长、边界和空值。'],
  ['checkbox', 'Checkbox', '多选框', '数据录入', '单项、分组、半选和禁用。'],
  ['radio', 'Radio', '单选框', '数据录入', '单项、分组及键盘切换。'],
  ['switch', 'Switch', '开关', '数据录入', '开关状态、加载与禁用。'],
  ['select', 'Select', '选择器', '数据录入', '单多选、搜索、清空、加载和选项插槽。'],
  ['autocomplete', 'AutoComplete', '自动完成', '数据录入', '输入建议与键盘选择。'],
  ['form', 'Form', '表单', '数据录入', '字段绑定、提交重置和同步/异步校验。'],
  ['date-picker', 'DatePicker / RangePicker', '日期选择', '数据录入', '单日期、范围、禁用和格式。'],
  ['time-picker', 'TimePicker', '时间选择', '数据录入', '时分秒选择与禁用。'],
  ['upload', 'Upload', '上传', '数据录入', '文件选择、校验、自定义上传和进度。'],
  ['cascader', 'Cascader', '级联选择', '数据录入', '层级选项、禁用、加载与键盘交互。'],
  ['menu', 'Menu', '导航菜单', '导航', '导航、分组、展开、选中与键盘交互。'],
  ['dropdown', 'Dropdown', '下拉菜单', '导航', '操作菜单和触发器插槽。'],
  ['breadcrumb', 'Breadcrumb', '面包屑', '导航', '链接、分隔符和自定义展示。'],
  ['tabs', 'Tabs', '标签页', '导航', '选中、内容插槽、禁用和动态指示条。'],
  ['segmented', 'Segmented', '分段控制', '导航', '互斥选项、禁用与键盘切换。'],
  ['steps', 'Steps', '步骤条', '导航', '当前步骤、状态和说明。'],
  ['pagination', 'Pagination', '分页', '导航', '页码、页大小和快速跳转。'],
  ['avatar', 'Avatar', '头像', '数据展示', '图片、文字、图标与失败回退。'],
  ['badge', 'Badge', '徽标', '数据展示', '计数、圆点、上限和状态。'],
  ['tag', 'Tag', '标签', '数据展示', '语义色、关闭和自定义内容。'],
  ['card', 'Card', '卡片', '数据展示', '标题、操作、内容插槽和加载。'],
  ['collapse', 'Collapse', '折叠面板', '数据展示', '展开、手风琴和键盘操作。'],
  ['descriptions', 'Descriptions', '描述列表', '数据展示', '详情信息和响应式布局。'],
  ['empty', 'Empty', '空状态', '数据展示', '空态说明、插图和操作。'],
  ['table', 'Table', '表格', '数据展示', '列、插槽、排序筛选、选择和分页。'],
  ['tree', 'Tree', '树', '数据展示', '展开、选择、勾选、过滤和加载。'],
  ['tooltip', 'Tooltip', '文字提示', '数据展示', '悬浮与聚焦提示。'],
  ['popover', 'Popover', '气泡卡片', '数据展示', '可交互浮层与内容插槽。'],
  ['alert', 'Alert', '警告提示', '反馈', '状态、标题说明和关闭。'],
  ['modal', 'Modal', '对话框', '反馈', '嵌套、焦点管理、异步确认和结果。'],
  ['drawer', 'Drawer', '抽屉', '反馈', '侧边面板、焦点与关闭策略。'],
  ['popconfirm', 'Popconfirm', '气泡确认', '反馈', '确认、取消及异步操作。'],
  ['message', 'Message', '全局提示', '反馈', '消息、更新、关闭、清空与等待。'],
  ['notification', 'Notification', '通知', '反馈', '通知位置、标题、内容与关闭。'],
  ['spin', 'Spin', '加载中', '反馈', '尺寸、说明和容器覆盖。'],
  ['skeleton', 'Skeleton', '骨架屏', '反馈', '文本、头像和块级占位。'],
  ['progress', 'Progress', '进度条', '反馈', '线形、圆形、状态与进度。'],
  ['result', 'Result', '结果', '反馈', '结果状态、说明和操作。'],
];
const delivered = [
  buttonDoc,
  uploadDoc,
  ...hierarchyDocs,
  tabsDoc,
  tableDoc,
  ...pickerDocs,
  paginationDoc,
  ...flowDocs,
  ...navigationDocs,
  formDoc,
  ...primitiveDocs,
  ...layoutDocs,
  ...overlayDocs,
  ...dialogDocs,
  ...noticeDocs,
  ...displayDocs,
  ...containerDocs,
  ...feedbackDocs,
  ...inputDocs,
  ...choiceDocs,
  ...selectDocs,
];
export const catalog: ComponentDoc[] = [
  ...delivered,
  ...planned
    .filter(([id]) => !delivered.some((doc) => doc.id === id))
    .map(([id, name, title, category, description]) => ({
      id,
      name,
      title,
      category,
      description,
      status: 'planned' as const,
      demos: [],
      api: [],
      notes: [],
    })),
];
export const groups = ['通用', '布局', '数据录入', '导航', '数据展示', '反馈', '基础机制'].map(
  (name) => ({
    name,
    items: catalog.filter((doc) => doc.category === name),
  }),
);
export function matches(doc: ComponentDoc, search: string) {
  return `${doc.name} ${doc.title} ${doc.description}`
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}
export function resolveRoute(hash: string) {
  const id = hash.split('?')[0].replace(/^#\/?components\//, '');
  return catalog.find((doc) => doc.id === id);
}

export function hasMatches(items: ComponentDoc[], search: string) {
  return items.some((doc) => matches(doc, search));
}
