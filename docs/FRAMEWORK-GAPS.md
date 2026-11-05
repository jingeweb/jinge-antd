# Jinge 能力验证记录

只记录确认后的框架约束。组件 bug、未实现能力和需要评估的外部算法库不等同于框架缺陷。

每条记录应包含：编号、受影响组件、最小 TSX 复现、期望行为、实际编译/运行结果、可行方案与代价、暂缓能力、讨论结论。

## 已知约束

### F01：插槽是渲染函数，不能枚举或克隆 children

影响：Space 的每项包装/自动 separator、Group 对子组件属性的克隆注入。

现有机制：`props.children` 编译为 slot:default 函数，Jinge 没有 React.Children/cloneElement 对等能力。把已渲染 DOM 反向当作逻辑 children 解析会破坏生命周期与响应式边界。

处理：Space/Flex 使用 CSS gap；Group 用公开 context 提供尺寸/禁用默认值。先不实现需要枚举 children 的自动 separator。不修改框架，也不写 DOM 猜测逻辑。

此约束不影响常规插槽透传、局部状态、context、ref 或 DOM 测量。

## 待核实，不作为定论

- 全局配置变化的 context 传播：应传递稳定 VM，而非仅在初始化提取属性。
- 动态替换具名插槽的部分问题已确认，见 F09；依照当前静态插槽契约，避免承诺任意运行时替换。

### F02：JSX 调用表达式的编译边界（成员调用已修复；Call 返回值成员读取暂缓）

历史最小形式：`<div hidden={!items.some((item) => matches(item, state.query))} />`。compiler 4.2.0 原来把 `items.some` 当作普通成员值提取给 PathWatcher，再生成 `$arg(callback)`，丢失接收者，原生方法可能抛出 this 错误。

当前在相邻 Jinge/Compiler 已实现专用 MethodPathWatcher：非 deep 订阅接收者及方法属性，保存绑定对并用 Reflect.apply 调用。接收者替换但方法相同、方法单独替换、字符串、既有动态路径、可选调用均有回归。只在实际调用处绑定，单纯传递函数值不改变语义。消费项目用显式同步的本地构建验收，无 link。

`MemberCallProbe` 与 `test/framework/method-call.test.mjs` 验证普通数组 some、字符串 trim 以及显式参数/接收者更新，现已通过。原 hasMatches、pageSelectionFlag 等纯函数仍然成立，没有为修复而重写业务代码。

另一个独立问题仍暂缓：`checked={pageSelection().all}` 的 Call 返回值成员读取。即使将来支持语法，也不会自动追踪 pageSelection 内闭包读取的 state.rows；当前框架没有执行时依赖收集。依赖应像 `pageSelectionFlag(state.rows, state.selected, props.loading, props.rowSelection, 'all')` 一样显式传入。

完整四仓库验收与发布前提见相邻 jinge-compiler 的 docs/METHOD-CALLS.md；新 compiler 实际生成方法 watcher 时需要包含该 helper 的 runtime。F02 此项成功回归独立于其余 8 项框架真实失败。

### F03：hidden 的布尔属性语义（已修复）

修复前最小形式：`<section hidden={false}>content</section>`。hidden 走通用 setAttribute，false 被写成字符串 "false"，元素仍隐藏。

修复：在 jinge-compiler 的 IDL_ATTRIBUTE_SET 中加入 hidden，静态值和响应式更新均生成 element.hidden 赋值；浏览器负责添加/移除 attribute。aria-hidden 继续走字符串属性，不改变其 false 语义。无需 runtime 改动。

jinge-antd 的导航过滤、Card、Skeleton、Collapse、Tabs、Menu、Pagination 和日期格共 9 处绑定，已移除 true/undefined 兼容三元，直接使用布尔表达式；正常的 [hidden] CSS 规则保留。

本次仅做相关验证：compiler 2 项 Rust 与 2 项 JS 集成回归（先失败后通过），antd 7 项相关普通用例与 1 项文档导航筛选 e2e 通过；未扩散运行全量。消费项目已同步本地 compiler native 产物。

