import { onMount, onUnmount, t, vm, watch } from 'jinge';
import { RouterHref, useParams, useQuery } from 'jinge-router';

import type { ComponentDoc } from '../data/types';

import { language } from '../i18n';
import { ui } from '../state';
import { ComponentPage } from './ComponentPage';
import { IconPage } from './IconPage';

export function NotFound() {
  const i18n = language;
  function update() {
    ui.page = undefined;
    document.title = t('未找到组件') + ' · Jinge Antd';
  }
  update();
  watch(i18n, 'edition', update);
  return (
    <article className="component-page">
      <h1>{t('未找到组件')}</h1>
      <p>{t('请从左侧目录选择组件。')}</p>
      <RouterHref to={`/${i18n.edition.locale}/components/button`}>{t('查看 Button')}</RouterHref>
    </article>
  );
}
function DocContent(props: { doc?: ComponentDoc }) {
  return (
    <>
      {props.doc ? (
        props.doc.id === 'icon' ? (
          <IconPage doc={props.doc} />
        ) : (
          <ComponentPage doc={props.doc} />
        )
      ) : (
        <NotFound />
      )}
    </>
  );
}
export function DocRoute() {
  const params = useParams<{ id: string }>();
  const query = useQuery();
  const i18n = language;
  function page() {
    return {
      locale: i18n.edition.locale,
      doc: i18n.edition.catalog.find((doc) => doc.id === params.id),
    };
  }
  const state = vm({ pages: [page()] });
  let timer = 0;
  let routeScrollPending = false;
  function scroll() {
    routeScrollPending = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      routeScrollPending = false;
      const anchor = query.section || location.hash.slice(1);
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    }, 30);
  }
  function update(resetScroll = true) {
    const current = page(),
      position = window.scrollY;
    state.pages = [current];
    ui.page = current.doc;
    ui.menuOpen = false;
    document.title = current.doc
      ? `${current.doc.name}${current.doc.title === current.doc.name ? '' : ' ' + current.doc.title} · Jinge Antd`
      : t('未找到组件') + ' · Jinge Antd';
    // A simultaneous route change must finish its anchor/top scroll before preserving locale-only scroll.
    if (resetScroll || routeScrollPending) scroll();
    else {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => window.scrollTo({ top: position, behavior: 'instant' }), 30);
    }
  }
  update();
  watch(params, 'id', () => update());
  watch(i18n, 'edition', () => update(false));
  watch(query, 'section', scroll);
  onMount(scroll);
  onUnmount(() => window.clearTimeout(timer));
  return (
    <>
      {/* A locale key recreates demo state/static slots and unmounts pending demo timers/portals. */}
      {state.pages.map((item) => (
        <DocContent key={item.locale} doc={item.doc} />
      ))}
    </>
  );
}
