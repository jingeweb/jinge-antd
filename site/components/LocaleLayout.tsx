import { watch } from 'jinge';
import { useNavigate, useParams } from 'jinge-router';

import { activateLocale, language, languagePath } from '../i18n';
import { isLocale } from '../locale';
import { DocsLayout } from './DocsLayout';

/** The shell survives locale changes, including browser back/forward navigation. */
export function LocaleLayout() {
  const params = useParams<{ locale: string }>();
  const navigate = useNavigate();
  function update() {
    const target = params.locale;
    if (!isLocale(target)) {
      navigate(languagePath(language.edition.locale), { replace: true });
      return;
    }
    if (target === language.edition.locale && !language.loading) return;
    void activateLocale(target).then((result) => {
      if (result === 'failed' && params.locale === target) {
        navigate(languagePath(language.edition.locale), { replace: true });
      }
    });
  }
  watch(params, 'locale', update);
  update();
  return <DocsLayout />;
}
