# 日期算法库评估（2026-11-03）

当前决策：用户已选择原生 Temporal，不采用 date-fns、Day.js 或 polyfill，组件已实施。实际值模型、范围及运行条件见 [TEMPORAL.md](./TEMPORAL.md)。以下保留当时对第三方日期库的能力和体积评估，不再是实施建议；未安装这些日期依赖。

## 能力与选型

本次核对 npm registry 稳定版：date-fns 4.4.0、Day.js 1.11.23，二者均为 MIT，登记的直接运行时 dependencies 均为空。没有选择 date-fns 5 的预发布版本。

| 组件需求                 | date-fns 覆盖                                                         | 组件仍需实现                                           |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------ |
| 日/月/年切换、闰年与月末 | addDays/addMonths/addYears、startOfMonth/endOfMonth/getDaysInMonth    | 面板切换、焦点日期及上下界                             |
| 月历与跨年相邻日期       | startOfWeek、eachDayOfInterval、getDay、weekStartsOn                  | 42 格日历、禁用/选中样式和键盘导航                     |
| 范围选择、比较及预览     | isBefore/isAfter/isSameDay/isWithinInterval、differenceInCalendarDays | 双面板、起止草稿、预览、确认、禁用规则                 |
| 输入、展示及时间         | parse/format/isValid、set                                             | 严格校验、清空、IME、禁用时间、步长及提交状态          |
| 中文、英文与周起始日     | 显式导入 locale，逐次传入 locale/weekStartsOn                         | 组件文案、ARIA 文本、默认周起始策略                    |
| 指定 IANA 时区           | v4 可通过 @date-fns/tz 扩展                                           | 当前路线暂缓；将来另行评估、确认依赖和定义歧义时间策略 |

React Ant Design 官方也提供 date-fns 的 generatePicker<Date> 用法。这是可行性旁证；Jinge 组件仍自行实现交互，不引入 React picker 或 rc-component。

选择 date-fns 的主要理由是本轮能力完整、按函数使用、公开值可使用原生 Date，并且不需要把 Dayjs 实例或插件体系传给业务。Day.js 同样可行：已有业务强依赖其值类型/API，或对新增体积特别敏感时，可以作为备选；没有“必须引入 Day.js 才能做日期组件”的技术前提。

## 隔离实测

只将发布 tarball 下载解压到系统临时目录，用项目已有 Vite 8.3.5 构建；没有执行安装、包脚本或修改依赖清单。测试通过直接导入临时包运行。

复现：`node test/assessment/date-libraries.mjs`。脚本固定版本，使用 Node 及系统 tar、已有 Vite/jsdom/Jinge；联网获取 tarball，不安装依赖。可传入含 packages.json 的既有临时快照目录以复用下载。输出 `test/.results/date-assessment.json`，不会纳入普通组件或框架测试计数。

- Asia/Shanghai、UTC、America/New_York 分别 26 项，共 **78 项日期检查通过**。
- 涵盖合法/非法闰日、年月日越界、格式宽度/尾部字符、时分秒越界、月末前后移动、闰年加年、周起始、42 天跨年网格、范围边界、年份 0099、中文月份/星期及输入 Date 不被修改。
- 纽约跨春季/秋季夏令时的“加一天”分别是 23/25 小时，日历日期及中午时间仍正确。组件必须使用日历运算，不能用固定 86400000 毫秒模拟下一天。
- 纽约不存在的 `2026-03-08 02:30` 经格式回写比较后拒绝；秋季重复的 `2026-11-01 01:30` 会按 Date 的本地规则选中较早时刻，不能据此宣称支持时区歧义消解。固定业务时区及重复时刻选择不属于首轮范围。
- 额外 **3 项当前已安装 Jinge 的集成检查通过**：原生 Date 不被 VM 代理、修改 Date 内部不通知 watcher、整体换 Date 实例正常通知。现有 Form 的 cloneValue/equalValue 已专门处理 Date 克隆及毫秒比较。

这些检查验证本轮所需算法及具体边界，不等于覆盖全部时区、历史历法或完整日期组件交互。

