export const locales = ['zh-CN', 'zh-TW', 'en'] as const;
export type Locale = (typeof locales)[number];
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
export function preferredLocale(stored: string | null, language: string): Locale {
  if (stored && isLocale(stored)) return stored;
  const parts = language.toLowerCase().replaceAll('_', '-').split('-');
  if (parts[0] !== 'zh') return 'en';
  return parts.some((part) => ['hant', 'tw', 'hk', 'mo'].includes(part)) ? 'zh-TW' : 'zh-CN';
}
export function stripLocale(path: string) {
  return path.replace(/^\/(zh-CN|zh-TW|en)(?=\/|$)/, '') || '/';
}
