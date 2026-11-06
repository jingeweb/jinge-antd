# 文档站国际化与发布

文档站使用 jinge-router 的 HTML5 路由：`/zh-CN/components/button`、`/zh-TW/components/button`、`/en/components/button`。URL 中的语言优先；无语言的入口根据保存的偏好或浏览器语言选择。切换语言保留组件、查询参数和片段，通过路由的 replace API 更新地址，不刷新浏览器，也不新增历史记录。旧的 `#/components/...` 链接会转换为简中 HTML5 路径。

沿用 jinge-website 的方式：界面使用 jinge `t()`；组件说明与示例通过源码翻译生成各语言模块。启动前异步加载当前语言的字典和目录，示例运行代码与展示的源码来自同一份本地化文件。

- `translate.csv`：站点外壳、代码工具和公共文档界面的翻译。
- `data.csv`：组件介绍、API、使用限制等翻译。
- `demos.csv`：示例中的业务文案翻译。模板中的 `{0}` 等占位符需保留。

修改 `site/components`、`site/data` 或 `site/demos` 后执行 `pnpm intl:extract`，补齐 CSV 中的翻译。`pnpm intl` 生成语言模块，缺少翻译会报错。`pnpm dev-site` / `pnpm build-site` 自动执行生成，不需要额外步骤。`site/generated`（含编译后的字典）是生成产物，不提交版本库；实际翻译源为 CSV。

默认部署在 `/`。子目录部署通过 `VITE_BASE=/jinge-antd/ pnpm build-site` 设置，必须以 `/` 开头和结尾。构建会生成 `404.html`，用于 GitHub Pages 的深层地址回跳与恢复。其他静态服务器应将未知路径回退到 `index.html`。

`.github/workflows/pages.yml` 沿用 jinge-website 的构建、上传、部署流程，推送 main 时发布，PR 只构建；自定义域名 `jinge-antd.embjs.com` 使用根路径 `/` 作为构建基路径。GitHub 仓库 Pages 的发布来源需设置为 GitHub Actions。

组件库 `src` 暂未国际化。其默认按钮、空状态、无障碍标签等仍使用现有文案，详见 `docs/COMPONENT-I18N-REVIEW.md`。

文档站的代码块通过 Shiki 在 Vite 构建时高亮。示例源码仍由 `?raw` 提供，保持复制内容不变；高亮 HTML 单独分包，展开代码时才加载。浏览器不加载 Shiki、语法库或 WASM。`site/snippets` 中的固定片段以 `.tsx.txt`、`.css.txt`、`.sh.txt` 区分语言；统一使用 `CodeBlock` 渲染。

顶部语言选择使用组件库的 `Dropdown`。切换时按需加载并缓存目标语言的字典、目录和本地化 demo 模块，加载成功后调用 Jinge 的 `intlSetLocale`，同步更新文档、导航、`html.lang` 和标题；使用 jinge-router 的 replace 导航（内部为 `history.replaceState`），浏览器前进、后退也会同步语言。

顶部、侧栏与搜索状态保留。组件页面按语言设置 key，切换时重新挂载 demo 和代码工具，重置示例状态并执行旧示例的卸载清理，使固定插槽、初始化文案和展示源码都对应新语言。过期加载结果不会覆盖后续选择；资源加载失败时保留当前语言、地址和示例，并提示失败。