### 打包体积

测试条件：Vite 8.3.5、ES2022、独立 ESM 库入口、minify、gzip level 9。date-fns 保留 21 个常用选择器函数及 zh-CN；Day.js 保留 core、customParseFormat、isBetween、zh-cn。均不含 UI 或指定时区扩展；Day.js 中日历枚举等操作需要少量组件侧循环，未计入入口。此数据比较依赖能力面，不能等同最终组件增量，也不是性能比较。

| 入口                               | minify 字节 | gzip 字节 | gzip 约值 |
| ---------------------------------- | ----------: | --------: | --------: |
| date-fns 选择器函数 + 中文         |      47,220 |    11,734 | 11.46 KiB |
| Day.js core + 解析/范围插件 + 中文 |      13,819 |     5,673 |  5.54 KiB |
| date-fns 仅 format（另测）         |      19,225 |     5,431 |  5.30 KiB |

因此，date-fns 的“轻量”应理解为可按实际函数裁剪；对于需要 parse/format 的这组能力，它并不比 Day.js 更小。registry 中解压包体积约 10.9 MB 与 0.68 MB，包含类型、locale 等文件，不能据此推算浏览器体积。后续组件实际集成后还要核验最终增量和未使用日期组件时的 tree shaking。

## 历史方案的实施约束（已被 Temporal 方案替代）

1. 公共日期值首选原生 Date；内部统一工具函数处理格式和比较，不在 JSX 中直接调用依赖 this 的实例方法（已知 F02）。输入/默认值和输出做边界克隆，状态更新始终整体赋新 Date。
2. 日期值、日期时间和纯时间分别定义语义。纯日期的后端字符串使用本地 `yyyy-MM-dd` 等明确格式，不经 `toISOString().slice(0,10)` 隐式转换成 UTC 日期；纯时间不隐式附加当天日期作为业务语义。
3. date-fns 使用 Unicode token：`yyyy-MM-dd`，不能把 Day.js 的 `YYYY-MM-DD` 直接当成等价格式；不做简单字符串替换来假装兼容两套 token。
4. parse 能接受不补零输入，不能只凭 isValid 当作精确格式校验。本轮采用 parse + isValid + 同格式回写比较；对不支持的 token/RangeError 转成输入或配置错误，不让组件抛出未捕获异常。解析使用明确、固定的参考日期，避免未填写字段依赖运行当天。
5. 按命名函数与单一 locale 导入，不导入全 locale、不修改全局默认设置；中文文案与日期算法 locale 解耦。库内部依赖不强迫使用者传入 date-fns 对象。
6. 日期库只负责运算，不负责 Floating、受控状态、输入草稿、范围提交、键盘/ARIA、disabledDate/disabledTime、表单重置或生命周期；这些仍逐个编写普通、浏览器和站点测试。
7. 首轮不引入 @date-fns/tz、@date-fns/utc 或 Day.js。未来若有固定业务时区需求，另行定义值模型、DST gap/fold 策略并确认扩展，不把增加时区需求自动等同于必须改用 Day.js。

## 历史建议（不再待确认）

当时建议仅引入 date-fns ^4.4.0；用户随后决定使用原生 Temporal。该依赖建议已关闭，不需要再次确认。

来源：

- [date-fns 仓库](https://github.com/date-fns/date-fns)、[稳定发布](https://github.com/date-fns/date-fns/releases)
- [Unicode token 说明](https://github.com/date-fns/date-fns/blob/main/pkgs/core/docs/unicodeTokens.md)、[parse 实现与说明](https://github.com/date-fns/date-fns/blob/main/pkgs/core/src/parse/index.ts)
- [时区支持与扩展](https://github.com/date-fns/date-fns/blob/main/pkgs/core/docs/timeZones.md)
- [Day.js 自定义格式与严格解析](https://day.js.org/docs/en/parse/string-format)
- [Ant Design 自定义日期库](https://ant.design/docs/react/use-custom-date-library/)
- npm registry 的 date-fns/4.4.0、dayjs/1.11.23 发布元数据及临时 tarball（实测脚本固定版本）
