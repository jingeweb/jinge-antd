# API 迁移记录

## 基础组件批次

- ButtonGroup.size：small/large 改为 sm/lg，中尺寸为 md；size 不再必填。
- Button：新增显式 md，默认 htmlType=button。提交/重置表单必须显式指定 htmlType=submit/reset。
- Button.ref 暴露 focus()/blur()，不是原生 DOM；不通过 ref 暴露内部宿主结构。
- 布局/排版使用具名导出：Row/Col、Layout/LayoutHeader/Sider/Content/LayoutFooter、Title/Text/Paragraph/Link，不使用 React 风格静态子组件属性。
- 新的 Link 为导航链接；Button type=link 仍保持原生按钮语义。
- 图标默认视为装饰元素；有独立语义的图标需传 ariaLabel。
- react/immutability 和 react/refs 两条 lint 规则不适用于 Jinge 的单次初始化 + 可变 VM/ref 模型，已在项目配置中关闭；其他 React JSX 检查和 correctness 检查保留。

## 测试基线

`test/regressions.json` 增加 open/fixed 状态。修复后保留原回归测试，将对应状态改为 fixed；普通 pnpm test 依然对任何实际失败返回非零。

`test:verify` 核验组件正常行为全部通过，并检查每条回归与登记状态一致。它不是“忽略缺陷”的发布门禁；最终全部组件完成后，完整 pnpm test 应全部通过。

## 遗留类型检查修正

- Menu 使用 Jinge 原生的 `key="value"` 属性路径形式，保持与 key={option.value} 相同的列表身份语义，避免 JSX key 属性对泛型 T 的错误约束；增加重排身份测试。
- Table.rowKey 收紧为 `Extract<keyof T, string>`。底层 For 的字段路径解析要求字符串，原类型允许的 number/symbol 字段名实际不能工作。普通字符串 id/name 字段不受影响。

## Floating / Tooltip / Popover / Popconfirm

- 沿用自实现定位与移植版 autoUpdate，不增加外部依赖。补齐 left placement、视口安全尺寸约束、client 坐标、安全通道、延迟取消、嵌套 Portal 与焦点处理。
- Floating 新增 defaultOpen/disabled/padding/role/ariaLabel/autoFocus/returnFocus/keyboard/motion；所有方位 offset 默认统一为 10，padding 默认为 8。openChange 在非受控模式下也会通知。
- triggerMethod 增加 focus 和组合数组；click 现在支持再次点击关闭。默认 Tooltip 为 [hover, focus]、hover 延迟 300/100ms；focus 立即打开。
- Floating id 初始化后固定；触发插槽要求稳定 HTMLElement 根。aria 关系自动管理，卸载时清理。
- 旧 enterClass/enterActiveClass/leaveClass/leaveActiveClass 移除。由于 F04，当前仅 CSS 入场动画，关闭立即卸载，不依赖 transitionend。需要离场动画的能力留待框架讨论。
- Popconfirm 新增 open/defaultOpen/disabled/on:openChange/on:error；异步确认期间去重并禁止按钮与 Escape 关闭。false 或错误保留浮层，清理 loading；content 插槽优先于字符串。
- ConfirmContext 统一捕获同步/异步异常；宿主卸载后忽略 UI 完成回调，保留用户业务 Promise 自身的行为。

## Modal / Drawer

- Modal/Drawer 都通过 Portal 挂载到 body。Modal 保留默认打开的旧契约，可用 defaultOpen=false；Drawer 默认关闭。open 在初始化时决定是否受控，受控方需要写回 on:openChange 请求。
- 新增 ModalProps、DrawerProps、DrawerPlacement 导出；Modal 的 size=sm/md/lg 对应 360/520/800px，width 优先。Drawer 的 size 对应 256/378/736px，上下方向使用 height。所有尺寸受视口约束。
- 多层使用每次显示时分配的固定层级；Tooltip/Popover/Dropdown 从所在窗口 context 获取层级，不再取全局最高窗口作为归属。背景 inert、body overflow/padding 与焦点监听随活动窗口数清理，允许乱序销毁。
- footer=false 隐藏整块页脚；slot:footer 替换默认页脚。Drawer 没有默认页脚和确认流程，业务自行组合提交操作。
- 默认自动聚焦正文中的首个可聚焦元素，Tab 在窗口及其子浮层 Portal 中循环，关闭后恢复焦点。Escape 仅由最上层消费；showMask=false 仍保持模态的背景禁用、焦点和滚动锁。
- Modal 的 cancel 统一覆盖取消按钮、关闭按钮、允许的 Escape 与遮罩点击，并使用 cancelValue。ref.close(result) 是外部主动结束，不触发 cancel；提交期间用户关闭入口禁用，但外部 open/close 仍可结束。
- 确认返回 false、抛错或 Promise 拒绝保持打开；新增 on:error。关闭会使正在等待的 UI 确认事务过期，重新打开可立即开始新事务；旧结果不会影响新窗口。Popconfirm 同步采用此策略，业务 Promise 自身的副作用仍由业务负责。
- 关闭立即销毁内部内容。afterClose 在 DOM 移除、滚动/焦点清理后的 microtask 通知，不等待离场动画；owner 卸载不触发。需要保留的表单状态放到父级 VM。
- modal.show 接收 footer/slot:footer、size/width、keyboard、确认回调等配置。waitForClose 始终返回同一个 Promise，关闭后仍可读取结果；清理完成后兑现并移除 helper 挂载点。独立 bootstrap 根不继承调用方 context。
- Modal 保留淡入，Drawer 提供四向滑入，均尊重 reduced-motion；离场动画继续因 F04 暂缓。自定义挂载容器、保留关闭内容、第三方 Portal 自动归属、拖拽缩放和抽屉推挤不在首轮范围。

