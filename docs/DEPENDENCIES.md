# 外部依赖决策

任何新增依赖都要用户单独确认。本文件记录评估，不代表已批准安装。

## D01：@floating-ui/dom（备选，当前不引入）

拟用于：Floating 的几何定位与自动更新，后续 Tooltip/Popover/Dropdown/Select 等共用。拟引入 DOM 包，绝不引入 React 包。

调研时 registry 当前版本：1.8.0。其直接传递依赖为 @floating-ui/core ^1.8.0 与 @floating-ui/utils ^0.2.12；登记的 unpackedSize 为 174208 字节，不能等同于浏览器打包体积。

具体用途：computePosition + offset/flip/shift，处理视口/滚动容器边界与翻转平移；autoUpdate 处理滚动、尺寸与布局变化。替换当前手写 calcPosition 与移植版 autoUpdate，减少长期维护专用几何算法。

仍由 Jinge 组件实现：受控状态、触发方式、hover 安全通道、延迟取消、键盘、焦点、嵌套/层级、异步过期保护、资源清理与文档测试。引入此库不自动修好这些问题，也不遮盖框架限制。

替代方案：保留并扩充现有实现。可避免依赖，但需要自行持续维护 clipping ancestors、transform、滚动容器、布局移动等浏览器几何细节和测试矩阵。

复核后建议：先增强现有 Floating，不以新增依赖为前提。现有 autoUpdate 已移植较完整的观察机制，当前明确缺口可在库内修复。此前引入建议改为备选，详见 FLOATING-ASSESSMENT.md；未来若遇到具体复杂场景，再单独申请。

参考：

- https://floating-ui.com/docs/computeposition
- https://floating-ui.com/docs/autoupdate
- https://floating-ui.com/docs/flip
- https://floating-ui.com/docs/shift

## D02：date-fns（历史评估，已不采用）

拟用于 DatePicker / RangePicker / TimePicker 的日历运算、格式化和解析。评估稳定版 date-fns 4.4.0 足够覆盖首轮需求，不必引入 Day.js；建议仅增加 date-fns ^4.4.0 一个运行时依赖，暂不增加时区扩展。MIT，无直接运行时 dependencies。

隔离验证：78 项日期检查和 3 项当前 Jinge Date 集成检查通过；没有安装项目依赖。同类选择器能力入口 gzip 为 date-fns 11.46 KiB、Day.js 加解析/范围插件与中文 5.54 KiB，date-fns 并非在此场景更小。选择理由是 API/值模型适合当前实现、能力完整，不能用“date-fns 一定比 Day.js 轻”作为理由。

具体能力、严格解析/DST/token/Date 响应式约束、体积口径、复现脚本与来源见 [DATE-LIBRARY-ASSESSMENT.md](./DATE-LIBRARY-ASSESSMENT.md)。该建议已由用户选择原生 Temporal 的决定替代，未安装 date-fns。历史算法及体积数据仅供比较。

## D03：原生 Temporal（用户已确认，已实现）

DatePicker/RangePicker 使用 Temporal.PlainDate，TimePicker 使用 Temporal.PlainTime。不引入日期库或 polyfill；能力检测不通过时明确禁用并提示，不隐式回退到 Date。

用户另已授权 Jinge VM 的小范围适配：8 种 Temporal 内置值不做代理，替换值仍正常通知。当前通过复制相邻仓库构建产物验证，没有使用 link。重新安装依赖后需重新同步，正式发布仍需包含该修复的 Jinge 版本；详见 [TEMPORAL.md](./TEMPORAL.md)。
