# 组件测试与已知问题回归

测试直接使用本项目安装的依赖和 `src` 源码，不读取相邻仓库源码或旧 dist。注意：日期批次已按用户授权，将相邻 Jinge 构建产物复制至已安装的 Jinge，以验证 Temporal VM 修复；重新安装后需执行 `pnpm test:sync-jinge`，详见 [TEMPORAL.md](../docs/TEMPORAL.md)。普通测试经 Jinge 编译器 + Vite 构建后在 jsdom 中执行；e2e 使用真实生产构建、真实 CSS 和 Chrome，验证浏览器交互、滚动与布局。

## 目录

```text
test/
  unit/          Node test runner + jsdom：组件行为、响应式、生命周期、表单、异步校验
  e2e/           Playwright：真实浏览器交互与几何布局
    app/         按场景隔离的测试页面
  fixtures/      经实际编译器处理的插槽、Controller 等测试组件
  framework/     框架约束的独立复现，不混入正常组件集合
  regressions.json  R01–R19 问题编号与测试层级
  verify.mjs     自动核验当前 open/fixed 基线
  .compiled/     自动生成，已忽略
  .results/      JUnit、浏览器 JSON/HTML 报告、截图与 trace，已忽略
```

## 运行

先执行 `pnpm install`，再按上述说明同步含 Temporal 修复的 Jinge。本次环境为 Node 26.4.0；浏览器测试默认使用本机 Google Chrome。

```sh
pnpm test:components          # 正常行为：普通、组件 e2e 和文档站，当前全部通过
pnpm test:regressions         # 19 个已知问题，保留 open/fixed 状态
pnpm test                    # 全量；存在真实回归失败时退出码为 1
pnpm test:verify              # 核验 open/fixed 分布、问题编号和报告完整性
pnpm test:framework           # 独立复现 F04/F05/F07/F08/F09/F11/F12/F14，当前 8 项真实失败
```

也可以分别运行 `test:unit:components`、`test:unit:regressions`、`test:e2e:components`、`test:e2e:regressions`，或执行 `pnpm test:e2e --grep R13` 定位单项浏览器回归。

没有安装 Chrome 的环境可安装 Playwright Chromium 后运行：

```sh
pnpm exec playwright install chromium
PLAYWRIGHT_CHANNEL=chromium pnpm test:e2e
```

e2e 独占 `127.0.0.1:5198`，不复用外部服务器。测试失败时自动保留截图和 trace。

**回归用例断言正确行为，未使用 skip、todo、test.fail 或“期望错误结果”的断言。** 当前 19 项回归均已修复，`pnpm test` 全量通过。`test:verify` 返回成功代表正常行为通过、每条回归与登记状态一致；修复组件后保留原测试并将清单改为 fixed。它会拒绝问题用例漏跑、跳过、重试掩盖、无关组件失败或未登记的状态改变。

## 当前分批建设结果（2026-11-04）

依赖：jinge 4.2.0、jinge-compiler 4.2.0、Zod 4.6.7、Playwright 1.64.1、jsdom 30.1.3。

| 集合                         | 数量 | 通过 | 失败 |
| ---------------------------- | ---: | ---: | ---: |
| 普通组件测试（含已交付组件） |  387 |  387 |    0 |
| 组件 e2e                     |  133 |  133 |    0 |
| 文档站 e2e                   |   69 |   69 |    0 |
| 已知问题回归                 |   19 |   19 |    0 |
| 合计                         |  608 |  608 |    0 |

R01–R19 全部修复，原始断言保留。`regressions.json` 全部为 fixed；`test:verify` 继续核验每项状态及报告完整性。独立框架探针 F04/F05/F07/F08/F09/F11/F12/F14 共 8 项真实失败，不计入上表，F06/F10 是另外的类型缺口。

