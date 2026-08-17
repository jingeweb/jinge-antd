import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';
import { defineConfig } from 'vite';
const __dirname = import.meta.dirname;

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, '../src/index.ts'),
      formats: ['es'],
      fileName: 'jinge-antd',
    },
    sourcemap: true,
    outDir: path.resolve(__dirname, '../dist'),
    rollupOptions: {
      external: ['jinge', 'zod'],
    },
  },

  plugins: [jingeVitePlugin()],
});