### F04：Transition 入场定时器前关闭遗留挂载（已在 Jinge 修复；消费版本待更新）

修复前：false → true 已挂载内容，但 10ms 入场定时器未运行就关闭。定时器被清除，状态仍为 Leaved，关闭分支不销毁内容；即使派发 transitionend 也无法清理。

最小修复：handleUpdate(false) 中若 state===Leaved、destroyAfterLeave 且 rootEl 存在，直接调用既有 destroyMount 并返回。保留状态和定时器设计，不新增入场/离场回调。

Jinge 新增两个回归先失败后通过，Transition/TransitionGroup 测试文件共 12 项通过。本项目原 test/framework/transition.test.mjs 使用新构建也通过。此次只做局部验收，未重跑其他框架探针或全量组件。

注意：源 Jinge 为 4.2.1，当前安装包为 4.2.0，同步脚本按版本检查拒绝覆盖。局部验证用 resolve hook 将该探针所有 jinge 导入统一指向相邻 dist/jinge.prod.js；未修改依赖版本。默认命令使用旧安装包时仍可复现，不能把旧包当作已带此修复。

Drawer/Modal/Floating 已评估：当前条件挂载与 CSS 入场动画本身简洁，没有额外 F04 补偿逻辑可删。切换 Transition 会改变关闭、焦点恢复、滚动锁及 afterClose 时序，且 motion=false/reduced-motion 需要完成机制。本轮保留当前实现，离场动画单独评估。

### F05：连续插槽回退表达式未按插槽编译（已修复）

最小形式：`<div>{props.children ?? props['slot:icon'] ?? 'fallback'}</div>`，见 `test/fixtures/components.tsx` 的 SlotFallbackProbe 与 `test/framework/slot-fallback.test.mjs`。

期望：有默认插槽时渲染它，否则尝试 icon，最后渲染文本。compiler 4.2.0 实际生成普通 TextNode 和 ExprWatcher，读取原始 children 属性（没有映射成 slot:default），也把 slot:icon 函数当作文本值传给 setTextContent。传入默认插槽和图标时，正文元素没有挂载。

修复：在 compiler 的插槽回退解析中，递归展开左侧同一 `??` 链；首项确认为插槽时，将 `(slotA ?? slotB) ?? fallback` 局部归一为 `slotA ?? (slotB ?? fallback)`，复用既有插槽分支编译。不改普通表达式编译，不跨越 `||`/`&&`，不改运行时。有插槽但渲染为空时仍选中它；普通值 `0`、`false`、空字符串不触发回退。此修复不涉及 F09 的动态插槽存在性订阅。

Avatar 的 children → icon → 首字母、Empty 的 description 插槽 → 文本 → 默认描述已恢复为连续 `??`。本地同版本 compiler 4.2.0 binding 已构建并同步到本项目安装目录，未修改依赖版本。

局部验收：新增 F05 集成用例修复前 6 项失败；修复后插槽集成文件 37 项、Rust 插槽相关 7 项、antd 原 F05 探针及 Avatar/Empty 8 项组件测试全部通过。覆盖多级回退、左右括号、可选调用、插槽参数短路、空插槽、非空值与普通表达式响应式更新；Empty 另验证描述更新和空字符串。未运行全量框架集，下文各批失败数保留为历史记录。

### F06：JSX 的 HTML 类型缺少 inert（类型与编译已修复；Jinge 类型消费版本待更新）

最小形式：`<div inert={loading ? true : undefined}>content</div>`。当前安装的 Jinge 4.2.0 JSX 类型会产生 TS2322：`Property 'inert' does not exist on type DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>`。期望类型允许绑定现代 HTML 布尔属性 inert。

实际浏览器能正确处理 inert，并非 runtime 无法实现。Spin 通过公开 ref、watch、onMount，对自己拥有的正文 div 设置或移除 inert attribute；不用类型断言、私有宿主或框架补丁。普通测试验证属性生命周期，真实浏览器测试验证忙碌期间 Tab 跳过输入，停止后可重新聚焦且保留值。

