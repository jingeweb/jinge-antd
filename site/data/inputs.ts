import type { ApiRow, ComponentDoc } from './types';

import { InputExample } from '../demos/input';
import { InputNumberExample } from '../demos/input-number';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import numberSource from '../demos/input-number.tsx?raw';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import inputSource from '../demos/input.tsx?raw';
import { PasswordExample } from '../demos/password';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import passwordSource from '../demos/password.tsx?raw';
import { TextAreaExample } from '../demos/textarea';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import textareaSource from '../demos/textarea.tsx?raw';

const textApi: ApiRow[] = [
  {
    name: 'value / defaultValue / on:change',
    type: 'string | null / string / (value: string, event: Event) => void',
    description:
      '初始化有 value 为受控（null 表示受控空值），否则 defaultValue 初始化；之后不切换模式。父级需写回接受值；未接受的草稿在下一显示帧回到 value。清空为字符串空值。',
  },
  {
    name: 'id / name / form / placeholder / required / disabled / readOnly',
    type: '原生属性',
    description: '传给原生控件，参与 label、原生校验及 FormData。禁用/只读会阻止组件编辑和清空。',
  },
  {
    name: 'autoComplete / autoFocus / minLength / maxLength / tabIndex',
    type: '原生属性',
    description: '长度沿用浏览器 UTF-16 单位，不会截断外部给定值。',
  },
  {
    name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid / status',
    type: "string / string / string / boolean / 'error' | 'warning'",
    description: '可访问名称和错误说明传给原生控件；错误状态默认设置 aria-invalid，可显式覆盖。',
  },
  {
    name: 'allowClear / clearLabel / showCount',
    type: 'boolean / string / boolean',
    default: 'false / 清空输入 / false',
    description:
      '原生按钮可键盘操作，清空后聚焦输入；计数不主动播报并加入 describedby，保留其他描述 id。',
  },
  {
    name: 'on:input / on:focus / on:blur / on:pressEnter / on:clear',
    type: '原生 Event / FocusEvent / KeyboardEvent / MouseEvent',
    description:
      'input 含组合输入中间事件；change 只在 compositionend 提交一次。组合阶段 Enter 不触发 pressEnter。',
  },
  {
    name: 'ref.focus / blur / select',
    type: '公开方法',
    description: 'focus 可传 FocusOptions，select 选择原生控件文本，不暴露私有宿主。',
  },
  {
    name: 'size / className / style',
    type: "'sm' | 'md' | 'lg' / string / string",
    default: 'md',
    description: '尺寸和外框样式；原生控件仍带 ja-input。动态清空/计数/前后缀不重建控件。',
  },
];
const textNotes = [
  '值模式在初始化固定。可选空字段需要受控时用 value=null；后续受控清空仍可写回 undefined，实例保持原模式。',
  '原生 form.reset 会恢复非受控初值且不触发 change；受控字段仍由父级 value 决定。',
  '外框现在是稳定 span，className/style 作用于外框；id/name/ARIA/ref 方法作用于原生控件。与 Tooltip 组合需要把提示 id 显式传入 ariaDescribedby，避免只给外框建立描述关系。',
  '输入事件遵循现代浏览器。自动填充、移动端键盘和具体 IME 平台行为以真实浏览器为准；不提供输入掩码或自定义字符计数算法。',
];
export const inputDocs: ComponentDoc[] = [
  {
    id: 'input-number',
    name: 'InputNumber',
    title: '数字输入框',
    category: '数据录入',
    status: 'ready',
    description: '数值草稿、空值、精度与范围提交，以及键盘和按钮步进。',
    demos: [
      {
        id: 'number-basic',
        title: '订单金额',
        description: '0.1 步进、两位小数、0–100 范围；清空表示未填写。',
        render: InputNumberExample,
        source: numberSource,
      },
    ],
    api: [
      {
        name: 'value / defaultValue / on:change',
        type: 'number | null / number / (value: number | undefined, event: Event) => void',
        description:
          '初始化 value 非 undefined 为受控，null 显式表示受控空值；编辑发出有限数值，清空回传 undefined。草稿保留到失焦/Enter，受控提交后仍以父级 value 为准。',
      },
      {
        name: 'min / max / precision',
        type: 'number / number / number',
        description:
          '失焦、Enter 和步进时限制边界与精度（0–15 位）；边界优先。要求 min ≤ max；外部 value 或范围更新不静默裁剪值、不触发 change。',
      },
      {
        name: 'step / keyboard / controls',
        type: 'number / boolean / boolean',
        default: '1 / true / true',
        description:
          '正步长，ArrowUp/Down 和原生按钮操作；普通小数步进消除浮点尾数。空值从 0 加减步长并裁剪范围。controls=false 隐藏按钮；keyboard=false 禁用方向键步进。',
      },
      {
        name: 'id / name / form / required / disabled / readOnly / placeholder / autoComplete / autoFocus / tabIndex',
        type: '原生属性',
        description:
          '参与 label、FormData 和原生约束；reset 恢复非受控初值，受控保持父级 value，不触发 change。',
      },
      {
        name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid / status',
        type: '可访问名称和状态',
        description:
          '传入原生 type=number，保留 spinbutton 语义、原生 min/max/step 校验；status=error 默认 aria-invalid。',
      },
      {
        name: 'on:input / on:focus / on:blur / on:pressEnter',
        type: 'Event / FocusEvent / KeyboardEvent',
        description: '原生事件；通过 on:change 读取数值，不把 event.target.value 当成归一化结果。',
      },
      {
        name: 'ref.focus / blur / select / size / className / style',
        type: '公开方法 / 尺寸 / 外框样式',
        description: '与 Input 的公开方法/尺寸一致；原生 number 的选区能力受浏览器限制。',
      },
    ],
    notes: [
      '原生 type=number 保留未完成的负号/指数等 badInput 草稿，期间不把它当空值；提交恢复上一次有效数值。真正清空回传 undefined，绝不转成 0。',
      '编辑时可以暂时超出 min/max；提交归一化。step 是步进大小，不会把手工输入强制吸附网格；原生 form 校验仍受 step 限制。',
      '使用 JavaScript number，常用业务小数可用，不承诺高精度金融计算或超出安全整数的精确性；stringMode、formatter/parser、货币千分位和滚轮自定义暂缓。',
      '受控空字段初始请传 null，初始化后不切换控制模式；外框稳定，className/style 作用于外框。',
    ],
  },
  {
    id: 'password',
    name: 'Password',
    title: '密码输入',
    category: '数据录入',
    status: 'ready',
    description: '默认遮罩密码，显示切换保留输入节点、文本及选区。',
    demos: [
      {
        id: 'password-basic',
        title: '显示与隐藏',
        description: '可使用键盘操作切换按钮；只读示例可关闭切换入口。',
        render: PasswordExample,
        source: passwordSource,
      },
    ],
    api: [
      ...textApi,
      {
        name: 'visible / defaultVisible / on:visibleChange',
        type: 'boolean / boolean / (visible: boolean) => void',
        default: 'false',
        description:
          '受控 / 默认明文显示 / 切换请求；切换不触发文本 change，初始化后不切换可见性的控制模式。',
      },
      {
        name: 'visibilityToggle',
        type: 'boolean',
        default: 'true',
        description: '原生按钮有 aria-pressed 和 controls；禁用时不可操作，readonly 仍可切换查看。',
      },
    ],
    notes: [
      ...textNotes,
      'autoComplete 可显式使用 current-password/new-password；当前通过公开 DOM API 同步正确的 autocomplete 属性，compiler 的对应问题记录为 F07。',
    ],
  },
  {
    id: 'textarea',
    name: 'TextArea',
    title: '多行输入',
    category: '数据录入',
    status: 'ready',
    description: '多行文本、清空和计数，支持按内容及宽度自动调整高度。',
    demos: [
      {
        id: 'textarea-basic',
        title: '自动高度与长度限制',
        description: '保持二至五行，超过上限内部滚动，输入节点和选择状态保持稳定。',
        render: TextAreaExample,
        source: textareaSource,
      },
    ],
    api: [
      ...textApi,
      {
        name: 'rows / autoSize / resize',
        type: "number / boolean | { minRows?, maxRows? } / 'none' | 'vertical' | 'horizontal' | 'both'",
        default: '3 / false / vertical',
        description:
          '默认行数、自动高度和手工拖动方向；autoSize 开启时使用内容高度，禁用手工拖动，缺省最小一行、最大不限制。',
      },
      {
        name: 'ref.resize',
        type: '() => void',
        description:
          '显式重测高度；内容变化和 ResizeObserver 宽度变化也会触发测量，卸载后清理监听及帧任务。',
      },
    ],
    notes: [
      ...textNotes,
      'autoSize 通过原生 scrollHeight 和样式测量，不复制或解析业务 children；现代浏览器使用 ResizeObserver 跟随宽度，隐藏区域重新显示时重测。',
    ],
  },
  {
    id: 'input',
    name: 'Input',
    title: '输入框',
    category: '数据录入',
    status: 'ready',
    description: '支持受控/默认值、原生表单语义、输入法、清空、计数和前后缀。',
    demos: [
      {
        id: 'input-basic',
        title: '客户姓名与表单',
        description: '输入、清空、切换前缀并提交；附加内容变化会保留焦点与原生节点。',
        render: InputExample,
        source: inputSource,
      },
    ],
    api: [
      ...textApi,
      {
        name: 'type / inputMode / pattern',
        type: "'text' | 'search' | 'email' | 'url' | 'tel' / 原生 inputMode / string",
        default: 'text',
        description: '输入用途与原生约束；密码请使用 Password。',
      },
      {
        name: 'prefix / suffix / slot:prefix / slot:suffix',
        type: 'string / JNode',
        description: '装饰内容，插槽优先；可继续组合 InputWrapper/InputAddon。',
      },
    ],
    notes: textNotes,
  },
];
