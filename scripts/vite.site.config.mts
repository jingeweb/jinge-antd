import { TailwindThemePlugin } from './vite-plugin';
import { defineConfig } from 'vite';
import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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

  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    TailwindThemePlugin(),
    jingeVitePlugin({
      importAlias: 'source',
      loadDebugNativeBinding: true,
      // intl: {
      //   dropDefaultText: false,
      // },
      // intl: true,
    }),
  ],
});