全量报告：`test/.results/unit-all.xml`、`test/.results/e2e.json`、`test/.results/site.json`；`verification.json` 汇总交付基线。文档截图与 trace 在 `.results/site-artifacts/`，组件截图与 trace 在 `.results/e2e-artifacts/`。

已交付基础组件的独立测试位于 `unit/button.test.mjs`、`unit/primitives.test.mjs`、`e2e/button.spec.mjs` 与 `e2e/site.spec.mjs`。覆盖原生表单按钮、键盘/焦点、组 context、图标语义、排版、间距、栅格响应式和侧栏折叠；其余旧组件仍有原先的普通行为测试，不代表旧组件已完成能力升级。

浮层与提示组件测试位于 `unit/floating.test.mjs`、`unit/overlays.test.mjs`、`e2e/floating.spec.mjs`、`e2e/overlays.spec.mjs`，覆盖定位、滚动、尺寸约束、延迟取消、嵌套、焦点/ARIA、异步确认及资源释放；站点测试验证新页面的示例、同源代码与交互。

## 问题对应

`regressions.json` 保留审阅中的 R01–R19 编号。普通回归位于 `unit/regressions.test.mjs`；几何布局回归 R02、R13、R18 位于 `e2e/regressions.spec.mjs`。每项至少有一个独立失败路径，同一问题的所有变体不等同于已逐一覆盖。

R12 已修复：InputNumber 事件类型扩为 number | undefined，真正清空回传 undefined，保留原正确行为断言。快速进入/关闭的框架问题已独立复现为 docs/FRAMEWORK-GAPS.md 的 F04；浮层有不等待入场完成就立即关闭的 e2e，验证新挂载方式会移除节点并清理任务。

## 隔离与限制

普通测试使用新组件 bundle 隔离 Message/z-index 单例，清理宿主、DOM 和计时器。jsdom 只补充 OffscreenCanvas 的 instanceof 检查与浏览器数字 timer ID 的 clearTimeout 路径，不替换组件实现。Transition 在普通测试中显式派发 transitionend，在 e2e 中使用真实动画。竞态测试使用真实 Zod 的可控 Promise refinement。

Avatar/ButtonGroup 的早期容器用例仍保留；现在两者均有补充的完整组件测试。其余未交付组件的状态以 site 导航为准。

原有 Menu/Table 的 key 类型错误已通过 Jinge 原生属性路径 key 与有效 rowKey 类型修正，未使用类型断言掩盖问题。项目及测试类型检查已通过。React 的 immutability/refs lint 规则不适用于 Jinge，配置调整原因见 docs/MIGRATIONS.md。

## Modal/Drawer 批次

`unit/dialogs.test.mjs`、`e2e/dialogs.spec.mjs` 覆盖受控关闭、异步去重与过期事务、命令式结果/挂载点清理、关闭时 DOM 时机、背景 inert/滚动样式恢复、乱序卸载、初始嵌套、焦点循环/恢复、子 Portal 与层级 Escape、四向抽屉及长内容滚动。首批新增普通用例先运行确认失败后实现；R02/R15/R16 保留原正确行为断言并转绿。站点另有源码/API 检查和保存、结果 Promise、嵌套关闭工作流。

## Message/Notification 批次

`unit/notices.test.mjs`、`e2e/notices.spec.mjs` 覆盖幂等关闭、clear 完成回调与全部 Promise、重新计时/保持显示/关闭后更新、数量上限、回调异常及重入、静态内容/标题/图标/操作插槽、四角/窄屏布局、悬浮与聚焦暂停、模态窗口层级和空容器销毁。站点有真实加载更新、内容操作及源码/API 测试。普通测试清理时先关闭独立提示服务并完成空根的 microtask 清理，再清空 DOM，避免测试框架在服务销毁之前强行移除它的节点。

## Avatar/Badge/Tag 批次

