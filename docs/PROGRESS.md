# 实施进展与续接点

## 当前已交付

1. 范围决策：ROADMAP.md 的 PC 中台能力矩阵、公共契约、逐组件验收条件。
2. 文档站：分类/搜索、已交付与待实现状态、直接 hash 链接、历史、页面锚点、可运行示例、源码展开与复制、API、说明/限制、窄屏导航。
3. 基础组件：
   - Button/Group：三尺寸、四类型、形状、危险/幽灵/块级、禁用/加载、原生提交与重置、aria、focus/blur、响应式分组。
   - Icon/LoadingOutlined：已有七个 SVG 的尺寸、颜色、ariaLabel 与装饰语义；加载状态及 reduced-motion。
   - Typography：Title/Text/Paragraph/Link、真实标题层级、文本样式、单行省略、安全外链与禁用链接。
   - Space/Flex：横纵、间距数组、对齐、换行，不反射或克隆 children。
   - Divider：横纵、文字、虚线、位置与 separator 语义。
   - Row/Col：24 栅格、六档 CSS 断点、间距、偏移、顺序和隐藏。
   - Layout/Header/Sider/Content/Footer：布局组合、受控/默认折叠、键盘触发与保留内容状态。
4. 质量基础：修正旧 Menu/Table 的 key 类型问题，增加 Menu 重排身份测试；样式入口通过 jinge-antd/style.css 导出；修正 preview-site 配置路径。
5. Floating：完整 12 方位、翻转/视口边距/尺寸限制、滚动与尺寸跟随、click/hover/focus、多触发组合、延迟取消、受控/默认、嵌套 Portal、ESC/outside、ARIA、可选自动聚焦/焦点恢复和资源清理。
6. Tooltip/Popover/Popconfirm：提示键盘触发、交互内容、受控显隐、异步确认去重/失败保留/卸载保护；站点包含各组件的示例、源码、API 与限制。
7. Modal/Drawer：独立稳定层级、受控/默认显隐、标题/页脚插槽、ARIA、背景 inert、滚动锁、Tab 循环/焦点恢复、嵌套及子 Portal 协作。Modal 异步去重、错误保留与跨打开周期隔离；命令式结果 Promise 保留、关闭幂等并移除挂载点。Drawer 四方向、尺寸与内容滚动。站点有可运行示例、源码和 API。
8. Message/Notification：五种状态、文本更新/内容插槽、毫秒计时与暂停、幂等关闭、clear 完成回调及 Promise、数量上限、空容器清理；通知支持四角、标题/图标/操作插槽、关闭按钮。站点有示例、源码和 API。
9. Avatar/Badge/Tag：图片加载、失败回退/重试、文字图标与无障碍名称；数量溢出/圆点/状态与偏移；语义标签、图标、键盘关闭/阻止关闭和受控恢复。普通/e2e/站点示例/源码/API 均已补齐。
10. Card/Collapse/Descriptions/Empty：标题/操作/封面/保留内容的加载态；多展开/手风琴、受控数组、懒挂载/可选销毁、键盘导航；定义列表语义、响应式列数/跨度、空值/0 与内容插槽；空态插图/回退/说明/操作和可选播报。普通/e2e/站点示例/源码/API 均已补齐。
11. Alert/Spin/Skeleton/Progress/Result：常用提示、操作/关闭/可见状态；延迟显示/内容 inert/定时清理；头像/文本/块占位、懒挂载及后续状态保留；线形/圆形、状态/值域/格式/ARIA；四种结果与 403/404/500、操作及内容插槽。普通/e2e/站点示例/源码/API 均已补齐。
12. Input/TextArea/Password/InputNumber：受控/默认、原生表单与公开 ref、IME、清空/计数/前后缀、自动高度、密码可见性、数值草稿/精度/边界/小数步进；每项普通/e2e/站点示例/源码/API 均已补齐。
13. Checkbox/CheckboxGroup、Radio/RadioGroup、Switch：原生选择/分组、半选、受控/默认、按钮样式、键盘/禁用/加载、表单/重置和 Controller 布尔绑定；普通/e2e/站点示例/源码/API 已补齐。
14. Select/AutoComplete：单多选/自由文本、搜索/分组/禁用/清空/加载、自定义展示插槽、combobox/listbox 键盘/焦点/ARIA、原生表单校验/重置、IME、远程选项更新和 Controller 集成；普通/e2e/站点示例/源码/API 已补齐。
15. Form/FormField/Controller：Zod 输入/输出分离、全量快照及跨字段/异步校验、状态/错误/重置/提交去重、动态字段保留/移除、标签/帮助/ARIA/焦点与响应式布局；普通/e2e/站点示例/源码/API 已补齐。
16. Menu/Dropdown/Breadcrumb：垂直/水平导航、子菜单/分组/分隔线、受控选中/展开、原生链接/键盘/焦点、操作菜单及路径导航；普通/e2e/站点示例/源码/API 已补齐。F11 列表边界标记已独立复现，面包屑用 index/长度判断。
17. Tabs/Segmented/Steps：标签面板/保留销毁/横纵键盘/动态指示条，原生分段单选与表单，步骤状态/说明/可选导航/响应式；普通/e2e/站点示例/源码/API 已补齐。
18. Pagination/Table：分页/大小/跳转，本地和远程查询、单列排序/原生单多选过滤、行选择/跨页保留、展开行、固定表头/列和完整站点示例/源码/API 已补齐。F12 内联响应式对象的回调作用域问题已独立复现。
19. DatePicker/RangePicker/TimePicker：原生 Temporal、严格输入、受控/默认、日历/双月范围预览、键盘/焦点、时间步长/禁用与确认、原生表单/Controller；普通/e2e/站点示例、源码/API 与类型用例已补齐。Jinge VM 仅增加 Temporal 内置对象识别，见 TEMPORAL.md。
20. Upload：点击/拖放/多选、类型/大小/数量与异步校验、文字列表、受控/默认、自动/手动、默认 XHR/自定义请求、并发/进度/取消/失败重试、异步移除与 Form/原生 reset；普通/e2e/站点示例、同源源码/API 和类型检查已补齐。无新增依赖或框架改动。
21. Tree/Cascader：树展开/单多选/关联与独立勾选/过滤/键盘，单路径级联/中间层/已加载路径搜索/清空/原生表单与 Form；共用可取消、去重、缓存及失败重试的异步加载。普通/e2e/站点四组示例、同源源码/API 与类型用例已补齐。F14 普通 TSX 数据 children 返回问题独立复现，数据运算使用普通 .ts 模块，未改框架或新增依赖。
22. R01–R19 全部修复，原始回归断言保留。R03/R18 由 Tabs 空值保护和布局观察修复；verify 继续核验编号及 fixed 状态。

