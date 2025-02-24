import { defineConfig } from 'vite';
import { jingeVitePlugin } from 'jinge-compiler';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // watch: {},
    minify: false,
    // sourcemap: true,

    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },

  plugins: [
    tailwindcss(),
    jingeVitePlugin({
      importAlias: 'source',
      loadDebugNativeBinding: true,
      intl: {
        dropDefaultText: false,
      },
    }),
  ],
});