`unit/avatar.test.mjs`、`unit/badge.test.mjs`、`unit/tag.test.mjs`、`e2e/display.spec.mjs` 覆盖图片错误/恢复、图标文字优先级、尺寸与语义、计数溢出和圆点、子节点身份和真实角标定位，以及标签键盘移除/阻止关闭/受控恢复。站点每项都有交互及同源代码检查。独立 `framework/slot-fallback.test.mjs` 保留 F05 的正确渲染断言并确认失败；Avatar 组件用显式条件分支通过正常测试。

## Card/Collapse/Descriptions/Empty 批次

`unit/card.test.mjs`、`unit/collapse.test.mjs`、`unit/descriptions.test.mjs`、`unit/empty.test.mjs` 的 17 个新增用例先确认实际失败，再逐组件实现并转绿。`e2e/containers.spec.mjs` 验证真实加载/折叠后的输入保留、手风琴及键盘导航、列表重排/可选销毁、响应式列数和跨度/长文本布局，以及图片解码失败和键盘创建/重置。每项站点示例另有实际交互和同源源码/API 检查。Card、Descriptions、Empty 截图位于 `.results/`。

## Alert/Spin/Skeleton/Progress/Result 批次

五个独立 unit 文件共 20 个新增用例先确认失败，再逐组件实现。`e2e/feedback.spec.mjs` 覆盖关闭/恢复/阻止关闭、原生键盘操作、Spin 忙碌期间跳过 inert 正文、延迟取消、Skeleton 懒挂载/保留输入、线形实际宽度/圆形 SVG/小容器适配、reduce-motion，以及结果页标题与明确重试。普通测试另直接确认 Spin 清除待执行计时器、0 进度不显示前景圆点和完成/失败的非颜色语义。站点每项都有交互、同源源码和 API 检查。原 Spin 四点基础用例保留其断言意图，选择器随新指示器包装调整；迁移见 docs/MIGRATIONS.md。

F06 的 JSX inert 类型已在相邻 Jinge 源仓库补齐，消费包待更新；组件仍使用公开 ref/DOM API。F11 删除无运行时实现的 isFirst/isLast 类型，原探针改用 .map 的 index 与列表长度计算首尾并验证更新。原 F04/F05 探针与其他历史验收记录见 docs/FRAMEWORK-GAPS.md。

## Input/TextArea/Password/InputNumber 批次

四个独立 unit 文件新增 19 个用例；InputNumber 新增 6 项先在旧实现上全部确认失败，再实现并转绿。覆盖原生属性/公开方法、受控接受/拒绝/默认值、IME 提交和尾随事件去重、清空/计数/插槽/节点身份、readonly/disabled、密码可见性/选区、自动高度 observer 清理、数值精度/边界/空值/受控草稿/小数步进/重置。`e2e/inputs.spec.mjs` 的 7 项验证真实表单、密码按钮/选区、textarea 尺寸和滚动、原生 badInput 与小数步进。4 个文档站用例验证交互、同源源码和 API。R12 原用例转绿；F07 的原生 autocomplete 探针独立保持实际失败，组件正确同步原生属性。

F08 独立验证嵌套 VM 作为组件属性传递时，完整 JSX 路径丢失内部更新。TextField 保留稳定配置 VM 引用并直接监听它，正常测试验证动态属性；没有缓存标量或修改框架。

## Checkbox/Radio/Switch 批次

三个独立 unit 文件新增 19 项：首批 6/5/5 项分别先确认失败，再逐组件实现；另补默认数组快照与 Checkbox/Switch 的 Controller 布尔字段集成。覆盖原生标签/属性/焦点、受控接受和拒绝、半选、禁用、加载、默认与重置/取消重置、数字 0、动态选项重排/空选项、独立单选组、按钮样式、事件载荷及生命周期清理。

