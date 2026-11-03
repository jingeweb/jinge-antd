# 原生 Temporal 日期组件

按用户决定，日期组件只使用原生 Temporal，不增加 date-fns、Day.js 或 polyfill。

## 值与首轮能力

- DatePicker：`Temporal.PlainDate | null`，ISO 公历，年份 0001–9999；日期不附加时间或时区。
- RangePicker：`[Temporal.PlainDate, Temporal.PlainDate] | null`。仅提交完整范围；双月面板、悬浮预览，反向点击自动排序，输入反向范围则拒绝。禁用规则检查端点，不要求区间内每一天可选。
- TimePicker：`Temporal.PlainTime | null`，24 小时、分钟或秒精度；步长、禁用规则及显式确认，不附加当天日期。

日期格式只接受 `yyyy-MM-dd`、`yyyy/MM/dd`、`dd/MM/yyyy`；时间格式只接受 `HH:mm`、`HH:mm:ss`。它们是固定格式选项，不是任意格式模板语言。越界和格式不符保留输入并报无效，不隐式修正。

共同支持受控/默认值、清空、禁用/只读、键盘与焦点、浮层嵌套、原生校验/重置、公开 focus/blur/select。输入在 Enter 或离开整个控件后提交；时间面板点击确定提交。范围只有选齐两端才提交。受控父级拒绝更新时恢复原值。原生表单隐藏字段分别序列化为 ISO 日期、`start/end` 范围、纯时间；不使用 UTC 转换。Form 的等值判断增加 PlainDate/PlainTime 的语义比较，范围递归比较端点。

首轮暂缓日期时间组合选择、月/季度/年专用选择器、开放区间、任意格式解析、自定义日期单元格、非 ISO 日历、固定业务时区、12 小时制、亚秒与时间范围。业务可用原生 API 组合日期和时间；这些能力尚未作为组件契约交付。

## 运行与类型条件

组件会检测原生 Temporal 的日期、时间构造及 Now 能力；不满足时明确提示并禁用，不加载 polyfill。文档示例也先检查能力，避免在不支持的浏览器运行原生值构造。本轮真实浏览器验证为本机 Chrome 156；测试运行时为原生支持 Temporal 的 Node 26.4.0。这不代表其他浏览器或旧版浏览器已验证，应以目标环境能力检测和实际测试为准。

项目 TypeScript 7 使用 `lib: ["ES2022", "DOM", "DOM.Iterable", "ESNext.Temporal"]`。消费声明需要支持该 lib 的 TypeScript，并启用 Temporal 声明；编译类型不提供运行时支持。

## Jinge VM 的必要修复

相邻 `../jinge/src/vm/core.ts` 仅扩展原有内置对象识别：PlainDate、PlainTime、PlainDateTime、PlainYearMonth、PlainMonthDay、Instant、ZonedDateTime、Duration 保持原生实例，不做代理；全局无 Temporal 或只有部分构造器时安全处理。整体替换字段仍正常通知，普通对象继续响应式。不修改 watcher、compiler 或 router，不引入组件私有 VM 规避。

相邻 `test/vm/temporal.test.ts` 增加 10 项验证：旧实现 9 失败、1 通过，修复后 10 通过；完整 Jinge 34 套、351 项通过。jsdom 通过 Node 原生 VM 上下文取得真实 Temporal 值，无 polyfill。本项目另验证实际安装的 Jinge 可保留原生实例和方法，并正常监听替换。

## 本地产物同步与发布前提

本轮使用用户允许的复制方式，没有 link。当前安装的 Jinge 4.2.0 包被相邻仓库同版本构建产物替换；registry 中未含修复的同版本包不能视为已支持。正式发布前需要发布含此修复的 Jinge 并更新组件库的最低依赖版本，当前未擅自编造版本号或发布。

重新安装依赖后，执行：

```sh
cd ../jinge
pnpm build
cd ../jinge-antd
pnpm test:sync-jinge
pnpm test:verify
```

同步后重启开发服务器。`scripts/sync-local-jinge.mjs` 检查源/目标版本相同，复制 prod/dev JS 及 sourcemap；通过临时文件再 rename，避免原地修改 pnpm store 可能共享的硬链接。首次目标原件备份到 `test/.results/jinge-original-runtime/`，源/目标路径及 SHA-256 写入 `test/.results/local-jinge-runtime.json`。备份和报告是被忽略的本地产物。

当前 jinge-antd 未安装 jinge-router。脚本在未来安装 router 后会检查它解析的 Jinge 与项目为同一实际入口，否则拒绝同步，避免两份运行时造成上下文或 VM 身份问题。同步命令是显式开发操作，不在 install/build 时自动覆盖依赖。

## 验证结果

本批新增 29 项普通测试、10 项浏览器组件测试、5 项文档站测试。日期批次交付时，全量 `pnpm test:verify`：518 项正常行为及 19 项原问题回归通过，共 537 项；后续组件的最新总数见 PROGRESS.md。原有 F04/F05/F07/F08/F09/F11/F12 独立框架探针仍为 7 项真实失败，不混入正常组件验收。
