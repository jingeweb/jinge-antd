import { Router, RouterView, createRouter } from 'jinge-router';

import { locale as initialLocale } from './boot';
import { DocRoute, NotFound } from './components/DocRoute';
import { LocaleLayout } from './components/LocaleLayout';
import { base } from './i18n';

const router = createRouter({
  mode: 'html5',
  baseHref: base,
  routes: [
    { path: '/', redirectTo: `/${initialLocale}/components/button` },
    {
      path: '/:locale',
      component: LocaleLayout,
      redirectChild: 'components/button',
      children: [
        { path: '/components/:id', component: DocRoute },
        { path: '/*', component: NotFound },
      ],
    },
  ],
});
export function App() {
  return (
    <Router router={router}>
      <RouterView />
    </Router>
  );
}