能力参考：[Ant Design Modal](https://ant.design/components/modal/)、[Ant Design Drawer](https://ant.design/components/drawer/)、[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)。按 Jinge 的公开 context/slot/ref/lifecycle 实现，没有引入新依赖。

## Message / Notification

- Message 保留 success/error/info/warning/loading 与 show(type, options)、实例 close/update/waitClose。duration 仍为毫秒，默认 4000；Notification 默认 4500。0、负数及非有限值保持显示。
- clear 现在真正结束所有现有条目的生命周期，取消定时器、调用一次 on:close 并完成等待。close 同步幂等；update 不能复活已关闭实例。waitClose 始终返回同一个 Promise，表示关闭状态，DOM 随响应式渲染清理。
- on:close 抛错记录到 console.error，不阻止 Promise 结束或其他条目关闭；clear 使用快照，回调中新建的条目保留。
- Message 支持 content 插槽、className/style、closable、pauseOnHover。配置即时影响现有容器；默认 paddingTop=16、paddingLeft/right=0、maxCount=5。超限条目按创建顺序关闭，非正或非有限上限表示不限制。
- Notification 新增 open/五种状态、config、clear；四角位置，标题/正文/图标/操作插槽。默认 closable=true、pauseOnHover=true；内容内焦点也暂停。update(duration) 重新计时，暂停时更新会在恢复后使用新时间。
- 所有提示不主动抢焦点；错误为 alert，其他状态为 status。容器跟随最高活动窗口层级，但不加入模态焦点范围；有模态窗口时通知仍可读屏，键盘操作应在关闭模态窗口后进行。
- 空容器自动销毁并释放层级订阅，再次 show 会重新创建。提示服务属于独立根，应用/示例卸载时应关闭自己创建的实例。
- 创建时的 slot:content/title/icon/actions 固定；update 仅支持文本、状态、样式、计时与关闭策略。插槽替换、key 去重、复杂堆叠、跨页面队列未纳入首轮。

能力参考：[Ant Design Message](https://ant.design/components/message/)、[Ant Design Notification](https://ant.design/components/notification/)。未新增依赖。

## Avatar / Badge / Tag

- Avatar 从空壳补齐图片、srcSet、失败回退、换源重试、文字/图标插槽、形状与可访问名称。size 从 small/large 改为 sm/md/lg（24/32/40px），也可传正数像素。外层为 role=img，内部图片使用空 alt 避免重复朗读；alt/ariaLabel 定义整体名称。
- Avatar 优先图片，其次默认文字插槽、icon 插槽，最后 alt 首字符或 ?。不自动缩字，长内容裁切；连续 ?? 混合插槽的 compiler 问题已记录为 F05，组件采用显式条件分支。
- 新增 Badge、BadgeProps、BadgeStatus。数字规范为非负整数，超过 overflowCount 显示上限+，ARIA/title 保留完整数量；字符串是普通标签，0 默认隐藏。支持 showZero、dot、五种状态、说明、尺寸、偏移与 CSS 颜色。子内容不会被克隆或注入属性。
- Tag 根元素由 div 改为行内 span，保留原有三种语义色，新增 default/warning、bordered、icon、关闭/禁用及 visible/defaultVisible。
- Tag 的 on:close 可以 preventDefault；关闭按钮有键盘语义并停止冒泡。非受控关闭会卸载，受控方通过 on:visibleChange 写回 visible，可随后恢复显示。没有离场动画、可选标签组或拖拽。

能力参考：[Ant Design Avatar](https://ant.design/components/avatar/)、[Badge](https://ant.design/components/badge/)、[Tag](https://ant.design/components/tag/)。未新增依赖。

## Card / Collapse / Descriptions / Empty

- Card 新增具名导出与 CardProps。title/slot:title、extra/cover/actions 插槽分别承担标题、标题旁操作、封面和底部操作；默认正文可省略。loading 隐藏正文并展示占位，正文仍保持挂载以保留输入状态，初始化时业务需允许空数据。标题和其他操作区不自动禁用。
- Collapse 采用 items 数组和字符串 key，label/slot:label、content/slot:content、slot:extra 为每项内容契约。activeKeys/defaultActiveKeys 始终为数组，on:change 通知完整下一状态；受控方需写回，原地更新受控数组也会响应。过滤重复/不存在的 key，手风琴取首个有效 key，不隐式展开其他项。
- Collapse 首次展开才挂载正文，默认折叠后用 hidden 保留，destroyOnHidden=true 时销毁。禁用只作用于触发器，不强制关闭面板或禁用独立附加操作。Enter/Space 切换，上下键、Home/End 导航同级可用项，原生 ARIA 关联自动管理。没有折叠动画。
- Descriptions 使用 dl/dt/dd，不伪装成可编辑表格。items 的 key 保持字段身份，label 与 content 支持文字/插槽；0 不会丢失，null/undefined 使用 emptyText，空字符串保留。响应式 column 可用数字或六档断点对象，列数限制 1–6；span 超过列数限制为整行，filled 始终占满，不自动填充上一行余量。
- Descriptions 的水平/垂直方向只改变字段内部标签和值的排列；bordered、colon、size 与标题/extra 可组合。按视口使用 CSS 响应式，不引入布局观察或动态重挂载。
- Empty 默认使用装饰性内置 SVG 和“暂无数据”；image/description=false 隐藏整块区域，包括对应插槽。图片 URL 失败回退到内置插图，换源后重试；children 为独立操作区。announce 默认关闭，需要异步结果播报时显式开启 status 语义。
- 上述组件均使用已有公开 slot/For/lifecycle API；插槽遵循创建时静态契约，文本和数据路径可响应式更新。不提供 Card.Grid/内置 Tabs、复杂行合并、折叠动画或外部插画依赖。

能力参考：[Ant Design Card](https://ant.design/components/card/)、[Collapse](https://ant.design/components/collapse/)、[Descriptions](https://ant.design/components/descriptions/)、[Empty](https://ant.design/components/empty/)。未新增依赖或修改框架。

## Alert / Spin / Skeleton / Progress / Result

- Alert 新增四种状态、标题/说明/图标/操作插槽、banner、可关闭与 visible/defaultVisible。默认显示图标；error 为 alert，其他为 status，静态提示可显式 role=none。on:close 可 preventDefault，关闭按钮停止冒泡；非受控关闭幂等，受控方需写回 on:visibleChange。
- Spin 保留 sm/md/lg 与根 ja-spin 类，新增 spinning（默认 true）、毫秒 delay、tip/indicator 插槽、ariaLabel 和包裹正文。四点动画移到 ja-spin-dots，旧 `.ja-spin > i` 应改用 `.ja-spin-dots > i`；根容器负责布局，动画只作用于指示器。
- Spin 正文始终挂载以保留状态。忙碌开始即设置 aria-busy 和正文 inert，视觉指示器按 delay 延后；停止、延迟变化和卸载会取消待执行计时器，不取消业务请求。通过公开 ref 管理 inert，因当前 JSX 类型缺少该属性而记录为 F06；未断言或修改框架类型。停止后不主动抓取焦点。
- Skeleton 默认 loading=true、title=true、rows=3、avatar=false、active=false。首次完成前不挂载正文，首次完成后保留正文，后续加载用 hidden 隐藏。rows 限制 0–20；标题、行宽、头像尺寸/形状可配置。SkeletonBlock 提供普通/圆角/圆形占位，默认装饰性隐藏，指定 ariaLabel 时独立成为 status。
- Progress 支持 line/circle、0–100 的有限百分比（两位精度）、sm/md/lg、颜色/线宽、showInfo、format 和接收 ProgressInfo 的 info 插槽。未指定 status 时 100 自动成功，显式状态优先；完成与异常的默认视觉说明包含符号，aria-valuetext 包含中文状态，不仅依赖颜色。
- Progress 的圆形宽度受父容器约束，width 限制 48–512px；strokeWidth 限制 1–20，线形单位为 px、圆形为 SVG viewBox 单位。0 时隐藏圆形前景路径，避免 round linecap 留下假进度点。format 为纯函数；定制 info 插槽可用 valueText 单独提供可访问说明。不提供仪表盘、分段、渐变或进度模拟。
- Result 提供 success/info/warning/error 和字符串 403/404/500；标题/说明有状态默认值，支持对应插槽、自定义图标、extra 操作及 children 详情。默认命名 section，标题文字为 h2；不抢焦点或默认播报，可用 announce 开启 status。显式空标题/说明可隐藏文本，隐藏标题时可设置 ariaLabel。
- 所有新动效都尊重 reduced-motion。关闭立即卸载，不新增离场动画、ErrorBoundary、全屏加载服务、路由或图形依赖；重试/导航由业务操作明确处理。

能力参考：[Ant Design Alert](https://ant.design/components/alert/)、[Spin](https://ant.design/components/spin/)、[Skeleton](https://ant.design/components/skeleton/)、[Progress](https://ant.design/components/progress/)、[Result](https://ant.design/components/result/)。未新增依赖或修改框架。

## Input / TextArea / Password / InputNumber

- 新增具名 TextArea、Password、InputProps/TextAreaProps/PasswordProps/InputNumberProps 与公开 handle 类型；不使用 Input.TextArea 等静态子组件。
- 初始化 value 非 undefined 为受控，null 表示显式受控空值；否则 defaultValue 初始化，后续不切换控制模式。需要初始空值受控的表单字段请传 null。
- 文本 change 返回 string，清空为 ''。IME 中间输入只触发 input，compositionend 才触发一次 change；输入法 Enter 不触发 pressEnter。受控文本未被父级接受的草稿在下一显示帧回到 value。
- InputNumber.change 由 number 扩为 number | undefined，清空为 undefined，修复 R12。原来假定始终 number 的业务需要处理未填写；不再用 Number('') 得到 0。坏输入草稿（如未完成负号）不会当作清空提交。
- 数值编辑草稿可暂时超出范围；失焦、Enter、步进时归一化精度和边界，受控提交仍由父级 value 决定。外部 value/range 更新不触发 change、不静默裁剪。原生 type=number 和 min/max/step 保留，表单原生校验仍可能报告步长不匹配；step 不会把手工输入吸附到网格。
- 新增默认数值、0–15 位 precision、普通小数步进、键盘开关、可隐藏步进按钮、只读与原生表单/ARIA 属性。超出 JS number 安全精度的 stringMode 与 formatter/parser 暂缓。
- 所有输入的 className/style 现在作用于稳定外框 span；原生控件保留 ja-input，id/name/form/ARIA 及 ref 方法指向原生控件。InputWrapper/InputAddon 可继续组合。装饰/计数/清空/密码切换不会重建原生输入。
- 事件使用原生 Event/FocusEvent/KeyboardEvent/MouseEvent，修正原 blur 误用 ClipboardEvent 的类型。Controller 的 input/blur 类型同步修正，本批次未改变其字段注册或校验行为。
- form.reset 恢复非受控初值、保留受控父值，不触发 change。ref 提供 focus/blur/select，TextArea 额外提供 resize；number 的原生选区受浏览器限制。TextArea autoSize 跟随内容和宽度测量，并清理 ResizeObserver；密码切换保留文本和选区，不触发文本 change。
- autoComplete 的 compiler 大小写问题记录为 F07，组件用公开 DOM attribute API 同步原生 autocomplete。内部 TextField 捕获稳定配置 VM 以规避 F08 的嵌套属性订阅问题，详见 FRAMEWORK-GAPS.md；没有新增外部依赖或修改 Jinge/Compiler。

能力取舍参考：[Ant Design Input](https://ant.design/components/input/)、[Ant Design InputNumber](https://ant.design/components/input-number/)。只实现常用业务范围，保留 Jinge 事件/插槽/ref 方式。

## Checkbox / Radio / Switch

- 新增具名 Checkbox/CheckboxGroup、Radio/RadioGroup、Switch 以及对应 Props 类型；共享 CheckableHandle，提供 focus/blur。没有静态 Checkbox.Group/Radio.Group 别名。
- 单项使用 checked/defaultChecked 布尔值，on:change(checked, Event)；value 仅为原生表单提交值，默认 on。初始化 checked 非 undefined 为受控，之后模式固定。Controller 的布尔字段需绑定 checked={field.value ?? false}，不能把布尔状态传给 value。
- CheckboxGroup 使用 value/defaultValue 数组；RadioGroup 使用单值，change 类型为 T | undefined。组的 value=null 表示受控空选择；空数组、数字 0、空字符串都是有效值。选项值限定 string/number，按唯一 value 保持节点身份。
- 分组通过 options 配置 label/slot:label、value、disabled/id，不枚举或克隆任意 children。Checkbox 全选/半选由业务推导，树形级联规则不内置。
- Checkbox.indeterminate 设置原生 indeterminate 和 aria-checked=mixed，仅改变视觉和语义，不改变 checked/提交值。该状态由父级显式清除。
- Radio 使用原生互斥和方向键，RadioGroup 提供 fieldset/legend、radiogroup 语义和 default/button 外观；未传 name 时生成每实例独立名称，该名称也可能出现在 FormData，业务表单应显式设置 name。相关受控选择建议放在 RadioGroup 统一管理，以完整恢复被父级拒绝的选择。
- 分组默认值被快照；无效/已移除值归一化显示但不触发 change，清空后不会自动选中第一项。受控的原始 value 未被组件改写，选项重新加入时可重新显示；非受控已移除值不保留。
- 原生 id/name/form/required/disabled/ARIA 按组件开放，未选或禁用项不提交；数字原生提交为字符串。form.reset 恢复非受控初值，受控保留父值，不触发 change；取消的 reset 不改变选择。样式作用于 label/fieldset，焦点指向真实 input。
- Switch 使用真实 checkbox input 和 role=switch，支持 Space/Enter、加载/禁用、开关文案和尺寸；Enter 不提交表单。loading 设置原生 disabled 和 aria-busy，期间不会提交该字段。状态文案为装饰，label/ariaLabel 提供稳定名称。示例中的异步保存计时器在卸载时清理。
- 受控请求在下一显示帧核对父值，恢复原生自动切换的 checked；监听、重置帧和任务随卸载清理。全部使用公开 lifecycle/ref/DOM API，没有新增依赖或修改 Jinge/Compiler。

能力取舍参考：[Ant Design Checkbox](https://ant.design/components/checkbox/)、[Radio](https://ant.design/components/radio/)、[Switch](https://ant.design/components/switch/)。保留常用业务能力与原生键盘/表单行为。

## Select / AutoComplete

- Select 改为 combobox/listbox，不再通过 Dropdown/Menu 代理选择。Dropdown/Menu 本身没有在本批升级；旧 Select 的 option 按钮改为 role=option，键盘焦点留在 combobox，由 aria-activedescendant 指向高亮项。Floating 新增 ariaMultiselectable 透传给 listbox。
- SelectOption<T> 的 value 收紧到 string/number，label 必须是纯文本，支持 disabled/group。旧 MenuOption 的逐项 slot:label/slot:icon 改为组件级 slot:option；已选展示用 slot:selection。F09 使逐项运行中新增/替换插槽暂缓，稳定的组件级插槽仍可响应 option 数据更新。搜索单选的已选文案使用 label，selection 插槽用于非搜索单选和多选标签。
- 单选仍默认 mode=single，清空回传 undefined；新增 mode=multiple，value/defaultValue 和 change 为去重数组，清空 []。on:change 增加原生 Event 参数。初始化 value 非 undefined 为受控，null 为显式空受控值，之后模式固定；初始多选默认数组被快照。
- mode/showSearch 初始化后不变；单选默认不搜索，多选默认搜索。showSearch=false 的选择器支持前缀查找，ArrowUp/Down、非编辑模式 Home/End、Enter/Space、Escape/Tab；编辑输入保留 Home/End 的文本编辑。多选空查询 Backspace 删除末项，maxTagCount 只折叠展示。
- allowClear/clearLabel、loading/emptyText/loadingText、filterOption/on:search、open/defaultOpen/openChange、popupWidth/popupClassName、尺寸/状态/样式/ARIA/ref.focus/blur 已补齐。过滤默认忽略大小写匹配 label/value，filterOption=false 用于业务远程结果。加载期间不选择旧建议，组内禁用项跳过导航和选择。
- 外部 value 暂时没有对应选项时保留值并展示字符串，options 更新后解析标签，不触发 change。className/style 现在作用于稳定外框，triggerClassName 作用于实际输入/按钮，popupClassName 作用于浮层；不再把 Select.className 当 Dropdown 样式入口。
- Select 的 name/form 生成原生 hidden 提交项：单选空值为 ''，多选按同名字段重复提交，数值转字符串。required 由独立、非 Tab 目标的原生 select 校验，invalid 时聚焦可见 combobox 并标记错误；无效校验不会提交表单。reset 恢复非受控初值、保留受控父值，不触发 change；公开焦点方法仍只作用于可见 combobox。
- 新增 AutoComplete、AutoCompleteProps/Option/Handle：自由文本 string，value/defaultValue/on:change 与 Input 一致，清空为 ''。可选择建议但不要求匹配，建议提交 option.value，额外通知 on:select；on:search 只由编辑/IME 提交/清空触发。支持原生 name/form/required/长度/只读/自动填充和 focus/blur/select。
- AutoComplete 的 Space/Home/End 保留文本编辑行为，Arrow 导航、Enter 采用建议、Escape/Tab 保留文本并关闭；IME Enter 不选择建议，compositionend 提交一次并对尾随 input 去重。未展开建议时 Enter 保留原生表单行为；pressEnter 回调可查看 defaultPrevented。
- 两者复用现有 Floating 定位、宽度/滚动/尺寸跟随和嵌套上下文。验证了 Modal 内 Escape 只关闭选择浮层，长列表键盘导航会滚动高亮项到可见区。监听、Observer、帧任务和表单重置监听随卸载清理；示例异步计时器也清理。
- 虚拟化、大数据算法、tags 自动创建、运行中插槽函数替换、自定义任意输入组件与内置请求/过期结果管理暂缓。业务接入远程搜索时负责取消旧请求或忽略过期结果。没有新增依赖或修改 Jinge/Compiler。

参考：[Ant Design Select](https://ant.design/components/select/)、[AutoComplete](https://ant.design/components/auto-complete/)、[WAI-ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)。R09/R17 保留原正确行为断言，旧浏览器选择测试仅将菜单按钮定位更新为 option 语义；站点待实现页面的路由测试改用仍待实施的 Form。

## Form / FormField / Controller

- 新增 Form、FormField、FormHandle、FormFieldProps、ControllerProps/FormFieldValue 等具名导出；继续保留 useForm、formState、formErrors、control、validate/validateField/setField。单个 Form 绑定稳定实例，卸载取消 UI 校验/提交事务并保留草稿；实例可用于后续重开。
- useForm 的类型改为 schema 的 input/output 分离：草稿和 setter 使用 `Partial<z.input<S>>`，validate/submit 成功返回 `z.output<S>`。支持对象输入和对象输出的 Zod schema；required 字段在编辑时也允许暂存 undefined。类型夹具验证 string → number 的转换不改变 setter 的输入类型。
- R05：字段校验不再 schema.pick，改为完整 schema 对数据快照执行 safeParseAsync，再按目标顶层路径提取错误；保留对象 refine/superRefine。嵌套错误归到第一段字段路径，根级错误放 status.formError，多个同字段错误保留第一条。
- R06：每次验证有请求序号、输入版本和快照核对；字段编辑、reset、setError/clearErrors、解绑、dispose 和更新的验证结果会使旧结果失效。旧 Promise 不写回 UI。正常 validate 仍返回 `[errors]` 或 `[undefined, output]`，过期的全量验证返回 `[{}, undefined, { outOfDate: true }]`，不得据此提交旧数据。
- schema 的普通错误显示在字段/表单；schema 自身抛错转为表单错误，不产生未处理的异步拒绝。字段校验实际执行整个 schema，因此远程规则的节流/缓存/取消由业务负责。Zod 类型失败导致对象 refine 不执行的规则保持不变。
- 新增 status（dirty/touched/validating/submitting/validated/submitCount/formError/submitError）、getFieldState/watchFieldState、touch、setFields、setError/clearErrors、reset、focusField、submit/cancelPending/dispose。setField 默认不校验，第三参数 true 才校验；Controller 依据触发策略自动传入。reset(newValues) 建立新基线，reset() 恢复当前基线，不更换草稿 VM。
- 默认值和校验快照复制非循环普通对象、数组、Date，文件等实例保留引用；schema 转换不改写草稿。直接修改 formState 会更新 dirty 并使旧验证失效，但依赖自动校验应通过 setField/setFields/Controller 触发。
- R10：Controller 不再缓存初始 name/control；切换时释放旧值/元数据/状态订阅和焦点注册，重新绑定新字段。支持 blur/change/submit 三种触发，默认 blur；触碰后及全量提交后编辑重验，dependencies 在已触碰/已提交时重验依赖字段。
- 动态字段默认 preserve=true。preserve=false 在最后一个绑定卸载时丢弃值/错误；不会自动改写 schema，移除后可缺省的字段需 optional 或条件规则。多个绑定共享同名值，仍在使用的字段不会因另一个绑定卸载而删除。
- FormField 在 Controller 上增加标签、帮助、错误和校验中状态；显式传 field.id、ariaDescribedby、invalid、disabled、required、size 和事件给控件，不克隆 children。文字使用 value={field.value ?? ''}，数字/Select 使用 ?? null 保持初始空值受控，布尔字段绑定 checked。required 标记本身不生成 Zod 规则。
- Form 提供 vertical/horizontal/inline、labelWidth、size、requiredMark 和禁用配置；横向标签在窄屏转竖向。原生 fieldset 和 field.disabled 支持提交中禁用；尺寸需显式传 field.size。必填星号在真实 label 文本之外显示，不改变控件标签名称。
- Form 拦截 submit，用 Zod 作为校验来源并关闭浏览器原生 submit 校验；finish 收到转换结果，finishFailed 收到字段错误，error 接收保存异常。重复提交复用同一 Promise，保存异常可重试。提交成功不自动清空草稿或改变 dirty 基线。
- 原生 reset 可被 preventDefault 取消；默认恢复表单基线，不触发 change。ref.submit/reset 走原生事件。首个已挂载错误字段通过已注册焦点目标聚焦；Controller 的焦点在下一显示帧执行，以等待禁用状态恢复。可通过明确 id 或正常 ref + 自定义 focus 回调建立目标，不访问私有宿主。
- F10 记录 WithExpose 回调 ref 的类型缺口，组件不使用类型断言规避。业务 Promise/网络副作用不能自动撤销；reset/unmount 后组件忽略旧 UI 事务，业务仍需自己取消或隔离副作用。手动创建、无组件拥有的实例可调用 dispose 结束验证及订阅。
- 任意嵌套路径 Controller、Form.List、Schema 表单生成器、设计器暂缓；字段名首轮是顶层字符串键，复杂对象可整体绑定和校验。未新增依赖，也未修改 Jinge/Compiler。

参考：[Ant Design Form](https://ant.design/components/form/)、[Zod refinement](https://zod.dev/api?id=refinements)。R05/R06/R10 原用例未修改并已通过；原有控件的 Controller 集成测试继续保留。

## Menu / Dropdown / Breadcrumb

- MenuOption<T> 的 value 收紧到 string/number，全树唯一；分组和分隔线也需要 value。新增 children、type=item/group/divider、disabled/danger、href/target/rel/ariaLabel。原 label/icon 插槽仍支持初始化固定函数，运行中新增/替换仍受 F09 限制；普通文本和选项数据可更新。
- Menu 的选中改为明确的 value/defaultValue：初始化 value 非 undefined 为受控，null 为空选择，父级需写回 change 请求；不再保留旧版受控点击后先改内部值的混合行为。旧普通用例同步写回父值，保留选择事件、插槽、外部更新及节点身份断言。原 R01–R19 没有改动。
- 新增 openKeys/defaultOpenKeys/openChange、accordion、selectable、disabled、ariaLabel/emptyText、ref.focus(first/last)。垂直菜单原地展开，水平模式使用已有 Floating Portal；mode 初始化固定。手风琴关闭同级及其后代，禁用父项会阻止整棵子树。
- Menu 使用 menu/menubar/menuitem/group/separator 语义和单一 roving tab stop；方向键、Home/End、Enter/Space、前缀查找、Left/Escape 关闭及焦点返回。水平叶子激活后关闭子菜单。已挂载焦点目标立即移动，等待新 Portal 挂载的焦点使用可取消帧任务，避免快速方向键/Enter 激活上一项。
- Menu 链接是真实 a，可通过 change 的 Event.preventDefault 接入业务路由；修饰键交给浏览器，禁止把 Ctrl/Meta/Alt 操作合成为普通点击。不自动解析 jinge-router。禁用或不支持的协议没有可导航 href，_blank 自动合并 noopener/noreferrer 和原 rel。
- Dropdown 默认作为操作菜单，使用 role=menu 而非旧版 dialog。新增 defaultOpen、disabled、triggerMethod、closeOnSelect、selectable/defaultValue、loading/emptyText/loadingText、ariaLabel 与稳定 content 插槽。显式 value/defaultValue 可标记当前项；选择默认关闭，closeOnSelect=false 保持展开，动作回调不被异步返回值隐式控制。
- Dropdown 用公开 getFirstDOM 获取稳定触发根并管理键盘/aria-disabled；不克隆 children。触发器必须有正确的焦点/按钮语义，建议使用 Button；disabled 阻止动作，但如需从 Tab 顺序跳过，应同样给 Button 传 disabled。
- Dropdown 的 ArrowDown/Up 打开并进入首/末可用项，Enter/Space 打开，Escape 返回触发器；Tab 从触发器位置自然离开 body Portal。hover/focus 只展示而不抢走现有焦点；外部点击保留外部目标焦点。Modal 内验证了 Escape 只关闭菜单。className/style 仍作用于浮层，触发器样式直接传 children。
- Dropdown 复用 Floating 的定位、触发、延迟、模态层上下文及销毁清理。content 插槽的菜单语义/交互由调用方负责，复杂输入正文请组合 Popover；右键坐标菜单、自动拆分按钮和复杂级联操作菜单暂缓。
- 新增 Breadcrumb/BreadcrumbItem/BreadcrumbProps：命名 nav + ol/li、祖先真实链接、最后一项唯一 aria-current=page 且不导航、禁用/安全外链、图标/标签及全局/逐项分隔符。separator 插槽优先，分隔符 aria-hidden；窄屏允许换行。
- Breadcrumb 的 on:click 保留原生链接行为，业务可 preventDefault；不自动解析路由、不内置省略/折叠菜单。F11 的 For 边界标记缺口已独立复现，组件使用 index 和长度判断末项，保留 keyed 祖先节点。
- 没有新增依赖或修改框架。旧 Dropdown 浏览器用例中的 button 定位随实际语义更新为 menuitem；站点待实现页面导航测试改用 Tabs，保持测试意图。

参考：[Ant Design Menu](https://ant.design/components/menu/)、[Dropdown](https://ant.design/components/dropdown/)、[Breadcrumb](https://ant.design/components/breadcrumb/)、[WAI-ARIA Menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)。

## Tabs / Segmented / Steps

- Tabs 保留 options/activeKey/change、TabOption<K> 的 key/label/icon 插槽及 .ja-tab-item.active/.indicator 类；DOM 升级为外框、可滚动 tablist、原生 button、关联 tabpanel。依赖旧版根元素直接包含标签的选择器需要调整。
- 新增 defaultActiveKey、disabled、orientation、activation、destroyOnHidden、type=line/card、size、centered、ariaLabel/style，以及逐项 disabled/ariaLabel/content/slot:content。受控模式初始化固定，点击请求由父级写回；不再重复触发当前或禁用项。非受控选项删除/禁用时回退首个可用项，结构更新不产生 change；受控无效键为空选择。
- 内容首次访问懒挂载、默认保留，destroyOnHidden 立即销毁隐藏内容；输入等需要跨销毁保留的数据放在父级 VM。横向左右、纵向上下、Home/End 跳过禁用项，自动激活为默认，manual 用 Enter/Space 激活。
- 指示条按当前按钮测量，空列表/失效选中隐藏；观察列表/标签 border-box、子项/文本、窗口和字体变化，清理观察器及帧任务。原 R03/R18 测试断言保留并转绿。溢出用原生滚动，键盘移入当前目标；编辑式标签、拖拽、额外栏、溢出菜单及复杂位置暂缓。
- 新增 Segmented/SegmentedOption/SegmentedProps：原生 radio 单选组，value/defaultValue/change、disabled、block、direction、size、稳定 label 插槽及 name/form/required/reset。统一对象选项，数字值保持类型；复用 Radio 和公开组状态逻辑。没有滑块动画和简写数组，插槽可组合图标与文字。
- 新增 Steps/StepItem/StepStatus/StepsProps：命名有序列表、当前步骤、wait/process/finish/error、逐项状态优先、说明/图标插槽、横纵/600px 响应式及小尺寸。提供 change 后启用原生按钮导航，由父级管理 current；未提供时仅展示。当前项 aria-current=step，状态有可读文本，禁用项阻止跳转。current=-1 全未开始，current=items.length 全完成。
- Steps 不管理向导内容、校验、路由或异步事务，业务控制后续项何时可用；点状、百分比、内联等变体暂缓。所有插槽初始化固定，F09 的运行中替换继续暂缓。没有新增依赖或修改框架。
- 站点待实现页面导航测试改用 Pagination，保留历史与刷新测试目的。

参考：[Ant Design Tabs](https://ant.design/components/tabs/)、[Segmented](https://ant.design/components/segmented/)、[Steps](https://ant.design/components/steps/)、[WAI-ARIA Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)。

## Pagination / Table

- 新增 Pagination/PaginationProps：total、独立受控 current/pageSize 及各自 default 值、大小选择、快速跳转、总数、精简模式、单页隐藏、禁用、尺寸及命名 nav。用户改变大小请求第 1 页，先发 pageSizeChange(size)，再发 change(page,size)；总量变化只收敛显示，不发请求。非法数值有边界，巨量页码按常数数量渲染；省略按钮前后跳 5 页。
- Pagination 使用原生 button/select/input，所有按钮 type=button。跳转仅接受正整数字符串 + Enter，超范围收敛；组合输入不提交，Escape/失焦清空。同步帧不清除后来输入的草稿；父表单 reset 后恢复原生大小选择显示，不重置组件查询状态。没有新增表单字段语义或自动数据请求。
- Table 保留 columns、data、rowKey 字段形式、ColumnType/CellProps/ColumnProps 和原 title/render 插槽；rowKey 新增函数，运行时明确拒绝缺失/重复/非法键。列 key 统一字符串且唯一，dataIndex 可省略，render 优先；普通空值/对象显示破折号，数值 0 和布尔值正常显示。插槽仍在初始化确定，运行中替换暂缓 F09。
- Table 的原根 table 外新增 ja-table-container/ja-table-scroll；className/style 作用于外框，table 仍有 ja-table/尺寸/bordered 类。原有依赖直接根或 className 的 CSS 需迁移。thead/th scope、caption、aria-label 保持原生表格语义，未引入 spreadsheet/grid 键盘模型。
- 新增单列排序：sorter=true 只提供服务器请求，比较函数执行本地稳定排序；defaultSortOrder/sortOrder 为默认/受控，null 取消。顺序升→降→取消，不修改源 data。新增 filters/onFilter/filterMultiple、defaultFilteredValue/filteredValue，原生单/多选；同列 OR、跨列 AND，未提供 onFilter 时按 dataIndex 严格匹配。排序/筛选请求回首页，受控拒绝保持原状态。
- 新增 pagination=false（默认）或 Pagination 配置；本地按过滤排序后的数据计数和分页。remote=true 不再做任何本地过滤/排序/切片，读取 pagination.total，on:change 返回 action、pagination、sorter、filters 和 currentData。受控模式初始化固定；远程请求、竞态取消和加载状态由业务处理，站点提供模拟服务端示例。
- 新增 rowSelection：checkbox/radio、默认/受控键、逐行禁用、跨页保留及变化事件。全选仅当前页可用项，半选同步原生 indeterminate；切页不丢仍在源 data 中的选择，远程 preserveSelectedRowKeys 可保留未知键；回调 loadedRows 仅包含已加载记录。回调数组为新数组，记录仍为业务 VM 对象。type 初始化固定。
- F12：含响应式值和函数的内联对象配置会错误提升函数参数。选择配置请按示例声明为独立稳定 VM，再传 rowSelection；这是普通 JS 配置与 VM 使用，不重建组件。内部直接订阅稳定数据/配置对象，兼容 F08 的静态父 props 透传。新探针实际失败，框架集现为 7 项；未修改框架。
- 新增 expandedRowKeys/defaultExpandedRowKeys、rowExpandable、slot:expandedRowRender、expand/expandedRowsChange。详情按键控按钮展开，关闭及分页隐藏时销毁；需跨销毁保留的数据放父 VM。源数据移除时清理展开键。
- 新增 scroll.x/y、固定表头/左右列、列宽/对齐/ellipsis、行 class、加载/空态/自定义空插槽。固定列使用公开 ref/ResizeObserver 按真实表头宽度计算偏移，覆盖浏览器自动分配余量及字宽超出声明宽度；清理观察器和帧。固定列合计实际宽度须小于可视区，留至少一列普通内容供横向滚动。
- loading 保留行并阻止内建查询、选择和展开，显示 status 与 aria-busy；自定义单元格中的业务按钮由业务自行禁用。分组表头、树表、合并单元格、汇总、自定义过滤弹层、编辑、拖拽、虚拟化暂缓；没有新增依赖。
- 文档站待实现路由测试改用 DatePicker/RangePicker，保持历史、刷新与直达行为断言。

参考：[Ant Design Pagination](https://ant.design/components/pagination/)、[Table](https://ant.design/components/table/)、[Element Plus Table](https://element-plus.org/en-US/component/table.html)。

## DatePicker / RangePicker / TimePicker

新增的日期组件使用原生 `Temporal.PlainDate`，范围为两个 PlainDate 的完整元组，时间为 `Temporal.PlainTime`；空值统一 `null`。不接受 Date/Dayjs 或任意格式 token，不隐式转换时区。日期格式为三种固定选项，时间为 `HH:mm`/`HH:mm:ss`，详见站点 API。Form 增加 PlainDate/PlainTime 语义等值比较，相同值的新实例不会产生脏状态。

必须有原生 Temporal；不支持时明确禁用，无 polyfill。类型需启用 `ESNext.Temporal`。Jinge VM 已在相邻仓库小范围修复，当前本地测试用其构建产物覆盖安装包；重装后执行 `pnpm test:sync-jinge`。正式发布前需更新为包含该修复的 Jinge 版本，不能直接依赖 registry 旧产物。同步、值语义和首轮暂缓能力见 [TEMPORAL.md](./TEMPORAL.md)。

## Upload

新增 Upload、UploadFile/UploadProps/UploadRequestOptions/UploadHandle 等类型。列表使用 `fileList/defaultFileList`，`on:change(files, info)` 为快照及事件类型；FormField 通过 `on:change={(files) => field['on:change'](files)}` 绑定，第二个参数为 Upload 元数据，不是 DOM Event。

默认 XHR 为 multipart；`name` 是上传的文件字段名，内部选择器不参加宿主原生文件提交。服务端已有文件可只提供 uid/name/status/url，新的原生 File 在 originFile 中保留。异步 beforeUpload 返回 false/拒绝即不加入，手动队列用 autoUpload=false。取消保留 canceled 项，移除才删除；默认不自动重试。受控父级应写回完整列表；外部删除在途项会中止请求。

customRequest 返回 Promise 并响应 AbortSignal；进度通过 onProgress 上报。重置/移除/卸载后组件隔离迟到结果。首轮无图片墙、目录/粘贴、分片、断点续传或云 SDK；详见 [UPLOAD.md](./UPLOAD.md)。没有新增依赖或 Jinge 改动。

## Tree / Cascader

新增 Tree/TreeNode/TreeProps/TreeKey/TreeHandle 及 Cascader/CascaderOption/CascaderProps/CascaderValue/CascaderKey/CascaderHandle。Tree key 全树唯一，Cascader value 同级唯一、由完整路径区分；均拒绝循环或不合法键。

Tree 的 expandedKeys/selectedKeys/checkedKeys 分开受控，默认对应 default 数组且初始化固定控制模式。关联勾选返回全部已知完整勾选 key，halfCheckedKeys 单列；disabled 作用于子树，disableCheckbox 是勾选关联边界。Tree 不是原生表单字段。

Cascader 首轮单路径，空值 null。change(value, options, event) 的 FormField 适配只传第一个参数；原生表单隐藏字段使用 JSON 路径字符串，保留数字 0。默认叶子提交，changeOnSelect 可提交中间层；showSearch 只查已加载路径。reset 不发 change。

共同 loadData(node,{signal}) 返回子项数组；不再要求业务原地修改子项。异步缓存不写回源数据，节点替换/显式子项/卸载隔离旧结果，失败可重试。无新增依赖或框架改动；新编译器边界 F14 独立记录。能力、限制及测试见 [HIERARCHY.md](./HIERARCHY.md)。
