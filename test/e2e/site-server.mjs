import path from 'node:path';
import { build, preview } from 'vite';
const root = path.resolve(import.meta.dirname, '../..');
const config = {
  configFile: path.join(root, 'scripts/vite.site.config.ts'),
  root,
  logLevel: 'warn',
  build: { outDir: path.join(root, 'test/.compiled/site'), emptyOutDir: true },
};
await build(config);
const server = await preview({
  ...config,
  preview: { host: '127.0.0.1', port: 5199, strictPort: true },
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.httpServer.close(() => process.exit(0)));
