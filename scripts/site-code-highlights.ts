import type { Plugin } from 'vite';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHighlighter, type BundledLanguage } from 'shiki';

type Renderer = { highlight(code: string, language: string): string; dispose(): void };
/** Keep raw text for copying, and load build-generated HTML only when code is displayed. */
async function createRenderer(): Promise<Renderer> {
  const highlighter = await createHighlighter({
    themes: ['github-light'],
    langs: ['tsx', 'typescript', 'css', 'shell'],
  });
  return {
    highlight(code, language) {
      return highlighter.codeToHtml(code, {
        lang: language as BundledLanguage,
        theme: 'github-light',
        transformers: [
          {
            pre(node) {
              // Keep the documentation's code-block background and the token colors.
              node.properties.style = String(node.properties.style ?? '').replace(
                /background-color:[^;]+;?/g,
                '',
              );
            },
          },
        ],
      });
    },
    dispose: () => highlighter.dispose(),
  };
}
export function siteCodeHighlights(): Plugin {
  const root = path.resolve(import.meta.dirname, '..');
  const generated = path.join(root, 'site/generated') + path.sep;
  const snippets = path.join(root, 'site/snippets') + path.sep;
  const registry = path.join(root, 'site/highlights.ts');
  let renderer: Promise<Renderer> | undefined;
  return {
    name: 'site-code-highlights',
    enforce: 'pre',
    async load(id) {
      const index = id.indexOf('?');
      if (index < 0) return;
      const query = new URLSearchParams(id.slice(index + 1));
      if (!query.has('raw') && !query.has('site-highlight')) return;
      const file = path.normalize(id.slice(0, index));
      if (
        !(file.startsWith(generated) && file.includes(`${path.sep}demos${path.sep}`)) &&
        !file.startsWith(snippets)
      )
        return;
      const extension = path.extname(file.endsWith('.txt') ? file.slice(0, -4) : file);
      const language = (
        { '.tsx': 'tsx', '.ts': 'typescript', '.css': 'css', '.sh': 'shell' } as Record<
          string,
          string
        >
      )[extension];
      if (!language) return;
      this.addWatchFile(file);
      const source = await readFile(file, 'utf8');
      if (query.has('site-highlight')) {
        renderer ??= createRenderer();
        return `export default ${JSON.stringify((await renderer).highlight(source, language))};`;
      }
      return `import { registerHighlight } from ${JSON.stringify(registry)};\nconst source = ${JSON.stringify(source)};\nregisterHighlight(source, ${JSON.stringify(language)}, () => import(${JSON.stringify(file + '?site-highlight')}).then(module => module.default));\nexport default source;`;
    },
    async closeBundle() {
      if (renderer) (await renderer).dispose();
    },
  };
}
