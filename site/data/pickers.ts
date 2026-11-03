import type { ComponentDoc } from './types';

import { DatePickerExample, DatePickerFormExample } from '../demos/date-picker';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import dateSource from '../demos/date-picker.tsx?raw';
import { RangePickerExample } from '../demos/range-picker';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import rangeSource from '../demos/range-picker.tsx?raw';
import { TimePickerExample } from '../demos/time-picker';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import timeSource from '../demos/time-picker.tsx?raw';
const common = [
  {
    name: 'value / defaultValue / on:change',
    type: '原生 Temporal 值 | null / 初始值 / (value,event) => void',
    description:
      '初始化 value 非 undefined 时受控；空值使用 null。只在 Enter、离开整个控件、日历选择或面板确认时提交，键入/范围首端/时间草稿不发 change。父级可拒绝请求，下一帧恢复实际值。控制模式初始化固定。',
  },
  {
    name: 'open / defaultOpen / on:openChange',
    type: 'boolean / boolean / (open,event?) => void',
    description:
      '受控/初始浮层，禁用或只读会关闭并禁止打开。输入点击打开不抢焦点，ArrowDown 或图标打开后进入面板；Escape 取消草稿并回输入。Tab 正常遍历面板，在边界返回触发位置后离开。',
  },
  {
    name: 'disabled / readOnly / allowClear / required',
    type: 'boolean',
    default: 'false',
    description:
      '禁用、只读、清空和原生必填。无效输入保留并设置 aria-invalid/customValidity，不提交业务值；Escape 恢复已提交值。清空回传 null。组合输入 Enter 不提交。',
  },
  {
    name: 'name / form / id / placeholder / autoFocus',
    type: 'string / string / string / string / boolean',
    description:
      '可见文本参与原生校验，另一个 hidden input 按 ISO 提交 name 值；form 支持外部表单关联。reset 恢复非受控初始值，受控保留父值，不发 change。autocomplete 固定 off。',
  },
  {
    name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid',
    type: 'string / string / string / boolean',
    description:
      'combobox 名称和帮助/错误关联；优先用 label + id。浮层为非模态 dialog，使用已有 Floating，嵌套 Modal 时 Escape 只关闭当前面板。',
  },
  {
    name: 'ref / size / status / className / style',
    type: 'PickerHandle / sm | md | lg / error | warning / string / string',
    description: 'ref 提供 focus/blur/select；尺寸/状态/样式作用于输入外框。',
  },
];
const notes = [
  '仅使用浏览器原生 Temporal，不加载 polyfill、date-fns 或 Day.js。Chrome 144+ 已提供；其他浏览器须实际通过 temporalSupported()，不按 UA 猜测。缺失时组件禁用并提示，站点示例也有明确不可用状态。',
  'Jinge 需包含 Temporal 内建对象的 VM 排除修复。当前本地构建经 test:sync-jinge 显式同步，未 link 或引入第二份运行时；发布前须使用包含该修复的正式 Jinge 版本。',
  '公开值是不可变的原生 Temporal，整体替换值；Form 会按日期/时间语义比较等值实例。TypeScript 需启用 ESNext.Temporal 标准库声明，这不是运行时 polyfill。',
];
export const pickerDocs: ComponentDoc[] = [
  {
    id: 'date-picker',
    name: 'DatePicker / RangePicker',
    imports: ['DatePicker', 'RangePicker'],
    title: '日期选择',
    category: '数据录入',
    status: 'ready',
    description: '原生 Temporal 日期与日期范围，严格输入、月历、键盘和表单集成。',
    demos: [
      {
        id: 'date-picker-basic',
        title: '业务日期与格式',
        description:
          '选择纯日期，禁用周末及超界值；外部更新和手动输入使用同一规则。第二个输入展示 dd/MM/yyyy。',
        render: DatePickerExample,
        source: dateSource,
      },
      {
        id: 'range-picker-basic',
        title: '日期范围与快捷范围',
        description:
          '双月历选择两个端点才提交，支持悬浮预览；反向点击自动排序，文本输入必须按开始/结束顺序。',
        render: RangePickerExample,
        source: rangeSource,
      },
      {
        id: 'date-picker-form',
        title: 'Form 与原生 Temporal',
        description: 'FormField 绑定原生日期，验证、提交和重置；无效草稿不覆盖业务值。',
        render: DatePickerFormExample,
        source: dateSource,
      },
    ],
    api: [
      ...common,
      {
        name: 'DatePicker value / RangePicker value',
        type: 'Temporal.PlainDate | null / [Temporal.PlainDate,Temporal.PlainDate] | null',
        description:
          '纯日期，没有时间和时区。ISO 日历，UI 年份范围 0001–9999；输入日期值转成 iso8601 日历，非 ISO 日历的 UI 暂不支持。',
      },
      {
        name: 'format',
        type: 'yyyy-MM-dd | yyyy/MM/dd | dd/MM/yyyy',
        default: 'yyyy-MM-dd',
        description:
          '明确支持三种固定日期格式，严格补零/分隔符/真实日期校验，不兼容 Day.js/date-fns 任意 token 模板。范围输入形如 开始日期 ~ 结束日期。',
      },
      {
        name: 'minDate / maxDate / disabledDate',
        type: 'Temporal.PlainDate / Temporal.PlainDate / (date) => boolean',
        description:
          '含边界上下限与逐日禁用；范围检查两个端点，允许中间经过禁用日期。函数固定或用新函数触发配置更新，外部闭包变化不会自动重新枚举日期。',
      },
      {
        name: 'defaultPickerValue / weekStartsOn / locale',
        type: 'Temporal.PlainDate / 0..6 / string',
        default: '已选值或今天 / 1 / zh-CN',
        description:
          '初始显示月份、周起始日（0 周日）和 Intl 月份/星期语言；按钮和错误文案首轮为中文。上下月、年份输入和月份选择不提交业务值。',
      },
      {
        name: '键盘',
        type: 'Arrow / Home / End / PageUp / PageDown / Shift+Page',
        description:
          '方向键按日/周移动并跳过禁用项，Home/End 到周边界，Page 切月、Shift+Page 切年；Enter/Space 选中，Escape 取消。全部禁用时搜索有上限，不阻塞页面。',
      },
      {
        name: 'RangePicker on:calendarChange',
        type: '([start|null,end|null]) => void',
        description:
          '点击首端和完成端点时通知草稿，不代表已提交；面板内置预览和进度文案。Escape/外部关闭丢弃部分选择，无 change。',
      },
      {
        name: 'HTML name 值',
        type: 'string',
        description:
          'DatePicker 提交 yyyy-MM-dd；RangePicker 提交 yyyy-MM-dd/yyyy-MM-dd 的 ISO 日期区间，显示格式变化不改变提交格式。',
      },
    ],
    notes: [
      ...notes,
      '首轮为单日期和闭合范围。日期时间组合、月/季/年专用选择器、开放端点、任意格式模板、业务时区、非公历 UI、自定义日期格和运行中插槽替换暂缓；可用 PlainDate.toPlainDateTime(PlainTime) 在业务层组合日期时间。',
    ],
  },
  {
    id: 'time-picker',
    name: 'TimePicker',
    title: '时间选择',
    category: '数据录入',
    status: 'ready',
    description: '原生 Temporal.PlainTime，分钟/秒精度、步长、禁用规则和显式确认。',
    demos: [
      {
        id: 'time-picker-basic',
        title: '预约时间',
        description: '15 分钟步长与禁用营业时间，面板更改后点确定才提交；另一输入仅显示分钟。',
        render: TimePickerExample,
        source: timeSource,
      },
    ],
    api: [
      ...common,
      {
        name: 'value / defaultValue / format',
        type: 'Temporal.PlainTime | null / Temporal.PlainTime / HH:mm | HH:mm:ss',
        default: 'HH:mm:ss',
        description:
          '纯时间，不附加日期或时区；秒以下精度归零，HH:mm 模式秒也归零，默认名值始终按 HH:mm:ss 提交。',
      },
      {
        name: 'hourStep / minuteStep / secondStep',
        type: 'number',
        default: '1',
        description:
          '小时 1–24、分秒 1–60 的整数步长，无效参数回退 1。输入和确认都校验整除规则；已传入的非步长值在面板保留为不可选项，不自动悄悄改值。',
      },
      {
        name: 'disabledHours / disabledMinutes / disabledSeconds',
        type: '() => number[] / (hour) => number[] / (hour,minute) => number[]',
        description:
          '原生 select 对应选项禁用；更改上级可能令当前组合失效，需调整后确认，不自动替换下级选择。',
      },
      {
        name: 'disabledTime',
        type: '(time:Temporal.PlainTime) => boolean',
        description:
          '完整时间组合的额外校验；不推断所有列的组合可达性，当前组合禁用时显示状态并禁止确认。此刻按钮也需符合所有规则。',
      },
      {
        name: '提交/取消',
        type: 'Enter / blur / 确定 / Escape',
        description:
          '输入 Enter/离开控件提交合法文本；面板选择只改草稿，确定或合法的此刻才发 change；Escape/外部关闭丢弃面板草稿。',
      },
    ],
    notes: [
      ...notes,
      '首轮不支持 12 小时制、AM/PM、跨日时间范围、毫秒/纳秒 UI 和时区。需要时间区间可在业务中组合两个 TimePicker。',
    ],
  },
];
