import { readFile, writeFile } from 'node:fs/promises';

import { type PluginOption } from 'vite';
import { getTailwindThemeCss } from '../src/_tool/colors';

import path from 'node:path';

export function TailwindThemePlugin(): PluginOption {
  const themeCss = getTailwindThemeCss();
  return {
    name: 'tailwind-theme-generator',
    async config(config) {
      const css = await readFile(
        path.resolve(__dirname, '../site/tailwind.css'),
        'utf-8',
      );

      await writeFile(
        path.resolve(__dirname, '../site/style.css'),
        css.replace('/* GENERATED_THEME */', themeCss),
      );
      return config;
    },
  };
}