已在相邻 Jinge 的 HTMLAttributes 补充 `inert?: boolean | undefined`，声明产物已重新生成。类型回归覆盖 true/false/undefined，并拒绝字符串。compiler 的 IDL_ATTRIBUTE_SET 同时加入 inert，静态与响应式绑定均直接赋值原生 property，避免 false 被写成仍会生效的 `inert="false"`。新增 2 项 Rust 编译测试和 2 项真实 Chrome 测试均先失败后通过，浏览器验证属性反射、false/undefined 清理及焦点禁用/恢复；jsdom 尚未实现 inert，未用模拟属性代替浏览器验证。未改运行时或 Spin 的实现。Jinge 源仓库 4.2.1 与本项目已安装 4.2.0 不同，未覆盖 Jinge 安装包或修改依赖版本；compiler 已同步同版本本地 binding。此条不增加独立失败探针。

### F07：autoComplete 被写为错误大小写的 DOM property（已修复）

最小形式：`<input autoComplete={props.autoComplete} />`，传入 username。见 `NativeAutocompleteProbe` 与 `test/framework/autocomplete.test.mjs`。compiler 4.2.0 生成对 `element.autoComplete` 的赋值，浏览器原生 property 则是 `element.autocomplete`；结果只是同名 expando，真实 autocomplete attribute/property 仍为空。

修复：compiler 的 IDL_ATTRIBUTE_SET 改为 `Vec<(Atom, bool)>`，bool 仅表示生成原生 DOM property 名时是否转为 ASCII 全小写，不表示值类型。查找仍按 JSX 原始名；autoComplete/autoFocus/autoPlay 标记 true，readOnly 及其余属性标记 false。静态初始化与响应式绑定共用 get_idl_attribute_name，避免驼峰同名 expando，保留 select.multiple 初始化时序及 hidden/inert 的布尔反射。

Input、TextArea、Password、InputNumber 删除手动 autocomplete 同步函数与订阅，改用 `autoComplete={value ?? ''}`。未指定或清除时恢复原生空字符串默认值，attribute 为 `autocomplete=""`，避免把 undefined 直接赋给字符串 property 变成文本；自动填充策略仍由浏览器决定。

局部验收：原 F07 探针及新增 2 项集成用例先失败后通过；相关 Rust 10 项、DOM 路径集成 18 项、Chrome IDL/inert 3 项、antd F07 与输入组件 31 项全部通过。覆盖静态/响应式大小写、readOnly 保留大小写、布尔反射、无 expando，以及四类输入组件的更新、清除和节点保留。已同步同版本本地 compiler binding，未修改依赖版本，未跑全量框架集；后文各批失败数保留为历史记录。

### F08：静态传递 VM 对象时，子组件完整属性路径无法订阅内部变化（已复现）

最小形式：父组件 `<Child config={props} />`，子组件 `<input disabled={props.config.disabled} />`。见 `NestedInputConfigParent/NestedInputConfigProbe` 与 `test/framework/nested-props.test.mjs`。父 props 为 VM，disabled 从 false 改为 true；期望原生 input 禁用，实际仍为 false。

compiler 4.2.0 将父组件传给 Child 的 attrs 生成为普通对象 `{ config: props }`，没有包裹 VM；子组件 JSX 对该非 VM 根执行 PathWatcher/watchPathForRender，不会订阅内部 config VM 的变化。原 VM 本身仍可被正常监听。

处理：内部 TextField 明确接收稳定配置 VM，捕获这个对象引用 `const config = props.config`，JSX 读取 `config.disabled`；这是使用原 VM，而非缓存 disabled 等标量。普通测试验证 value/disabled/可见性等更新。compiler 的通用“局部变量保存可变读取”诊断会对此给出警告，但捕获对象引用在当前固定内部契约下保留响应式；完整路径反而不能工作。此内部配置对象不支持运行中整体替换，不给业务新增该限制。没有使用私有 API 或强制重绘。

运行 `pnpm test:framework` 共 7 项真实失败：F04、F05、F07、F08、F09、F11、F12。待框架讨论修正嵌套 VM 属性的订阅根选择或父级 props 的生成策略；F06 仍是独立的类型缺口。

