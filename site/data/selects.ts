import type { ApiRow, ComponentDoc } from './types';

import { AutoCompleteExample } from '../demos/autocomplete';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import autocompleteSource from '../demos/autocomplete.tsx?raw';
import { SelectExample } from '../demos/select';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import selectSource from '../demos/select.tsx?raw';
const comboApi: ApiRow[] = [
  {
    name: 'options',
    type: 'SelectOption<T>[]',
    description:
      'value 为唯一 string/number，label 为必需的纯文本名称；disabled 阻止选择，group 按标签分组。',
  },
  {
    name: 'open / defaultOpen / on:openChange',
    type: 'boolean / boolean / (open, event?) => void',
    description:
      '初始化 open 非 undefined 为受控；禁用强制隐藏。支持 Arrow、Escape、Tab 和外部点击关闭。',
  },
  {
    name: 'filterOption / on:search',
    type: 'boolean | (query, option) => boolean / (query, event) => void',
    default: 'true',
    description:
      '默认匹配 label/value，忽略大小写；false 关闭本地过滤以接入业务异步搜索。IME 只在 compositionend 发一次 search。',
  },
  {
    name: 'loading / emptyText / loadingText / popupWidth / popupClassName',
    type: 'boolean / string / string / number / string',
    description:
      '加载期间不选择旧结果；无结果和加载有 status 说明。浮层默认跟随触发宽度，支持尺寸/滚动跟随与嵌套 Portal。',
  },
  {
    name: 'id / name / form / required / disabled / autoFocus / tabIndex',
    type: '表单与焦点属性',
    description:
      'name/form 关联原生提交值；required 使用独立原生校验控件，校验失败聚焦可见 combobox。reset 不触发 change。',
  },
  {
    name: 'ariaLabel / ariaLabelledby / ariaDescribedby / ariaInvalid / status',
    type: '名称/说明/错误状态',
    description:
      '设置在真正获得焦点的 combobox 上；aria-controls/activedescendant 关联实际 listbox/option。自定义选项内容不要放可交互控件。',
  },
  {
    name: 'size / className / style / triggerClassName / ref.focus / ref.blur',
    type: 'sm | md | lg / string / 公开方法',
    description:
      'className/style 作用于稳定外框，triggerClassName 作用于输入或按钮，公开方法不暴露私有宿主。',
  },
];
export const selectDocs: ComponentDoc[] = [
  {
    id: 'autocomplete',
    name: 'AutoComplete',
    title: '自动完成',
    category: '数据录入',
    status: 'ready',
    description: '自由文本和输入建议，复用选择列表但不限制用户必须选择。',
    demos: [
      {
        id: 'autocomplete-basic',
        title: '邮箱建议',
        description: '模拟异步建议并显示加载，清理旧计时器；可以采用建议或保留任意文本。',
        render: AutoCompleteExample,
        source: autocompleteSource,
      },
    ],
    api: [
      {
        name: 'value / defaultValue / on:change',
        type: 'string | null / string / (value: string, event: Event) => void',
        description:
          '初始化 value 非 undefined 为受控，null 为受控空值；真正清空为字符串空值。父级未接受的草稿在下一显示帧回到 value。',
      },
      {
        name: 'on:select',
        type: '(value: string, option: AutoCompleteOption, event: Event) => void',
        description:
          '仅选择建议时触发，输入和 clear 不触发；提交的是 option.value，不是展示 label。',
      },
      {
        name: 'readOnly / autoComplete / maxLength / minLength / allowClear / clearLabel',
        type: '原生属性 / boolean / string',
        description:
          '传给实际 input；autoComplete 默认 off，可设置 email 等。只读不更改值或打开建议。清空默认按钮名称为清空输入。',
      },
      {
        name: 'slot:option / ref.select / on:pressEnter',
        type: '({ option }) => JNode / () => void / KeyboardEvent',
        description:
          '自定义建议展示；选择原生文本；Enter 回调可通过 defaultPrevented 判断是否已被建议选择消费。',
      },
      ...comboApi,
    ],
    notes: [
      '自由文本始终有效，不要求匹配 options；value 和 options.value 都为 string，Select 的 mode/多选/已选标签不适用。',
      'on:change 接收输入值和建议值，on:search 只在正常文本编辑、IME 提交或清空时触发，不因选中建议触发。组合输入 Enter 不选中建议，尾随 input 去重。',
      'ArrowUp/Down 导航建议，Enter 采用，Escape/Tab 关闭且保留文本；没有展开建议时 Enter 保留原生表单提交行为。',
      '可见 input 原生参与表单、required/minLength/maxLength 校验和 label；reset 非受控恢复初值，受控保持父值，不触发 change/search。',
      'filterOption=false 可配合业务异步请求；组件不创建请求，业务负责取消旧请求或忽略过期结果，示例使用可取消计时器。加载和空选项显示状态说明。',
      '稳定的 option 插槽接收更新后的数据；暂缓运行中替换插槽函数、自定义输入组件、虚拟化与任意自动填充策略控制。',
    ],
  },
  {
    id: 'select',
    name: 'Select',
    title: '选择器',
    category: '数据录入',
    status: 'ready',
    description: '单选、多选、搜索和分组，使用 combobox/listbox 键盘与焦点语义。',
    demos: [
      {
        id: 'select-basic',
        title: '项目成员',
        description: '搜索负责人或选择多位评审人，分组、禁用和清空可组合。',
        render: SelectExample,
        source: selectSource,
      },
    ],
    api: [
      {
        name: 'mode / value / defaultValue / on:change',
        type: "'single' | 'multiple' / T | T[] | null / T | T[] / (value, event) => void",
        description:
          '初始化模式固定，value 非 undefined 为受控，null 是显式受控空值。单选清空 undefined，多选清空 []；on:change 的类型按 mode 区分。',
      },
      {
        name: 'showSearch / allowClear / clearLabel / maxTagCount',
        type: 'boolean / boolean / string / number',
        description:
          '单选默认不搜索，多选默认搜索；showSearch 和 mode 初始化后不变。maxTagCount 仅折叠展示，不丢失选择；多选空查询 Backspace 移除末项。',
      },
      {
        name: 'slot:option / slot:selection',
        type: '({ option: SelectOption<T> }) => JNode',
        description:
          '稳定的选项/已选展示插槽，数据跟随选项更新；文本 label 仍用于搜索及可访问名称。',
      },
      ...comboApi,
    ],
    notes: [
      '未找到的 value 保留并临时展示其字符串，适合远程选项未加载场景；选项更新时重新解析标签，不触发 change。',
      '多选 change 为去重的新数组，父级需写回受控请求；选项内容按唯一 value 保持身份。搜索单选的已选文案使用纯文本 label；selection 插槽用于非搜索单选及多选标签。',
      '单选提交空字符串或选中值，多选按同名字段重复提交；数值转原生字符串。非受控 reset 恢复默认快照，受控保持父值。',
      '自定义外观不再复用 Menu 的菜单语义；选项是 role=option。文字 label 必填，旧 MenuOption 插槽字段改为组件级 slot:option/selection。',
      '初轮不做 tags 自动创建、虚拟滚动、超大列表、任意插槽函数动态替换或内置远程请求管理。F09 已独立复现；异步业务负责取消/忽略过期结果。',
    ],
  },
];
export { comboApi };
