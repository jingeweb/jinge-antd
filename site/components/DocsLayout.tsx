import { t } from 'jinge';
import { RouterHref, RouterLink, RouterView } from 'jinge-router';

import type { ComponentDoc } from '../data/types';

import { language } from '../i18n';
import { ui } from '../state';
import { LanguageMenu } from './LanguageMenu';
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
  const i18n = language;
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
        <RouterHref to={`/${i18n.edition.locale}/components/button`} className="brand">
          <span className="brand-mark" aria-hidden="true">
            J
          </span>
          <strong>Jinge Antd</strong>
        </RouterHref>
        <span className="header-divider" />
        <span className="header-section">{t('组件文档')}</span>
        <span className="header-caption">{t('为 PC 中台构建')}</span>
        <div className="header-actions">
          <LanguageMenu />
          <a
            className="header-icon-action"
            href="https://github.com/jingeweb/jinge-antd"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <span className="icon-[ant-design--github-outlined] text-xl" aria-hidden="true" />
          </a>
        </div>
        <button
          className="mobile-menu"
          type="button"
          aria-label={t('切换组件导航')}
          aria-expanded={state.menuOpen}
          on:click={() => {
            state.menuOpen = !state.menuOpen;
          }}
        >
          <span
            className={
              state.menuOpen
                ? 'icon-[ant-design--close-outlined] shrink-0 text-xl'
                : 'icon-[ant-design--menu-outlined] shrink-0 text-xl'
            }
            aria-hidden="true"
          />
        </button>
      </header>
      <aside
        className={state.menuOpen ? 'docs-sidebar open' : 'docs-sidebar'}
        aria-label={t('组件目录')}
      >
        <label className="search-box">
          <span
            className="icon-[ant-design--search-outlined] shrink-0 text-lg"
            aria-hidden="true"
          />
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
          {i18n.edition.groups.map((group) => (
            <section key={group.name} hidden={!hasMatches(group.items, state.search)}>
              <h2>{group.name}</h2>
              {group.items.map((doc) => (
                <div key={doc.id} hidden={!matches(doc, state.search)}>
                  <RouterLink to={`/${i18n.edition.locale}/components/${doc.id}`}>
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
                      </a>
                    )}
                  </RouterLink>
                </div>
              ))}
            </section>
          ))}
        </nav>
        {!hasMatches(i18n.edition.catalog, state.search) && (
          <p className="search-empty">{t('没有匹配的组件')}</p>
        )}
      </aside>
      <main id="main-content" className="docs-main" tabIndex={-1}>
        <RouterView />
        <footer className="docs-footer">{t('Jinge Antd · 由 AI 主导实现组件库和文档站')}</footer>
      </main>
      {state.page?.status === 'ready' && (
        <aside className="docs-toc" aria-label={t('本页目录')}>
          <span>{t('本页内容')}</span>
          {state.page?.id === 'icon' ? (
            <>
              <RouterHref to={`/${i18n.edition.locale}/components/icon?section=setup`}>
                {t('安装与使用')}
              </RouterHref>
              <RouterHref to={`/${i18n.edition.locale}/components/icon?section=editor`}>
                Iconify Search
              </RouterHref>
              <RouterHref to={`/${i18n.edition.locale}/components/icon?section=examples`}>
                {t('常用图标')}
              </RouterHref>
            </>
          ) : (
            <>
              <RouterHref
                to={`/${i18n.edition.locale}/components/${state.page?.id}?section=examples`}
              >
                {t('代码演示')}
              </RouterHref>
              <RouterHref to={`/${i18n.edition.locale}/components/${state.page?.id}?section=api`}>
                API
              </RouterHref>
              <RouterHref to={`/${i18n.edition.locale}/components/${state.page?.id}?section=notes`}>
                {t('说明与限制')}
              </RouterHref>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
