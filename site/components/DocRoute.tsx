import { onMount, onUnmount, t, vm, watch } from 'jinge';
import { RouterHref, useParams, useQuery } from 'jinge-router';

import { catalog } from '../i18n';
import { ui } from '../state';
import { ComponentPage } from './ComponentPage';

export function NotFound() {
  ui.page = undefined;
  document.title = t('未找到组件') + ' · Jinge Antd';
  return (
    <article className="component-page">
      <h1>{t('未找到组件')}</h1>
      <p>{t('请从左侧目录选择组件。')}</p>
      <RouterHref to="/components/button">{t('查看 Button')}</RouterHref>
    </article>
  );
}
export function DocRoute() {
  const params = useParams<{ id: string }>();
  const query = useQuery();
  const state = vm({ doc: catalog.find((doc) => doc.id === params.id) });
  let timer = 0;
  function scroll() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (query.section) document.getElementById(query.section)?.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    }, 30);
  }
  function update() {
    state.doc = catalog.find((doc) => doc.id === params.id);
    ui.page = state.doc;
    ui.menuOpen = false;
    document.title = state.doc
      ? `${state.doc.name}${state.doc.title === state.doc.name ? '' : ' ' + state.doc.title} · Jinge Antd`
      : t('未找到组件') + ' · Jinge Antd';
    scroll();
  }
  update();
  watch(params, 'id', update);
  watch(query, 'section', scroll);
  onMount(scroll);
  onUnmount(() => window.clearTimeout(timer));
  return <>{state.doc ? <ComponentPage doc={state.doc} /> : <NotFound />}</>;
}
