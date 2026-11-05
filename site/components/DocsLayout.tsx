import { t } from 'jinge';
import { RouterHref, RouterLink, RouterView } from 'jinge-router';

import type { ComponentDoc } from '../data/types';

import { catalog, groups, locale, switchLocale } from '../i18n';
import { ui } from '../state';
function matches(doc: ComponentDoc, search: string) {
  return `${doc.name} ${doc.title} ${doc.description}`
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}
function hasMatches(items: ComponentDoc[], search: string) {
  return items.some((doc) => matches(doc, search));
}

export function DocsLayout() {
  const state = ui;
  return (
    <div className="docs-shell">
      <a
        className="skip-link"
        href="#main-content"
        on:click={(evt) => {
          evt.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {t('跳到内容')}
      </a>
      <header className="docs-header">
        <RouterHref to="/components/button" className="brand">
          <span className="brand-mark" aria-hidden="true">
            J
          </span>
          <strong>Jinge Antd</strong>
        </RouterHref>
        <span className="header-divider" />
        <span className="header-section">{t('组件文档')}</span>
        <span className="header-caption">{t('为 PC 中台构建')}</span>
        <select
          className="language-select"
          aria-label={t('语言')}
          value={locale}
          on:change={(event) => switchLocale(event.target.value)}
        >
          <option value="zh-CN" lang="zh-CN">
            简体中文
          </option>
          <option value="zh-TW" lang="zh-TW">
            繁體中文
          </option>
          <option value="en" lang="en">
            English
          </option>
        </select>
        <button
          className="mobile-menu"
          type="button"
          aria-label={t('切换组件导航')}
          aria-expanded={state.menuOpen}
          on:click={() => {
            state.menuOpen = !state.menuOpen;
          }}
        >
          ☰
        </button>
      </header>
      <aside
        className={state.menuOpen ? 'docs-sidebar open' : 'docs-sidebar'}
        aria-label={t('组件目录')}
      >
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label={t('搜索组件')}
            placeholder={t('搜索组件…')}
            value={state.search}
            on:input={(evt) => {
              state.search = evt.target.value;
            }}
          />
        </label>
        <nav aria-label={t('组件导航')}>
          {groups.map((group) => (
            <section key={group.name} hidden={!hasMatches(group.items, state.search)}>
              <h2>{group.name}</h2>
              {group.items.map((doc) => (
                <div key={doc.id} hidden={!matches(doc, state.search)}>
                  <RouterLink to={`/components/${doc.id}`}>
                    {(link) => (
                      <a
                        href={link.href}
                        className={link.exactActive ? 'nav-link active' : 'nav-link'}
                        aria-current={link.exactActive ? 'page' : undefined}
                      >
                        <span>
                          {doc.name}
                          <small>{doc.title}</small>
                        </span>
                        <span
                          className={doc.status === 'ready' ? 'status-dot ready' : 'status-dot'}
                          title={doc.status === 'ready' ? t('已交付') : t('待实现')}
                        />
                      </a>
                    )}
                  </RouterLink>
                </div>
              ))}
            </section>
          ))}
        </nav>
        {!hasMatches(catalog, state.search) && (
          <p className="search-empty">{t('没有匹配的组件')}</p>
        )}
        <div className="sidebar-legend">
          <span className="status-dot ready" />
          {t('已交付')}
          <span className="status-dot" />
          {t('待实现')}
        </div>
      </aside>
      <main id="main-content" className="docs-main" tabIndex={-1}>
        <RouterView />
        <footer className="docs-footer">{t('Jinge Antd · 实现、示例与测试同步演进')}</footer>
      </main>
      {state.page?.status === 'ready' && (
        <aside className="docs-toc" aria-label={t('本页目录')}>
          <span>{t('本页内容')}</span>
          <RouterHref to={`/components/${state.page?.id}?section=examples`}>
            {t('代码演示')}
          </RouterHref>
          <RouterHref to={`/components/${state.page?.id}?section=api`}>API</RouterHref>
          <RouterHref to={`/components/${state.page?.id}?section=notes`}>
            {t('说明与限制')}
          </RouterHref>
        </aside>
      )}
    </div>
  );
}
