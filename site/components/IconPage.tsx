import { t } from 'jinge';

import type { ComponentDoc } from '../data/types';

import install from '../snippets/icon-install.sh.txt?raw';
import stylesheet from '../snippets/icon-style.css.txt?raw';
import usage from '../snippets/icon-usage.tsx.txt?raw';
import { CodeBlock } from './CodeBlock';
import { DemoCard } from './DemoCard';

export function IconPage(props: { doc: ComponentDoc }) {
  return (
    <article className="component-page icon-guide">
      <div className="page-category">
        {props.doc.category} / {props.doc.name}
      </div>
      <h1>
        {props.doc.name} {props.doc.title !== props.doc.name && <span>{props.doc.title}</span>}
      </h1>
      <p className="page-description">{props.doc.description}</p>
      <h2 id="setup">{t('安装与使用')}</h2>
      <p>
        {t(
          '推荐使用 @iconify-json/ant-design，获取完整的 Ant Design 图标数据；搭配 @iconify/tailwind4，在构建时按需生成图标 CSS，随业务产物一起发布，无需运行时请求图标服务。',
        )}
      </p>
      <p>{t('以下以已配置 Tailwind CSS 4 的项目为例，先安装图标集与插件：')}</p>
      <CodeBlock code={install} language="shell" className="icon-guide-code" />
      <p>{t('在引入 Tailwind 的 CSS 入口中启用插件，并确保应用已引入该 CSS 文件：')}</p>
      <CodeBlock code={stylesheet} language="css" className="icon-guide-code" />
      <p>{t('在业务 TSX 中直接使用静态图标类名，用字号控制尺寸、文字颜色控制单色图标的颜色：')}</p>
      <CodeBlock code={usage} language="tsx" className="icon-guide-code" />
      <p className="section-hint">
        {t(
          '图标类名应完整写在源码中，避免运行时拼接导致 Tailwind 无法扫描。装饰图标使用 aria-hidden；有意义的图标或纯图标按钮需要提供可访问名称。',
        )}
      </p>
      <h2 id="editor">Iconify Search</h2>
      <p>
        {t(
          '推荐在 VS Code 中安装 Iconify Search（发布者 geekabe），直接在编辑器内浏览、搜索、预览和收藏图标，并复制代码或插入当前文件。',
        )}
      </p>
      <p>
        <a
          href="https://github.com/jingeweb/vscode-extension-iconify-search"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('查看 Iconify Search 插件')}
        </a>
        {' · '}
        <a
          href="https://marketplace.visualstudio.com/items?itemName=geekabe.iconify-search"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('从 VS Code Marketplace 安装')}
        </a>
      </p>
      <p>
        {t(
          '打开 VS Code 命令面板，搜索 Iconify，进入搜索或浏览界面。选择 Ant Design 图标后，可在详情中插入代码；用于 Jinge TSX 时，将插件的代码类型配置为 Tailwind CSS React（使用 className）。',
        )}
      </p>
      <h2 id="examples">{t('常用图标')}</h2>
      <DemoCard demo={props.doc.demos[0]} />
      <p className="icon-guide-more">
        {t('更多图标请前往')}{' '}
        <a
          href="https://icon-sets.iconify.design/ant-design/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Ant Design 图标全集')}
        </a>
        {t('查看，并通过 Iconify Search 插件直接插入业务代码。')}
      </p>
    </article>
  );
}
