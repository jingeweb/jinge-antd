import type { ApiRow, ComponentDoc } from './types';

import { MessageExample } from '../demos/message';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import messageSource from '../demos/message.tsx?raw';
import { NotificationExample } from '../demos/notification';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import notificationSource from '../demos/notification.tsx?raw';

const shared: ApiRow[] = [
  {
    name: 'content / slot:content',
    type: 'string / JNode',
    description: '内容文本或插槽；插槽优先。Message 内容必填，Notification 内容可省略。',
  },
  {
    name: 'duration',
    type: 'number',
    default: 'Message 4000 / Notification 4500',
    description:
      '单位毫秒，0 保持显示；负数与非有限值按 0 处理。update(duration) 从更新时重新计时。',
  },
  {
    name: 'className / style / closable',
    type: 'string / string / boolean',
    default: '— / — / Message false、Notification true',
    description: '卡片样式 / 关闭按钮；按钮有可访问名称。',
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'Message false / Notification true',
    description: '悬浮时暂停剩余时间，离开后继续；内容内有键盘焦点时也暂停。',
  },
  {
    name: 'on:close',
    type: '() => void',
    description: '任何关闭路径只通知一次；错误会记录到 console.error，不阻止其他条目的清理。',
  },
  {
    name: 'instance.close / waitClose',
    type: '() => void / () => Promise<void>',
    description: '幂等关闭；等待关闭状态，始终返回同一个 Promise，关闭后仍可等待。',
  },
  {
    name: 'instance.update',
    type: '(options: MessageUpdateOptions | NotificationUpdateOptions) => void',
    description:
      '更新文本、type、duration、className/style、closable、pauseOnHover；关闭后无效。插槽及通知位置不参与更新。',
  },
  {
    name: 'clear',
    type: '() => void',
    description:
      '关闭调用时存在的全部条目，取消定时器、通知回调并完成等待；回调中新建的条目保留。Message/Notification 独立清空。',
  },
];
const limits = [
  '静态方法创建独立 bootstrap 根，不继承调用处 context。复杂业务应让插槽内容显式接收所需数据。',
  'slot:content/title/icon/actions 在创建时固定，暂不支持 update 动态替换渲染函数；文本和状态可直接更新。',
  '提示不会主动移动焦点。error 使用 role=alert，其余状态使用 role=status；容器随最高活动弹窗调整层级，空容器自动销毁并释放订阅。',
  '当前仅提供入场动画，关闭立即移除；waitClose 表示状态结束，响应式 DOM 清理在随后渲染中完成。',
  '首轮不提供 key 去重、复杂堆叠折叠、进度环、跨页面队列或拖拽。',
];
export const noticeDocs: ComponentDoc[] = [
  {
    id: 'message',
    name: 'Message',
    imports: ['message'],
    title: '全局提示',
    category: '反馈',
    status: 'ready',
    description: '短暂反馈操作结果，居中顶部展示，支持加载状态更新、手动关闭与等待关闭。',
    demos: [
      {
        id: 'message-basic',
        title: '状态、更新与关闭',
        description: 'duration 使用毫秒；导入提示手动更新为成功，并在完成后自动关闭。',
        render: MessageExample,
        source: messageSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'message.success/error/info/warning/loading',
        type: '(content: string | MessageOptions) => MessageInstance',
        description: '五种常用状态，message.show(type, options) 可显式指定状态。',
      },
      {
        name: 'message.configContainer',
        type: '({ paddingTop?, paddingLeft?, paddingRight?, maxCount? }) => void',
        default: '16 / 0 / 0 / 5',
        description:
          '配置对活动容器即时生效。超过 maxCount 关闭最旧条目；非正或非有限上限表示不限制。',
      },
    ],
    notes: limits,
  },
  {
    id: 'notification',
    name: 'Notification',
    imports: ['notification'],
    title: '通知',
    category: '反馈',
    status: 'ready',
    description: '在视口四角展示较详细的信息和操作，支持自定义内容、图标与按钮。',
    demos: [
      {
        id: 'notification-basic',
        title: '位置与内容操作',
        description: '四个角落展示；通知中的操作完成后可显式关闭，鼠标和焦点停留期间暂停计时。',
        render: NotificationExample,
        source: notificationSource,
      },
    ],
    api: [
      ...shared,
      {
        name: 'notification.open / success/error/info/warning/loading',
        type: '(options: NotificationOptions) => NotificationInstance',
        description: 'open 的 type 默认 info；各状态方法固定相应类型。',
      },
      {
        name: 'title / slot:title / slot:icon / slot:actions',
        type: 'string / JNode',
        description: '标题文本或插槽必填；图标与操作插槽可选。',
      },
      {
        name: 'placement',
        type: "'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'",
        default: 'topRight',
        description: '创建时确定位置；每角独立滚动并受视口尺寸约束。',
      },
      {
        name: 'notification.config',
        type: '({ placement?, duration?, maxCount? }) => void',
        default: 'topRight / 4500 / 5',
        description:
          '默认位置/持续时间仅影响后续创建；maxCount 跨四角计数，修改时立即关闭超限的旧通知。',
      },
    ],
    notes: [
      '有弹窗时通知仍可被读屏获取；键盘焦点遵守弹窗范围，先关闭模态窗口再操作外部通知。',
      ...limits,
    ],
  },
];
