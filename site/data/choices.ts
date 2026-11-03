import type { ApiRow, ComponentDoc } from './types';

import { CheckboxExample } from '../demos/checkbox';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import checkboxSource from '../demos/checkbox.tsx?raw';
import { RadioExample } from '../demos/radio';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import radioSource from '../demos/radio.tsx?raw';
import { SwitchExample } from '../demos/switch';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import switchSource from '../demos/switch.tsx?raw';
const checkApi: ApiRow[] = [
  {
    name: 'checked / defaultChecked / on:change',
    type: 'boolean / boolean / (checked: boolean, event: Event) => void',
    default: 'false',
    description:
      'checked 初始化非 undefined 为受控，否则 defaultChecked 初始化；之后不切换模式。受控请求需父级写回，拒绝时下一显示帧恢复。',
  },
  {
    name: 'label / children',
    type: 'string / JNode',
    description:
      '可见标签，默认插槽优先；交互控件不要嵌套在 label 内。无可见文本时必须提供 ariaLabel/ariaLabelledby。',
  },
  {
    name: 'id / name / value / form / required / disabled / autoFocus / tabIndex',
    type: '原生属性',
    description:
      '真实 input 可关联 label，参与 FormData 和原生校验；默认提交值 on。未勾选和禁用项不提交。',
  },
  {
    name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid',
    type: '可访问名称和说明',
    description: '传给原生输入。',
  },
  {
    name: 'size / className / style / ref.focus / ref.blur / on:focus / on:blur',
    type: 'sm | md | lg / string / 公开方法 / FocusEvent',
    default: 'md',
    description: '样式作用于 label，焦点方法及事件作用于原生输入。',
  },
];
const groupApi: ApiRow[] = [
  {
    name: 'options',
    type: 'ChoiceOption<T>[]，T 为 string | number',
    description:
      'value 唯一；label 文本或 slot:label 插槽，支持 disabled/id。按 value 保持节点身份。',
  },
  {
    name: 'value / defaultValue / on:change',
    type: '选择值 / 初始值 / (value, event: Event) => void',
    description:
      '初始化非 undefined 为受控，null 表示受控空选择。选项以外的值不展示；移除选项会归一化显示，不触发 change。默认数组被快照，不随之后的 defaultValue 改变。',
  },
  {
    name: 'legend / ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid',
    type: 'string / 可访问属性',
    description: '使用原生 fieldset/legend，提供组名称和描述。',
  },
  {
    name: 'name / form / disabled / direction / size / id / className / style',
    type: '原生关联 / horizontal | vertical / sm | md | lg',
    description:
      'name/form/disabled/size 传给所有输入；重复 name 参与 FormData，form 也绑定 fieldset 的重置。',
  },
];
export const choiceDocs: ComponentDoc[] = [
  {
    id: 'switch',
    name: 'Switch',
    title: '开关',
    category: '数据录入',
    status: 'ready',
    description: '立即切换布尔状态，支持加载、禁用、状态文案及原生表单。',
    demos: [
      {
        id: 'switch-basic',
        title: '自动保存设置',
        description: '切换即更新，模拟保存期间阻止重复操作；尺寸和禁用状态可组合。',
        render: SwitchExample,
        source: switchSource,
      },
    ],
    api: [
      ...checkApi,
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description:
          '原生输入 disabled 且 aria-busy=true，阻止键盘/鼠标修改；加载指示遵循 reduced-motion。加载期间与禁用相同，不参与 FormData。',
      },
      {
        name: 'checkedLabel / uncheckedLabel',
        type: 'string / string',
        description:
          '轨道中的开/关文案，仅作状态装饰，名称由 label/children/ariaLabel 提供且保持稳定。',
      },
    ],
    notes: [
      '公开 API 为 checked/defaultChecked/on:change，value 仅为原生表单提交值，不是布尔状态别名。',
      '原生 checkbox input 使用 role=switch，可用 Space 和 Enter 切换；Enter 不提交表单。提供稳定名称，不依赖开/关状态文案作为名称。',
      'form.reset 恢复非受控初值，受控保留父值，不触发 change。loading/disabled 都禁用原生输入，已选项也不会提交。',
      'ref.focus/blur 指向原生输入。样式作用于 label，轨道只是装饰；不引入第三方依赖。',
    ],
  },
  {
    id: 'radio',
    name: 'Radio',
    title: '单选框',
    category: '数据录入',
    status: 'ready',
    description: '原生单选、方向键切换和按钮样式，支持单项和分组。',
    demos: [
      {
        id: 'radio-basic',
        title: '方案与展示方式',
        description: '同组方向键跳过禁用选项，Tab 进入下一组；按钮样式保留原生键盘语义。',
        render: RadioExample,
        source: radioSource,
      },
    ],
    api: [
      ...checkApi,
      {
        name: 'variant',
        type: "'default' | 'button'",
        default: 'default',
        description: '普通圆点或按钮外观，不改变 input 的 radio 语义。',
      },
      ...groupApi.map((row) => ({ ...row, name: `RadioGroup.${row.name}` })),
      {
        name: 'RadioGroup.required / variant',
        type: "boolean / 'default' | 'button'",
        description:
          '组内原生必选校验，样式传给每项；RadioGroup.change 回传 T | undefined，界面选择只发出有效 T。',
      },
    ],
    notes: [
      'Radio 单项使用 checked 布尔值，RadioGroup 使用单个 value；空受控组传 value=null，0 和空字符串都是有效选项值。',
      'RadioGroup 未指定 name 时生成每实例独立名称，支持浏览器原生互斥和方向键；参与原生表单时请显式提供业务 name，自动名称同样会出现在 FormData 中。',
      '组合受控 Radio 建议使用 RadioGroup，确保父级拒绝请求后整组恢复。独立 Radio 同名互斥由浏览器管理，不建议多个独立受控实例混用互相矛盾的 checked 值。',
      'reset 恢复非受控初始选项，受控保持父值，不触发 change；清空或移除选项不自动选择第一项。首轮通过 options/标签插槽组合。',
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    title: '多选框',
    category: '数据录入',
    status: 'ready',
    description: '原生复选、半选与分组，保留表单及空格键语义。',
    demos: [
      {
        id: 'checkbox-basic',
        title: '角色权限与全选',
        description: '全选/半选由业务选择值推导，分组管理权限数组。',
        render: CheckboxExample,
        source: checkboxSource,
      },
    ],
    api: [
      ...checkApi,
      {
        name: 'indeterminate',
        type: 'boolean',
        default: 'false',
        description:
          '设置原生 indeterminate 和 aria-checked=mixed；只表示外观及语义，不替代 checked 或表单提交值，由父级控制。',
      },
      ...groupApi.map((row) => ({ ...row, name: `CheckboxGroup.${row.name}` })),
    ],
    notes: [
      '非受控 form.reset 恢复初始勾选/选择数组，受控保持父值；重置不触发 change。',
      'CheckboxGroup 的 change 返回去重数组，保留 string/number 类型；添加值追加到数组，选项重排保持节点和勾选。原生表单提交时数值转为字符串。',
      '分组首轮采用 options 和标签插槽，不枚举/克隆任意 children；树形级联、自动全选规则暂不内置。',
    ],
  },
];