### F09：插槽回退按初始化存在性选分支，之后新增插槽不切换（已复现）

最小形式：`<div>{props.option['slot:label'] ?? props.option.label}</div>`。见 `DynamicOptionSlotProbe` 与 `test/framework/dynamic-slot.test.mjs`：初始 option 只有 label；之后替换成同一业务选项的 label + slot:label。期望渲染新插槽，实际只更新原文本，插槽节点没有挂载。

compiler 4.2.0 把这种回退编译为挂载时检查 slot 的普通 JS 条件分支，而不是响应式 If；显式的 `slot ? slot : <span>label</span>` 在本轮尝试中也被优化为相同的静态分支。此问题只有两个操作数，不是 F05 的连续 ?? 识别问题。原最小探针保留正确行为断言，实际失败。

处理：Select/AutoComplete 首轮不用每条 option 上运行中新增/替换的插槽函数，提供组件级稳定 `slot:option` / `slot:selection` 并向它传递响应式 option 数据；实际测试覆盖远程选项未加载 → 标签解析和数据更新。label 是独立必需文本，用于搜索、名称及默认显示。没有重建整个列表、额外维护插槽存在标记、解析 DOM 或修改框架。

暂缓：任意选项的插槽函数在实例存活期间新增/删除/替换。后续框架可讨论插槽条件的响应式分支与旧插槽生命周期管理。插槽函数参数沿用 compiler 的单个标识符写法（如 slot.option.label），不解构参数。

`pnpm test:framework` 当前共 7 项实际失败：F04、F05、F07、F08、F09、F11，不计入原 R01–R19 和正常组件集合。F06 仍只记录类型缺口。

### F10：组件 WithExpose 的 ref 类型不允许公开运行时支持的回调形式（类型已修复；消费版本待更新）

最小形式：`<Input ref={(handle) => { handle.focus(); }} />`。当前 Jinge 4.2.0 的 `WithExpose<T>` 只声明 `ref?: Ref<T>`，TypeScript 报 TS2559：回调函数与 `Ref<InputHandle>` 没有公共属性。公开 `setRefForComponent` 的声明和运行时实现则接受 `Ref<T> | RefFn<T>`，两者不一致。

这不是 Form 无法实现焦点。首轮 FormField 通过明确传给控件的 id 建立 label/error/help 关系并聚焦真正的原生目标；需要自定义组件时，可以使用正常的 `ref<typeof Input>()`，再向 FormField 传 `focus={() => input.value?.focus()}`。现已提供稳定的 `field.ref` 回调，接收具有 focus() 方法的组件实例或原生元素，并在控件卸载时清除目标。聚焦顺序为显式 focus → 注册实例 → 既有 id 回退；Controller 切换 name/control 时保留仍挂载的实例并重绑字段。没有把函数强转为 ref 对象，也不枚举/克隆 children 或解析组件内部 DOM。Form、Cascader、Upload 站点示例已接入；Form/Controller 相关普通测试 20 项、表单 Chrome 8 项、站点 4 项，以及源码/测试类型检查、局部 lint 全部通过。

已在相邻 Jinge 源仓库将 WithExpose.ref 补齐为 `Ref<T> | RefFn<T>`，RefFn 参数改为 `T | undefined`，与挂载时传实例、所属组件卸载时传 undefined 的既有运行时行为一致。RefValue 同时支持从回调提取实例类型，保留 `ref<typeof Child>()`、`expose<typeof Child>()` 及 BootstrapReturn 的推导；回调需用 `handle?.focus()` 等方式处理卸载空值。

局部验收：新增类型用例先确认失败，修复后完整类型检查与相关 17 项测试通过，覆盖对象/回调 ref、回调参数推导、错误 API 与漏处理 undefined 的反例，以及组件公开实例的挂载和卸载一次性清理。声明产物已重新生成，未改编译器或运行时实现，未跑全量测试。Jinge 源仓库为 4.2.1，本项目安装包仍为 4.2.0。Form 接入时将新构建的 types/core/ref.d.ts 与 types/jsx/index.d.ts 原子复制到本地安装目录（来源记录在 test/.results/form-ref-local-types.json），未替换运行时或修改包版本；重新安装依赖后需重新接入或升级到包含 F10 的正式版本。