## 当前验证

- 正常行为：387 普通测试、133 组件 e2e、69 文档站 e2e（589 项）；加上 19 回归共 608 项。
- 19 回归：19 通过、0 失败；完整 pnpm test 返回零。
- pnpm test:verify 核验当前交付状态；报告在 test/.results/verification.json。
- 项目 tsc、测试 tsc、全库 type-aware oxlint、格式检查通过。
- 库 JS/CSS、声明、工具和文档站均完成构建。
- 文档站桌面截图：test/.results/site-desktop.png。
- Modal 与嵌套 Drawer 截图：test/.results/dialog-modal.png、dialog-nested.png。
- Card、Descriptions、Empty 截图：test/.results/card.png、descriptions.png、empty.png。
- Progress、Result 截图：test/.results/progress.png、result.png。
- Switch 文档截图：test/.results/switch.png（已目视检查）。
- Select 文档截图：test/.results/select.png（已目视检查）。
- Form 文档及示例截图：test/.results/form.png、form-demo.png（已目视检查）。
- Menu 示例截图：test/.results/menu-demo.png（已目视检查）。
- Pagination/Table 示例截图：test/.results/pagination-demo.png、table-demo.png（已目视检查）。
- Tabs/Segmented/Steps 示例截图：test/.results/tabs-demo.png、segmented-demo.png、steps-demo.png（已目视检查）。

## 最新决策：沿用现有 Floating

D01 转为备选，沿用现有实现完成了本轮增强；没有新增依赖。复测证据、交付范围与首轮限制见 FLOATING-ASSESSMENT.md。

浮层直接条件挂载，保留 CSS 入场动画与 reduced-motion，关闭立即卸载。框架 Transition 的快速进入/关闭问题 F04 已有独立实际失败用例，离场动画暂缓讨论；该批次没有修改 Jinge/Compiler；日期批次另有授权的 VM 小改动。

## 继续工作时

- 保留此前会话已有的未提交改动；不自动提交/重置仓库。
- 阶段 0–6 的首轮范围已全部完成，包括 Tree/Cascader。后续优先讨论已记录的框架缺口及首轮暂缓能力，不自动扩展组件范围。
- D02 第三方日期库建议已关闭；D03 按用户决定使用原生 Temporal，不引入 polyfill。Node/浏览器必须原生支持；安装后的 Jinge 当前使用相邻仓库构建产物，重新安装后须同步。具体命令、类型要求与发布前提见 TEMPORAL.md。
- Modal/Drawer 首轮关闭销毁内容，保留父级 VM 值；内容保留模式、离场动画、第三方 Portal、自定义挂载容器暂不支持。迁移详情见 MIGRATIONS.md。
- 阶段 6 首轮完成；首轮之外的能力以各组件文档暂缓项为准。
- Framework gaps F01–F14 已记录；F06/F10 是类型缺口，F07 由公开 DOM API 规避，F08 通过稳定 VM 规避，F11 用索引计算规避。F09 的运行中插槽新增/替换暂缓；F12 使用稳定配置 VM 保留正常函数作用域，内联响应式配置回调暂缓。运行 pnpm test:framework 可复现 F04/F05/F07/F08/F09/F11/F12/F14，共 8 项真实失败，不纳入正常组件集合。
- 新增任何外部依赖都要另行向用户确认；D01 尚未批准，也未安装。
- Tree/Cascader 文档截图：test/.results/tree.png、cascader.png（已目视检查），契约见 HIERARCHY.md。
- Upload 文档截图：test/.results/upload.png（已目视检查），范围与请求契约见 UPLOAD.md。
- 日期相关截图：test/.results/date-picker.png、range-picker.png、time-picker.png（已关闭动画并目视检查）。
- 相邻 Jinge 独立回归：34 套、351 项通过；Temporal 新增 10 项通过。F13 已修复，原 7 项框架失败探针未改变。
