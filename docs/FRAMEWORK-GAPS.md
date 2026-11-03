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

### F03：部分 HTML 布尔属性未按 presence 语义处理（已复现）

最小形式：`<section hidden={false}>content</section>`。compiler 4.2.0 对 hidden 生成通用 setAttribute，runtime 把 false 写为字符串 "false"；浏览器仍将该元素隐藏。disabled/checked 等属性则使用专用 property 路径，行为不一致。

期望：HTML 布尔属性 false 应移除属性；aria-* 的 false 则应保留字符串 "false"。

处理：文档导航使用显式 `hidden={condition ? undefined : true}` 以控制属性存在性，这是正常 HTML attribute 绑定，不修改 runtime；若组件需要大量此类例外，将暂缓并讨论框架统一支持。

### F04：Transition 入场定时器执行前关闭，挂载内容可能遗留（已复现）

最小测试：`test/framework/transition.test.mjs`，通过实际 compiler/runtime 执行。使用 `Transition isEnter={state.open} destroyAfterLeave`：false → true，内容已挂载但进入动画的 10ms 定时器尚未运行时，再改为 false。此时 runtime 清掉定时器，而状态仍为 Leaved，关闭分支不会销毁已挂载节点；再派发 transitionend 也不会完成清理。

运行 `pnpm test:framework` 可复现，此条 1 项实际失败。框架探针独立于组件回归集，禁止用“断言旧错误行为”包装成通过；未修改 Jinge 或 Compiler。

本轮处理：Floating/Modal/Drawer 使用普通条件挂载与组件 onMount/onUnmount 管理内容和资源，保留 CSS 入场动画，关闭立即卸载。暂缓离场动画和旧 enterClass/leaveClass API，不复制或直接操作框架的 Transition 内部状态。

### F05：连续插槽回退表达式未按插槽编译（已复现）

最小形式：`<div>{props.children ?? props['slot:icon'] ?? 'fallback'}</div>`，见 `test/fixtures/components.tsx` 的 SlotFallbackProbe 与 `test/framework/slot-fallback.test.mjs`。

期望：有默认插槽时渲染它，否则尝试 icon，最后渲染文本。compiler 4.2.0 实际生成普通 TextNode 和 ExprWatcher，读取原始 children 属性（没有映射成 slot:default），也把 slot:icon 函数当作文本值传给 setTextContent。传入默认插槽和图标时，正文元素没有挂载。

处理：Avatar、Empty 使用显式条件分支，直接渲染选中的插槽；这是自然的插槽组合，不解析 DOM、不操作私有宿主，也没有修改 compiler。连续 ?? 写法的框架用例保留正确行为断言，当前实际失败，等待后续框架讨论。Empty 的同类问题还表明括号不能作为解决方案：格式化器会把同结合顺序的 ?? 合并，最终仍需明确表达“插槽或文本”的分支。

此前两项探针对应 F04、F05，后续另有 F07–F09/F11/F12；运行 `pnpm test:framework` 当前共 7 项真实失败，不计入正常组件集合和原 R01–R19。

### F06：JSX 的 HTML 类型缺少 inert（类型缺口，浏览器能力正常）

最小形式：`<div inert={loading ? true : undefined}>content</div>`。当前安装的 Jinge 4.2.0 JSX 类型会产生 TS2322：`Property 'inert' does not exist on type DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>`。期望类型允许绑定现代 HTML 布尔属性 inert。

实际浏览器能正确处理 inert，并非 runtime 无法实现。Spin 通过公开 ref、watch、onMount，对自己拥有的正文 div 设置或移除 inert attribute；不用类型断言、私有宿主或框架补丁。普通测试验证属性生命周期，真实浏览器测试验证忙碌期间 Tab 跳过输入，停止后可重新聚焦且保留值。

此条不增加运行时失败探针，不阻塞 Spin；框架后续可补齐 JSX 属性类型。F04/F05 的独立实际失败记录保留，后续增加 F07。