### F11：For 声明的 isFirst/isLast 在运行时缺失（已删除类型声明）

最小形式：`<For loop={props.items}>{each => <span data-first={each.isFirst} data-last={each.isLast}>{each.data}</span>}</For>`。当前 Jinge 4.2.0 的 ForSlot 类型包含 data/index/isFirst/isLast，但实际插槽数据没有提供两个边界标记。`test/framework/for-boundary.test.mjs` 用两个元素断言首尾 true/false，首个 data-first 实际为 null，保留正确行为断言并真实失败。

影响：面包屑末项/分隔符和其他列表边界语义。处理：Breadcrumb 直接使用 `each.index === props.items.length - 1` 及对应的非末项判断；这是普通列表索引计算，不读取私有状态或重建节点。测试覆盖唯一 aria-current、分隔符、重排及原生链接，功能没有因此暂缓。

处理决定：删除 Jinge `ForSlot` 中的 `isFirst`/`isLast`，只声明运行时提供的 data/index，不新增运行时标记。业务使用 `.map((item, index) => ...)`，通过 `index === 0` 和 `index === items.length - 1` 自行判断。原 F11 探针已迁移为该写法，初始首尾及追加、反转、删除到单项后的边界均通过；类型回归确认两个旧字段不可读取。类型声明产物已重新生成，消费版本情况同 F06。未重跑全量框架集，其他章节的失败数量为历史记录。

### F12：响应式对象字面量中的回调参数被错误提升（已在编译器局部修复；消费版本待更新）

影响：Table 的内联 rowSelection 配置，也可能影响其他同时含响应式字段和普通函数的对象 prop。最小形式见 `ReactiveObjectCallbackProbe`：

```tsx
function Parent(props: { active: boolean }) {
  return <Child config={{ active: props.active, test: (item) => item.id === 1 }} />;
}
```

期望：`item` 只在 test 回调内解析，挂载后 test({id:1}) 返回 true。实际 compiler 4.2.0 把 `item.id` 提升为父表达式的 PathWatcher 依赖，在 Parent 挂载时就访问不存在的 item，报 `ReferenceError: item is not defined`。Table 实际场景的 `getDisabled: (row) => row.id === 2` 先报 `row is not defined`；嵌套事件回调中的方法调用也可能受到 F02 的 receiver 提取影响。

独立测试 `test/framework/object-callback.test.mjs` 通过真实 compiler/runtime 执行，保留 doesNotThrow 及 matched 文本的正确行为断言，已确认真实失败；未用“期望抛错”伪装为通过。

处理：配置先声明为独立、稳定的 VM，普通函数在正常 JS 作用域中定义，再传 `<Table rowSelection={selection} />`；选中键直接属于该 VM，示例和普通/浏览器测试验证父级接受、拒绝和外部更新。内部也直接订阅稳定的配置 VM，覆盖 F08 的静态父 props 透传情况，不强制重建整表、不使用私有 API。

S01 修复：ExprVisitor 与 MemberExprReplaceVisitor 使用一致的函数边界，不把普通函数/箭头函数的参数默认值和函数体依赖提升到外层；getter/setter 仅保留属性计算键的外层求值。回调自身的参数、局部绑定、接收者及闭包读取保留原语义。函数内部读取仍不隐式驱动外层重算，未新增 deep 监听。原 F12/F14 探针经临时 Node resolve hook 指向相邻 compiler 的最新构建，共 2 项通过；未覆盖本项目安装包，默认命令重新构建前需接入该版本。Table 现有稳定 VM 配置无需改变。S02/S03/S08 的较大调整仍待确认，见相邻 compiler 的 docs/SCOPE-REVIEW-2026-11-05.md。