`e2e/choices.spec.mjs` 新增 6 项验证 Space/Enter、原生单选方向键跳过禁用项和循环、受控组拒绝后的全部原生状态、表单原生校验/FormData/reset、加载字段不提交、reduced-motion；3 个站点用例验证全选/半选、按钮单选和模拟保存以及同源代码/API。Switch 站点截图 `.results/switch.png` 已目视检查。浏览器测试发现的默认 value 被写成字符串 undefined 已修正为原生默认 on，状态文案缺省也显式为空。

原 R01–R19 的分布仍为 14 fixed / 5 open；独立框架探针仍为 F04/F05/F07/F08 四项实际失败，本批未引入新的框架限制或依赖。

## Select/AutoComplete 批次

两个独立 unit 文件新增 21 项：Select 首批 10 项、AutoComplete 首批 6 项均先确认失败，再实现；其余补稳定组件级插槽的数据更新、Controller/表单集成、Observer 清理与分组视觉导航顺序。Select 的逐项动态插槽问题独立记录为 F09，保留正确行为断言并实际失败；本轮公开 API 使用稳定的组件级渲染插槽。

`e2e/selects.spec.mjs` 的 8 项验证单/多选键盘和焦点、跳过禁用项、标签/保留输入节点、原生 required 和 FormData/reset、Modal 内浮层关闭、自由文本/建议值/IME、远程数据替换、加载和 Tab、长列表滚动与宽度。2 个站点用例验证真实交互、同源源码和 API。Select 文档截图 `.results/select.png` 已目视检查。原正常 Select 用例保留，浏览器中的菜单按钮定位随实际语义调整为 option；R09/R17 原断言未修改。

当前正常组件共 347 项通过；R01–R19 仍为 14 fixed / 5 open。F09 加入独立框架探针，现共 5 项实际失败（F04/F05/F07/F08/F09）。没有新增依赖或修改 Jinge/Compiler；后续接续 Form。

## Form/FormField/Controller 批次

`unit/form.test.mjs`、`unit/form-view.test.mjs` 新增 17 项。首批 engine 9 项、view 3 项先确认失败，再实现；覆盖跨字段/根级/嵌套错误、转换前后类型、快照/默认值/重置、直接草稿变更、字段与全量校验乱序、服务端错误、提交去重/异常恢复/跨周期、动态 preserve、依赖/触发、控制器 name/control 重绑、标签/帮助/错误关联、首错焦点、取消重置、卸载/订阅清理。R05/R06/R10 原测试不变并转绿。

`e2e/forms.spec.mjs` 新增 7 项，验证真实表单、密码依赖、原生可访问名称、提交期间禁用和去重、错误重试、混合控件重置、动态字段、乱序异步结果和窄屏布局；站点另有完整成员创建流程、同源源码/API 与截图检查。`fixtures/form-types.tsx` 验证 schema 输入/输出分离和错误字段类型约束。Form 的原生 label 文本与必填装饰分离，避免星号混入标签文字。

正常组件当前 372 项通过；原回归为 17 fixed / 2 open（R03/R18）。F10 记录 WithExpose.ref 缺少回调类型，使用明确 id/正常 ref + focus 回调，未强转；运行时框架探针仍为 5 项实际失败。未新增依赖或修改 Jinge/Compiler，阶段 4 首轮完成，后续接续 Menu/Dropdown/Breadcrumb。

## Menu/Dropdown/Breadcrumb 批次

三个独立 unit 文件新增 18 项：首批 Menu 7、Dropdown 5、Breadcrumb 4 项先确认失败，再实现；另补手风琴后代清理/禁用子树和修饰键原生激活。覆盖受控/默认选中与展开、焦点/方向键/前缀、水平 Portal、分组/分隔线/危险项/原生链接、空状态、重排身份、禁用/加载、显隐接受与拒绝、选择保留、内容插槽、面包屑 current/装饰分隔和安全外链。

`e2e/navigation.spec.mjs` 新增 7 项，验证快速方向键/Enter、子菜单焦点返回、不提交外层表单、Dropdown 首末项/Tab 离开 Portal、hover 不抢焦点、外部点击/禁用、Modal 内 Escape、原生面包屑链接与窄屏换行；3 个站点示例验证实际操作、路径更新及同源源码/API。Menu 示例截图 `.results/menu-demo.png` 已目视检查。

