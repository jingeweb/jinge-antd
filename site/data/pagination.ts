import type { ComponentDoc } from './types';

import { PaginationExample } from '../demos/pagination';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import source from '../demos/pagination.tsx?raw';
export const paginationDoc: ComponentDoc = {
  id: 'pagination',
  name: 'Pagination',
  title: '分页',
  category: '导航',
  status: 'ready',
  description: '有边界的页码导航、页大小选择和快速跳转。',
  demos: [
    {
      id: 'pagination-basic',
      title: '用户列表分页',
      description: '页码和页大小独立受控，页大小变化回到首页；支持总条数、禁用和精简模式。',
      render: PaginationExample,
      source,
    },
  ],
  api: [
    {
      name: 'total',
      type: 'number',
      default: '0',
      description:
        '记录总数，非有限/负值按 0 处理；空集合仍显示第 1 页。页码数量按常数上限渲染，支持大总量。',
    },
    {
      name: 'current / defaultCurrent',
      type: 'number',
      default: '1',
      description:
        '受控/初始页码，从 1 开始；越界自动按总量和页大小收敛。外部总量变化不发 change。控制模式初始化固定。',
    },
    {
      name: 'pageSize / defaultPageSize',
      type: 'number',
      default: '10',
      description:
        '受控/初始每页条数，与 current 分别控制；用户修改页大小请求第 1 页。无效值回退 10。',
    },
    {
      name: 'on:change / on:pageSizeChange',
      type: '(page, size) => void / (size) => void',
      description:
        '用户请求变化时触发。页大小变更先发 pageSizeChange，再发一次 change；重复页码和禁用交互不触发。受控父级可以拒绝请求。',
    },
    {
      name: 'showSizeChanger / pageSizeOptions',
      type: 'boolean / number[]',
      default: 'false / [10,20,50,100]',
      description:
        '原生 select 选择页大小；去重过滤无效项，并补入当前大小，原生表单 reset 不改变组件受控状态。',
    },
    {
      name: 'showQuickJumper / showTotal / simple / hideOnSinglePage',
      type: 'boolean',
      default: 'false',
      description:
        '跳转框用正整数字符串 + Enter 提交，超大页码收敛，Escape/失焦清空；总条数、精简前后页和只有一页时隐藏。',
    },
    {
      name: 'disabled / size / ariaLabel / className / style',
      type: 'boolean / sm | md / string / string / string',
      default: 'false / md / 分页',
      description:
        '整体禁用、尺寸、nav 名称与样式；按钮 type=button，当前页 aria-current=page，省略按钮前后跳 5 页。',
    },
  ],
  notes: [
    '导航只发出请求，不自行请求数据或滚动页面；远程列表可将 current/pageSize/total 绑定到业务状态。',
    '首轮不提供自定义 itemRender、总计插槽、自动尺寸响应式及路由链接；需要链接式分页可在业务层构造。',
    '参考：https://ant.design/components/pagination/ 。',
  ],
};
