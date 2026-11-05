import { type Dict, intlInit } from 'jinge';

import type { ComponentDoc } from './data/types';

import { base, locale } from './boot';
import { isLocale, stripLocale } from './locale';
export { base, locale };

const dictionaries = import.meta.glob<{ default: Dict }>('./generated/intl/*.tsx');
const catalogs = import.meta.glob<{
  catalog: ComponentDoc[];
  groups: { name: string; items: ComponentDoc[] }[];
}>('./generated/*/data/catalog.ts');
// URL-owned locale: dictionaries, docs and runnable demo sources load before mounting.
export let catalog: ComponentDoc[] = [];
export let groups: { name: string; items: ComponentDoc[] }[] = [];
export const siteReady = Promise.all([
  intlInit({
    defaultLocale: locale,
    dictLoader: (target) =>
      dictionaries[`./generated/intl/${target}.tsx`]().then((module) => module.default),
  }),
  catalogs[`./generated/${locale}/data/catalog.ts`](),
]).then(([, data]) => {
  catalog = data.catalog;
  groups = data.groups;
});

export const routeBase = base.replace(/\/$/, '') + '/' + locale;
export function switchLocale(next: string) {
  if (!isLocale(next) || next === locale) return;
  try {
    localStorage.setItem('jinge-antd-locale', next);
  } catch {
    /* URL remains authoritative. */
  }
  const path = stripLocale(location.pathname.slice(base.length - 1));
  location.assign(base + next + path + location.search + location.hash);
}
