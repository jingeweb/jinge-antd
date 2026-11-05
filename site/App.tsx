import { Router, createRouter } from 'jinge-router';

import { DocRoute, NotFound } from './components/DocRoute';
import { DocsLayout } from './components/DocsLayout';
import { routeBase } from './i18n';

const router = createRouter({
  mode: 'html5',
  baseHref: routeBase,
  routes: [
    { path: '/', redirectTo: '/components/button' },
    { path: '/components/:id', component: DocRoute },
    { path: '/*', component: NotFound },
  ],
});
export function App() {
  return (
    <Router router={router}>
      <DocsLayout />
    </Router>
  );
}
