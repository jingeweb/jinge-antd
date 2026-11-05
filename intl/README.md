# 文档站国际化与发布

文档站使用 jinge-router 的 HTML5 路由：`/zh-CN/components/button`、`/zh-TW/components/button`、`/en/components/button`。URL 中的语言优先；无语言的入口根据保存的偏好或浏览器语言选择。切换语言保留组件、查询参数和片段，通过整页导航重新加载该语言资源。旧的 `#/components/...` 链接会转换为简中 HTML5 路径。

沿用 jinge-website 的方式：界面使用 jinge `t()`；组件说明与示例通过源码翻译生成各语言模块。启动前异步加载当前语言的字典和目录，示例运行代码与展示的源码来自同一份本地化文件。

- `translate.csv`：站点外壳、代码工具和公共文档界面的翻译。
- `data.csv`：组件介绍、API、使用限制等翻译。
- `demos.csv`：示例中的业务文案翻译。模板中的 `{0}` 等占位符需保留。

修改 `site/components`、`site/data` 或 `site/demos` 后执行 `pnpm intl:extract`，补齐 CSV 中的翻译。`pnpm intl` 生成语言模块，缺少翻译会报错。`pnpm dev-site` / `pnpm build-site` 自动执行生成，不需要额外步骤。`site/generated`（含编译后的字典）是生成产物，不提交版本库；实际翻译源为 CSV。

默认部署在 `/`。子目录部署通过 `VITE_BASE=/jinge-antd/ pnpm build-site` 设置，必须以 `/` 开头和结尾。构建会生成 `404.html`，用于 GitHub Pages 的深层地址回跳与恢复。其他静态服务器应将未知路径回退到 `index.html`。

`.github/workflows/pages.yml` 沿用 jinge-website 的构建、上传、部署流程，推送 main 时发布，PR 只构建；自定义域名 `jinge-antd.embjs.com` 使用根路径 `/` 作为构建基路径。GitHub 仓库 Pages 的发布来源需设置为 GitHub Actions。

组件库 `src` 暂未国际化。其默认按钮、空状态、无障碍标签等仍使用现有文案，详见 `docs/COMPONENT-I18N-REVIEW.md`。
