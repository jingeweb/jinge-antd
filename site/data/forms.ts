import type { ComponentDoc } from './types';

import { FormExample } from '../demos/form';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import formSource from '../demos/form.tsx?raw';
export const formDoc: ComponentDoc = {
  id: 'form',
  name: 'Form',
  title: '表单',
  category: '数据录入',
  status: 'ready',
  description: 'Zod 数据与校验、显式字段绑定、标签布局、异步提交及动态字段。',
  demos: [
    {
      id: 'form-member',
      title: '新建成员',
      description: '姓名转换、邮箱异步校验、跨字段密码确认、选择/开关、动态备注和提交/重置。',
      render: FormExample,
      source: formSource,
    },
  ],
  api: [
    {
      name: 'useForm(schema, { defaultValues })',
      type: 'FormInstance<z.input<S>, z.output<S>>',
      description:
        'schema 输入与输出分离；草稿为 Partial<input>，校验/提交成功得到转换后的 output。默认值深拷贝为初始快照。实例与 schema 在 Form 生命周期内保持稳定。',
    },
    {
      name: 'formState / formErrors / status',
      type: 'VM 草稿 / 字段错误 / 状态 VM',
      description:
        'status 包含 touched/dirty/validating/submitting/validated/submitCount/formError/submitError。直接编辑草稿会更新脏值并使旧校验过期；推荐 setter 触发依赖校验。',
    },
    {
      name: 'validate / validateField',
      type: 'Promise<[errors] | [undefined, output] | [errors, undefined, { outOfDate: true }]> / Promise<string | undefined>',
      description:
        '字段也校验完整数据快照，保留对象 refine/superRefine，嵌套错误归到顶层字段，无 path 的错误放 status.formError。过期结果不覆盖 UI，不作为有效提交。',
    },
    {
      name: 'setField / setFields / setError / clearErrors / reset',
      type: '字段/批量赋值、服务端错误、清错、重置',
      description:
        'setField 第三参数可立即校验；setFields 第二参数可全量校验。reset() 恢复初值，reset(values) 建立新基线，清理错误/触碰/脏值和旧事务，不更换草稿 VM。',
    },
    {
      name: 'submit(finish, invalid?, error?) / cancelPending / dispose / focusField',
      type: 'Promise<boolean> / 生命周期 / 焦点',
      description:
        '并发提交复用同一个 Promise；校验、回调期间 submitting=true。异常可恢复；reset/unmount/dispose 后忽略旧 UI 完成。dispose 用于手动结束无组件拥有的实例。',
    },
    {
      name: 'Form.form / layout / labelWidth / size / disabled / disabledWhileSubmitting / requiredMark',
      type: '实例 / horizontal | vertical | inline / string | number / sm | md | lg / boolean',
      description:
        '默认竖向、140px、md；提交中默认禁用。原生 fieldset 与字段 disabled 共同约束，尺寸通过 field.size 显式传给控件。窄屏横向标签改为竖向。',
    },
    {
      name: 'Form.on:finish / on:finishFailed / on:error / on:reset / ref.submit / ref.reset',
      type: '输出/错误/原生 reset / 方法',
      description:
        '拦截原生 submit 并使用 Zod；不叠加浏览器原生校验。reset 事件可 preventDefault；公开方法走原生表单事件。',
    },
    {
      name: 'FormField / Controller: name / control / children',
      type: '顶层字段名 / form.control / (field) => JNode',
      description:
        'FormField 增加标签/帮助/错误布局，Controller 只绑定数据。支持运行中切换 name/control；释放旧订阅与焦点注册。',
    },
    {
      name: 'FormField.label / help / required / layout / descriptionId / focus',
      type: '标签/说明/必填标记/布局/附加描述/焦点回调',
      description:
        '生成 id、标签 htmlFor 和 help/error id。将 field.id/ariaDescribedby/invalid 显式传给控件；required 标记不自动改 Zod 规则。通过 ref={field.ref} 注册控件后按实例聚焦；显式 focus 回调优先，未注册 ref 时兼容按 id 聚焦。',
    },
    {
      name: 'field.ref',
      type: '(handle: { focus(): void } | undefined) => void',
      description:
        '传给控件 ref，注册字段焦点目标；回调身份稳定，控件卸载时解除引用。优先级为显式 focus → 注册实例 → 既有 id 回退。',
    },
    {
      name: 'validateTrigger / dependencies / preserve',
      type: 'blur | change | submit / 字段名数组 / boolean',
      description:
        '默认 blur；已触碰字段及提交后重新编辑会校验。依赖变化重验已触碰/已提交字段。默认保留动态字段草稿，preserve=false 最后一个绑定卸载时移除。',
    },
    {
      name: 'field.value / on:change / on:blur / error / touched / dirty / validating / disabled / size',
      type: '响应式字段插槽数据',
      description:
        '文字 value 用 ?? 空字符串，空受控 Select/数字用 ?? null，布尔控件绑定 checked。不克隆 children，所有属性传递可见。',
    },
  ],
  notes: [
    '字段名首轮只支持顶层字符串键；嵌套数据可以整体赋值/校验，错误归到第一段路径。任意路径 Controller、Form.List、Schema 表单生成器暂缓。',
    '每次字段校验执行完整 schema，保留跨字段规则；Zod 在类型不满足时可能不执行对象 refine，应提供合理初值并按 Zod 语义组织规则。昂贵的远程校验由业务节流、取消或缓存。',
    '快照覆盖非循环的普通对象/数组/Date；文件等实例保留引用。schema 转换不会改写草稿。输入值变化、重置、清错、动态解绑和新校验会使相应旧结果失效。',
    '动态字段的 schema 不会被组件改写；移除后可缺省的字段应在 schema 中 optional 或通过业务条件规则表达。默认不保留已移除字段的焦点目标。',
    'Form 卸载取消校验/提交 UI 事务并保留草稿以供重开；不自动中止业务 Promise 或撤销网络请求。异步业务自身的副作用仍需由业务隔离，示例会清理并结算等待计时器。',
    'field.ref 接收提供 focus() 的组件实例或原生元素，并在卸载时清除引用。一个字段仅注册一个焦点目标；复合业务控件可暴露自己的 focus() 或使用显式 focus。',
  ],
};