Menu 的旧普通用例按新的受控契约写回 value，保留原选择、插槽和外部更新断言；Dropdown 的旧浏览器定位从 button 改为 menuitem。R01–R19 原测试未修改，仍为 17 fixed / 2 open。F11 保存了 For 边界标记的正确行为失败探针，框架集现共 6 项实际失败。正常组件共 400 项通过，未新增依赖或修改框架。下一批 Tabs/Segmented/Steps。

## Tabs / Segmented / Steps 批次

`unit/tabs.test.mjs`、`unit/segmented.test.mjs`、`unit/steps.test.mjs` 新增 20 项普通测试；首批 9/5/5 项在实现前分别确认全部失败，另补布局观察器清理测试。`e2e/navigation.spec.mjs` 新增 8 项真实键盘、几何、内容保留、原生表单、响应式和状态测试；站点新增 4 项示例交互测试与截图。R03/R18 原测试未修改并已转绿。Tabs 指示条观察按钮 border-box，覆盖只改变 padding 时 content-box 不变的情况；销毁时清理观察器、帧和监听。站点另检查纵向标签不裁剪、指示条宽度与 Segmented block 铺满；分段原生 input 覆盖整个标签，避免居中文本挡住 1px 输入的命中区域。三张示例截图已目视检查。没有新增依赖或修改 Jinge/Compiler。

## Pagination / Table 批次

`unit/pagination.test.mjs` 首批 8 项、`unit/table.test.mjs` 首批 16 项在旧实现上全部确认失败；实现后补原生 reset、稳定 VM 配置、受控多选过滤、空态/文本、受控展开/数据更新、排序稳定性、身份校验和观察器释放，共新增 31 项普通测试。`e2e/data.spec.mjs` 新增 8 项：分页/跳转/受控拒绝、不提交表单、表格排序筛选/分页及 keyed 身份、跨页选择/禁用/半选、展开内容销毁、加载和空态、真实固定表头及多列偏移、原生列宽重新分配。站点新增 3 项示例/同源源码/API 测试，截图已目视检查。

F12 的 `object-callback.test.mjs` 保留正常函数作用域断言，当前实际失败为 `item is not defined`。框架集现为 7 项实际失败，仍独立于正常测试和 R01–R19；Table 使用稳定配置 VM，未修改框架或新增依赖。Pagination 的输入同步帧不会清除刚输入的跳转草稿，Table 的多选过滤不设置单一 select.value；两项均经实际测试发现并修正。下一批日期/时间选择。

## DatePicker / RangePicker / TimePicker 批次

新增 29 项普通测试、10 项组件 e2e、5 项站点 e2e。首批日期、范围、时间用例均先确认失败，再实现转绿；安装的旧 Jinge 原生 Temporal 集成断言也先确认失败。覆盖严格格式/闰年/年份边界、禁用/步长、受控拒绝及回调异常恢复、IME、焦点/跨月键盘、范围草稿/预览/反向选择、Tab/Escape/嵌套 Modal、原生 required/FormData/reset、Controller/Form 等值及卸载清理。缺少原生 Temporal 时明确禁用且不加载 polyfill。

`fixtures/picker-types.tsx` 验证原生值及 ref 类型，拒绝 Date、错误时间类型及不完整范围。站点包含真实交互、同源示例和 API；截图关闭动画后检查。相邻 Jinge 新增 10 项测试（首轮 9 失败、1 通过），修复后全部通过，完整 351 项通过；该数量独立于日期批次交付时本项目 537 项。原有 7 项框架探针仍真实失败，F13 修复见 docs/FRAMEWORK-GAPS.md。

## Upload 批次

