import { type Dict, intlInit, intlSetLocale, vm } from 'jinge';

import type { ComponentDoc } from './data/types';

import { base, locale as initialLocale } from './boot';
import { isLocale, stripLocale, type Locale } from './locale';
export { base };

type Edition = {
  locale: Locale;
  catalog: ComponentDoc[];
  groups: { name: string; items: ComponentDoc[] }[];
};
const dictionaries = import.meta.glob<{ default: Dict }>('./generated/intl/*.tsx');
const catalogs = import.meta.glob<Omit<Edition, 'locale'>>('./generated/*/data/catalog.ts');
const dictionaryCache = new Map<string, Promise<Dict>>();
const catalogCache = new Map<Locale, Promise<Omit<Edition, 'locale'>>>();
function dictionary(target: string) {
  let pending = dictionaryCache.get(target);
  if (!pending) {
    pending = dictionaries[`./generated/intl/${target}.tsx`]().then((module) => module.default);
    dictionaryCache.set(target, pending);
    void pending.catch(() => dictionaryCache.delete(target));
  }
  return pending;
}
function catalog(target: Locale) {
  let pending = catalogCache.get(target);
  if (!pending) {
    pending = catalogs[`./generated/${target}/data/catalog.ts`]();
    catalogCache.set(target, pending);
    void pending.catch(() => catalogCache.delete(target));
  }
  return pending;
}
export const language = vm({
  edition: { locale: initialLocale, catalog: [], groups: [] } as Edition,
  loading: false,
  failed: false,
});
// The initial language is ready before mounting; other languages remain lazy modules.
export const siteReady = Promise.all([
  intlInit({ defaultLocale: initialLocale, dictLoader: dictionary }),
  catalog(initialLocale),
]).then(([, data]) => {
  language.edition = { locale: initialLocale, ...data };
});
let request = 0;
export async function activateLocale(target: Locale) {
  const current = ++request;
  language.failed = false;
  if (target === language.edition.locale) {
    language.loading = false;
    return 'ready';
  }
  language.loading = true;
  try {
    // Preload both resources before intlSetLocale, so failures cannot leave a half-translated page.
    const [, data] = await Promise.all([dictionary(target), catalog(target)]);
    if (current !== request) return 'stale';
    await intlSetLocale(target);
    if (current !== request) return 'stale';
    document.documentElement.lang = target;
    language.edition = { locale: target, ...data };
    language.loading = false;
    try {
      localStorage.setItem('jinge-antd-locale', target);
    } catch {
      /* URL remains authoritative. */
    }
    return 'ready';
  } catch {
    if (current !== request) return 'stale';
    language.loading = false;
    language.failed = true;
    return 'failed';
  }
}
export function languagePath(target: Locale) {
  const path = stripLocale(location.pathname.slice(base.length - 1));
  return '/' + target + path + location.search + location.hash;
}
type Navigate = (to: string, options: { replace: boolean }) => void;
export async function switchLocale(next: string, navigate: Navigate) {
  if (!isLocale(next)) return;
  if ((await activateLocale(next)) === 'ready') {
    // Use the router's replace API: it calls history.replaceState and synchronizes router state.
    navigate(languagePath(next), { replace: true });
  }
}
