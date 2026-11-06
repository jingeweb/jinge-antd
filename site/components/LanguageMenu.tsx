import { context, t } from 'jinge';
import { useNavigate } from 'jinge-router';

import { Z_CONTEXT } from '../../src/_util/z';
import { Dropdown } from '../../src/dropdown';
import { language, switchLocale } from '../i18n';
import { ui } from '../state';

const options = [
  { value: 'zh-CN', label: '简体中文', 'slot:label': () => <span lang="zh-CN">简体中文</span> },
  { value: 'zh-TW', label: '繁體中文', 'slot:label': () => <span lang="zh-TW">繁體中文</span> },
  { value: 'en', label: 'English', 'slot:label': () => <span lang="en">English</span> },
];

export function LanguageMenu() {
  // Match the fixed header's layer; scope this context to the language popup only.
  context(Z_CONTEXT, 100);
  const state = language;
  const navigate = useNavigate();
  return (
    <>
      <Dropdown
        className="language-menu-popup"
        ariaLabel={t('语言')}
        placement="bottom-end"
        options={options}
        value={state.edition.locale}
        on:change={(value) => {
          void switchLocale(value, navigate);
        }}
        on:openChange={(open) => {
          if (open) ui.menuOpen = false;
        }}
      >
        <button
          className="header-icon-action language-menu-trigger"
          type="button"
          aria-busy={state.loading}
          aria-label={t('语言')}
          title={t('语言')}
        >
          <span className="icon-[ant-design--translation-outlined] text-xl" aria-hidden="true" />
        </button>
      </Dropdown>
      {state.failed && (
        <span className="language-load-error" role="alert">
          {t('语言资源加载失败，当前语言未更改。')}
        </span>
      )}
    </>
  );
}
