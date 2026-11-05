import { isLocale, preferredLocale, type Locale } from './locale';

export const base = import.meta.env.BASE_URL;
const url = new URL(location.href);
const restored = url.searchParams.get('__jinge_path');
if (restored) {
  const target = new URL(restored, location.origin);
  if (target.origin === location.origin && target.pathname.startsWith(base)) {
    history.replaceState(null, '', target.pathname + target.search + target.hash);
  }
}
let path = location.pathname.slice(base.length - 1) || '/';
const legacy = location.hash.match(/^#\/components\/([^?]+)(.*)$/);
if (legacy) {
  path = '/zh-CN/components/' + legacy[1];
  history.replaceState(null, '', base + path.slice(1) + legacy[2]);
}
if (!isLocale(path.split('/')[1] ?? '')) {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('jinge-antd-locale');
  } catch {
    /* Storage is optional. */
  }
  path =
    '/' +
    preferredLocale(stored, navigator.language) +
    (path === '/' ? '/components/button' : path);
  history.replaceState(null, '', base + path.slice(1) + location.search + location.hash);
}
export const locale = path.split('/')[1] as Locale;
document.documentElement.lang = locale;
