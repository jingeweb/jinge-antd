import { jingeVitePlugin } from 'jinge-compiler';
import path from 'node:path';
import { build, preview } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');
// Test a real production build, using only this project's declared dependencies.
const config = {
  configFile: false,
  root: path.join(import.meta.dirname, 'app'),
  logLevel: 'warn',
  plugins: [jingeVitePlugin()],
  build: { outDir: path.join(root, 'test/.compiled/e2e'), emptyOutDir: true, sourcemap: true },
};
await build(config);
const server = await preview({
  ...config,
  preview: { host: '127.0.0.1', port: 5198, strictPort: true },
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    server.httpServer.close(() => process.exit(0));
  });
