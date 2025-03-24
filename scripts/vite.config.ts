import { defineConfig } from 'vite';
import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, '../src/index.ts'),
      formats: ['es'],
      fileName: 'jinge-antd',
    },
    sourcemap: true,
    outDir: path.resolve(__dirname, '../dist'),
  },
  resolve: {
    external: ['jinge', 'zod'],
  },
  plugins: [jingeVitePlugin()],
});
