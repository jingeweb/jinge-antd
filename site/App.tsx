import { onMount, onUnmount, registerEvent, vm } from 'jinge';

import { ComponentPage } from './components/ComponentPage';
import { catalog, groups, matches, hasMatches, resolveRoute } from './data/catalog';

export function App() {
  const state = vm({
    search: '',
    page: resolveRoute(location.hash) ?? catalog[0],
    notFound: false,
    menuOpen: false,
  });
  let scrollTimer = 0;
  function navigate() {
    const page = resolveRoute(location.hash);
    state.notFound = !!location.hash && !page;
    if (page) state.page = page;
    state.menuOpen = false;
    document.title = `${state.page.name} ${state.page.title} · Jinge Antd`;
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const section = new URLSearchParams(location.hash.split('?')[1]).get('section');
      if (section) document.getElementById(section)?.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    }, 30);
  }
  onMount(() => {
    if (!location.hash) history.replaceState(null, '', '#/components/button');
    navigate();
    return registerEvent(window, 'hashchange', navigate);
  });
  onUnmount(() => window.clearTimeout(scrollTimer));
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
        跳到内容
      </a>
      <header className="docs-header">
        <a href="#/components/button" className="brand">
          <span className="brand-mark" aria-hidden="true">
            J
          </span>
          <strong>Jinge Antd</strong>
        </a>
        <span className="header-divider" />
        <span className="header-section">组件文档</span>
        <span className="header-caption">为 PC 中台构建</span>
        <button
          className="mobile-menu"
          type="button"
          aria-label="切换组件导航"
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
        aria-label="组件目录"
      >
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="搜索组件"
            placeholder="搜索组件…"
            value={state.search}
            on:input={(evt) => {
              state.search = evt.target.value;
            }}
          />
        </label>
        <nav aria-label="组件导航">
          {groups.map((group) => (
            <section
              key={group.name}
              hidden={hasMatches(group.items, state.search) ? undefined : true}
            >
              <h2>{group.name}</h2>
              {group.items.map((doc) => (
                <a
                  key={doc.id}
                  href={`#/components/${doc.id}`}
                  hidden={matches(doc, state.search) ? undefined : true}
                  className={state.page.id === doc.id ? 'nav-link active' : 'nav-link'}
                  aria-current={state.page.id === doc.id ? 'page' : undefined}
                >
                  <span>
                    {doc.name}
                    <small>{doc.title}</small>
                  </span>
                  <span
                    className={doc.status === 'ready' ? 'status-dot ready' : 'status-dot'}
                    title={doc.status === 'ready' ? '已交付' : '待实现'}
                  />
                </a>
              ))}
            </section>
          ))}
        </nav>
        {!hasMatches(catalog, state.search) && <p className="search-empty">没有匹配的组件</p>}
        <div className="sidebar-legend">
          <span className="status-dot ready" />
          已交付
          <span className="status-dot" />
          待实现
        </div>
      </aside>
      <main id="main-content" className="docs-main" tabIndex={-1}>
        {state.notFound ? (
          <article className="component-page">
            <h1>未找到组件</h1>
            <p>请从左侧目录选择组件。</p>
            <a href="#/components/button">查看 Button</a>
          </article>
        ) : (
          <ComponentPage doc={state.page} />
        )}
        <footer className="docs-footer">Jinge Antd · 实现、示例与测试同步演进</footer>
      </main>
      {state.page.status === 'ready' && !state.notFound && (
        <aside className="docs-toc" aria-label="本页目录">
          <span>本页内容</span>
          <a href={`#/components/${state.page.id}?section=examples`}>代码演示</a>
          <a href={`#/components/${state.page.id}?section=api`}>API</a>
          <a href={`#/components/${state.page.id}?section=notes`}>说明与限制</a>
        </aside>
      )}
    </div>
  );
}
