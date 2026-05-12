import tailwindcss from '@tailwindcss/vite';
import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';
import { defineConfig } from 'vite';

import { TailwindThemePlugin } from './vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
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
  },
  plugins: [tailwindcss(), TailwindThemePlugin(), jingeVitePlugin()],
});
