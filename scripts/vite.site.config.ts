import tailwindcss from '@tailwindcss/vite';
import { jingeVitePlugin } from 'jinge-compiler';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

import { TailwindThemePlugin } from './vite-plugin.ts';
const __dirname = import.meta.dirname;

execFileSync(process.execPath, [path.resolve(__dirname, 'intl.mjs')], { stdio: 'inherit' });
const base = process.env.VITE_BASE ?? '/';
if (!base.startsWith('/') || !base.endsWith('/') || base.startsWith('//')) {
  throw new Error('VITE_BASE must be an absolute pathname ending in /');
}
// GitHub Pages serves this document for unknown paths. Restore the URL before mounting.
const pagesFallback: Plugin = {
  name: 'pages-fallback',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '404.html',
      source: `<!doctype html><meta charset="utf-8"><title>Jinge Antd</title><script>location.replace(${JSON.stringify(base)}+'?__jinge_path='+encodeURIComponent(location.pathname+location.search+location.hash))</script>`,
    });
  },
};

export default defineConfig({
  base,
  build: {
    // watch: {},
    minify: false,
    sourcemap: true,
    outDir: path.resolve(__dirname, '../dist-site'),
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ['jinge', 'jinge-router'],
  },
  plugins: [tailwindcss(), TailwindThemePlugin(), jingeVitePlugin({ intl: true }), pagesFallback],
});
