import { defineConfig } from 'vite';
import { jingeVitePlugin } from 'jinge-compiler';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import { TailwindThemePlugin } from './vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // watch: {},
    minify: false,
    sourcemap: true,
    outDir: path.resolve(__dirname, '../dist-site'),
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
