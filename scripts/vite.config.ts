import { defineConfig } from 'vite';
import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, '../src/index.ts'),
      name: 'JingeAntd',
      fileName: 'jinge-antd',
    },
    sourcemap: true,
    outDir: path.resolve(__dirname, '../dist'),
  },

  plugins: [jingeVitePlugin()],
});