### F07：autoComplete 被写为错误大小写的 DOM property（已复现）

最小形式：`<input autoComplete={props.autoComplete} />`，传入 username。见 `NativeAutocompleteProbe` 与 `test/framework/autocomplete.test.mjs`。compiler 4.2.0 生成对 `element.autoComplete` 的赋值，浏览器原生 property 则是 `element.autocomplete`；结果只是同名 expando，真实 autocomplete attribute/property 仍为空。

期望：原生 autocomplete 属性与 property 都为 username；独立探针保留正确行为断言并确认失败。Input、TextArea、Password 和 InputNumber 通过公开 ref/onMount/watch 设置或移除 autocomplete attribute，正常测试同时验证原生 property；不修改 compiler、不访问私有宿主。自动填充策略仍由浏览器决定。

`pnpm test:framework` 当前共 7 项实际失败：F04、F05、F07、F08、F09、F11、F12。F06 仍仅为类型缺口，不增加运行时失败。

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

### F10：组件 WithExpose 的 ref 类型不允许公开运行时支持的回调形式（类型缺口）

最小形式：`<Input ref={(handle) => { handle.focus(); }} />`。当前 Jinge 4.2.0 的 `WithExpose<T>` 只声明 `ref?: Ref<T>`，TypeScript 报 TS2559：回调函数与 `Ref<InputHandle>` 没有公共属性。公开 `setRefForComponent` 的声明和运行时实现则接受 `Ref<T> | RefFn<T>`，两者不一致。

这不是 Form 无法实现焦点。首轮 FormField 通过明确传给控件的 id 建立 label/error/help 关系并聚焦真正的原生目标；需要自定义组件时，可以使用正常的 `ref<typeof Input>()`，再向 FormField 传 `focus={() => input.value?.focus()}`。没有把函数强转为 ref 对象，也不枚举/克隆 children 或解析组件内部 DOM。

后续框架可讨论统一 `WithExpose.ref` 与运行时 RefFn 的类型，同时明确回调的卸载语义。F10 与 F06 一样是类型缺口，不增加运行时失败探针；`pnpm test:framework` 当前为 F04/F05/F07/F08/F09/F11 共 7 项实际失败。本批次未修改 Jinge/Compiler。

### F11：For 声明的 isFirst/isLast 在运行时缺失（已复现）

最小形式：`<For loop={props.items}>{each => <span data-first={each.isFirst} data-last={each.isLast}>{each.data}</span>}</For>`。当前 Jinge 4.2.0 的 ForSlot 类型包含 data/index/isFirst/isLast，但实际插槽数据没有提供两个边界标记。`test/framework/for-boundary.test.mjs` 用两个元素断言首尾 true/false，首个 data-first 实际为 null，保留正确行为断言并真实失败。

影响：面包屑末项/分隔符和其他列表边界语义。处理：Breadcrumb 直接使用 `each.index === props.items.length - 1` 及对应的非末项判断；这是普通列表索引计算，不读取私有状态或重建节点。测试覆盖唯一 aria-current、分隔符、重排及原生链接，功能没有因此暂缓。

后续框架可补齐标记并验证增删/重排更新，或者修正类型契约。本批不修改 Jinge/Compiler。`pnpm test:framework` 现共 7 项真实失败：F04、F05、F07、F08、F09、F11；F06/F10 仍仅是类型缺口。

### F12：响应式对象字面量中的回调参数被错误提升（已复现）

影响：Table 的内联 rowSelection 配置，也可能影响其他同时含响应式字段和普通函数的对象 prop。最小形式见 `ReactiveObjectCallbackProbe`：

```tsx
function Parent(props: { active: boolean }) {
  return <Child config={{ active: props.active, test: (item) => item.id === 1 }} />;
}
```