当前独立框架集共 7 项实际失败：F04/F05/F07/F08/F09/F11/F12。F06/F10 仍是类型缺口，F02 额外记录编译表达式边界；正常组件测试与原 R01–R19 单独核验。

### F13：Temporal 被 VM 代理后原生方法失效（已在相邻 Jinge 修复）

影响：原生 Temporal 日期、时间值进入组件 props、状态、数组或 Form 后，若被普通对象代理，原生内部槽检查失败，`toString`/日期运算等方法不可用。

最小验证：`../jinge/test/vm/temporal.test.ts` 的 8 种原生实例、对象/数组、替换通知，以及缺失 Temporal/伪造 toStringTag 情况。旧实现 10 项中 9 失败、1 通过。用户已明确授权这一 VM 小范围调整。

修复仅扩展 `../jinge/src/vm/core.ts` 的 `isInnerObj` 构造器识别（17 行增加、1 行删除），与 Date 等原有内置值规则一致；构造器存在才比较，命名空间在使用时读取。不改 watcher、compiler、router。修复后 10 项通过，Jinge 全量 351 项通过。本项目 `unit/temporal.test.mjs` 验证实际安装产物的实例、方法及替换监听。

当前以显式复制相邻构建产物方式接入，没有 link；重新安装后需重新同步，正式发布需含修复的 Jinge 版本，详见 [TEMPORAL.md](./TEMPORAL.md)。此项已修复，不计入原 7 项开放框架失败探针。

### F14：TSX 普通数据回调返回 children 被误编译成插槽（已修复）

最小形式：`const config = { children: (node) => node.children }; const children = config.children(props.nodes[0]);`，随后显示 `children[0].label`。这是普通业务数组读取，期望返回原数组，不能作为 JNode/slot 回调编译。

复现：`DataChildrenProbe` 与 `test/framework/data-children.test.mjs`。compiler 4.2.0 将普通 getter 生成为带额外宿主参数的渲染函数，从 `node['slot:default']` 渲染插槽；正常调用没有宿主，抛出 `Cannot read properties of undefined (reading 'Symbol()')`。用例保留正确行为断言，当前实际失败。

修复：编译器不再把任意函数首参都当成组件 props。作用域预分析根据 JSX 返回、JSX 组件引用、bootstrap 调用及导出组件约定记录模板参数；只返回普通 node.children 的数据回调保持原函数。插槽识别同时保留 SWC resolver 的绑定 Id（含 SyntaxContext），而非仅比较参数名，因此组件首参改名仍可识别，同名遮蔽不冒充外层 props。显式 slot:* 回调继续按插槽编译。

边界：这是基于语法上下文与符号身份的判定，未引入完整 TS 类型推断；默认导出函数及大写命名导出仍按组件入口约定处理，不能仅凭任意函数的首参或 children 字段证明它是组件。Tree/Cascader 现有 `.ts` 数据模块职责清晰，保留该拆分，无需搬回 TSX。

原 F14 探针已用本地同版本 compiler binding 验证通过；新增普通数据回调的 8 个复现先失败后通过，并补充改名首参、同名遮蔽、函数别名、转发组件及导出/bootstrap 上下文的正向用例。编译器 Rust 149 项、相关集成 250 项（含 F14 的 22 项）、Chrome 2 项和 antd 原探针 1 项全部通过。未跑全量 antd 或其他仓库用例，其他章节失败数保留为历史记录。


### F15：JSX spread 仅支持整包透传（设计待讨论）

当前 `<Input {...bindings} />` 是把已有对象直接作为 attrs 传递，不是通用的属性合并。`{...field.controlProps}` 的成员表达式、spread 与 value/on:change 等普通属性混用，以及多个 spread 均不支持；DOM 元素也不支持 spread。

因此本轮先落地独立的 `field.ref`，暂不提供依赖混合 spread 的 controlProps 接口或示例。若扩展，需明确从左到右的覆盖规则、每个来源属性及来源对象替换的响应式、属性新增/删除、单次求值、最终 attrs 的稳定身份与卸载清理，以及 ref/key/插槽的特殊语义。普通 JS spread 只复制当前值，不能作为响应式合并实现。