`unit/upload.test.mjs` 新增 16 项，首批 12 项先确认失败，再实现并转绿。验证不可变默认快照、原生 File 方法/身份、自动/手动和重复启动、扩展名/MIME/字节/数量、异步校验顺序、进度边界、取消/失败重试和旧结果隔离、受控拒绝/外部移除、异步移除去重/否决、并发名额、禁用后旧校验隔离、缺少传输配置、重置/取消重置及卸载。`fixtures/upload-types.tsx` 验证 ref 和请求/列表类型约束。

`e2e/upload.spec.mjs` 新增 7 项真实 Chrome 测试，包含原生键盘文件选择器、相同文件再选、拖放状态/校验、不提交父表单、进度/失败/取消/重试、受控拒绝、原生 XHR multipart 文件与额外 Blob/文本字段、请求头/HTTP 错误重试、Tab/禁用/原生 reset、窄屏长文件名及卸载真实中止。站点新增 2 项自动/手动上传、Form 校验/保存/重置及同源源码/API 检查；截图 upload.png 已目视检查。模拟示例不向外部服务发送文件。

本批无新增依赖或框架改动。File 与附加 Blob 分别使用公开 vmIgnore/vmRaw 保留原生能力；正常测试及原 19 项回归继续保持通过。独立框架失败探针仍为原 7 项。下一组件为 Tree，随后 Cascader。

## Tree / Cascader 批次

新增 Tree 17 项、Cascader 13 项普通测试，两者首批各 10 项均在实现前确认失败。覆盖展开/选择/勾选的独立控制与拒绝、键 0/字符串区分、默认快照、过滤/祖先恢复、不因过滤偷偷加载、禁用与勾选关联边界、半选、独立勾选、异步加载去重/缓存/重试/空结果、旧请求隔离/取消、显式子项覆盖、无效数据回滚、空错误消息、懒节点勾选继承、DOM 身份和外部焦点保护；Cascader 另有完整路径/中间层、重复值、IME/路径搜索、未知路径标签解析、原生 reset/取消 reset 与显隐/只读。

`e2e/hierarchy.spec.mjs` 的 12 项真实 Chrome 测试验证 Tree 键盘/Space/Tab、受控拒绝/插槽/重排/过滤/加载、外部收起焦点、窄屏/禁用；Cascader 原生 required/FormData/数字 0/reset、逐级键盘、中间层/清空/拒绝、搜索/Tab、懒加载重试、Modal 分层 Escape 与窄屏列滚动。站点新增四组示例及 4 项交互/源码/API 测试，Tree/Cascader 两张截图已目视检查。`fixtures/hierarchy-types.tsx` 有公开类型正反例。

F14 独立探针验证普通 TSX 数据回调读取 children 不应变为插槽，当前真实失败。框架集因此从 7 增为 8 项真实失败；正常行为和原 R01–R19 不混入框架探针。本批没有新增依赖或修改 Jinge/Compiler，层级数据运算在普通 .ts 模块中实现。既定阶段 0–6 首轮清单已完成，暂缓项与后续讨论见 docs/HIERARCHY.md、FRAMEWORK-GAPS.md。

## F02 成员调用修复联测

Jinge 与 compiler 新增 MethodPathWatcher，接收者/方法分别非 deep 订阅，原函数值不绑定，方法闭包依赖不自动收集。当前安装包已通过 compiler/scripts/sync-local-consumers.mjs 显式同步本地 dist/types/native binding，正常全量仍为 608 项通过。F02 的 native array/string 专用框架回归通过，原有 8 项框架真实失败保持；因此 test:framework 当前 9 项中 1 通过、8 失败，未改变正常组件验收。

重新安装依赖后应先构建相邻 Jinge 与 compiler，再执行上述同步脚本；仅运行旧 test:sync-jinge 不会更新 compiler/native binding。正式发布需配套包含新 helper 的 runtime/compiler，不能把未发布的本地 4.2.0 产物当作 registry 同版本已支持。