期望：`item` 只在 test 回调内解析，挂载后 test({id:1}) 返回 true。实际 compiler 4.2.0 把 `item.id` 提升为父表达式的 PathWatcher 依赖，在 Parent 挂载时就访问不存在的 item，报 `ReferenceError: item is not defined`。Table 实际场景的 `getDisabled: (row) => row.id === 2` 先报 `row is not defined`；嵌套事件回调中的方法调用也可能受到 F02 的 receiver 提取影响。

独立测试 `test/framework/object-callback.test.mjs` 通过真实 compiler/runtime 执行，保留 doesNotThrow 及 matched 文本的正确行为断言，已确认真实失败；未用“期望抛错”伪装为通过。

处理：配置先声明为独立、稳定的 VM，普通函数在正常 JS 作用域中定义，再传 `<Table rowSelection={selection} />`；选中键直接属于该 VM，示例和普通/浏览器测试验证父级接受、拒绝和外部更新。内部也直接订阅稳定的配置 VM，覆盖 F08 的静态父 props 透传情况，不强制重建整表、不使用私有 API。

暂缓：含响应式字段且内嵌普通回调的任意内联对象表达式。讨论方向：compiler 分析对象表达式的依赖时应正确维护嵌套函数参数及局部绑定作用域，并在函数边界内保留接收者。没有修改 Jinge/Compiler。

当前独立框架集共 7 项实际失败：F04/F05/F07/F08/F09/F11/F12。F06/F10 仍是类型缺口，F02 额外记录编译表达式边界；正常组件测试与原 R01–R19 单独核验。

### F13：Temporal 被 VM 代理后原生方法失效（已在相邻 Jinge 修复）

影响：原生 Temporal 日期、时间值进入组件 props、状态、数组或 Form 后，若被普通对象代理，原生内部槽检查失败，`toString`/日期运算等方法不可用。

最小验证：`../jinge/test/vm/temporal.test.ts` 的 8 种原生实例、对象/数组、替换通知，以及缺失 Temporal/伪造 toStringTag 情况。旧实现 10 项中 9 失败、1 通过。用户已明确授权这一 VM 小范围调整。

修复仅扩展 `../jinge/src/vm/core.ts` 的 `isInnerObj` 构造器识别（17 行增加、1 行删除），与 Date 等原有内置值规则一致；构造器存在才比较，命名空间在使用时读取。不改 watcher、compiler、router。修复后 10 项通过，Jinge 全量 351 项通过。本项目 `unit/temporal.test.mjs` 验证实际安装产物的实例、方法及替换监听。

当前以显式复制相邻构建产物方式接入，没有 link；重新安装后需重新同步，正式发布需含修复的 Jinge 版本，详见 [TEMPORAL.md](./TEMPORAL.md)。此项已修复，不计入原 7 项开放框架失败探针。

### F14：TSX 普通数据回调返回 children 被误编译成插槽（已复现）

最小形式：`const config = { children: (node) => node.children }; const children = config.children(props.nodes[0]);`，随后显示 `children[0].label`。这是普通业务数组读取，期望返回原数组，不能作为 JNode/slot 回调编译。

复现：`DataChildrenProbe` 与 `test/framework/data-children.test.mjs`。compiler 4.2.0 将普通 getter 生成为带额外宿主参数的渲染函数，从 `node['slot:default']` 渲染插槽；正常调用没有宿主，抛出 `Cannot read properties of undefined (reading 'Symbol()')`。用例保留正确行为断言，当前实际失败。

本轮处理：Tree/Cascader 的数据遍历/加载缓存放到正常 `.ts` 数据模块，直接读取节点 children；TSX 负责展示已经计算的行/列。没有修改编译器、反射 children DOM、使用私有 API 或强制重挂载。该能力可以自然实现，不阻塞组件；普通 TSX 数据函数读取 children 的通用修正留待框架讨论。

当前独立框架探针共 8 项真实失败：F04/F05/F07/F08/F09/F11/F12/F14；此前各批的 7 项为历史基线。F13 已在相邻 Jinge 小范围修复，F06/F10 仍为类型缺口。组件测试和原 19 回归单独验收。
