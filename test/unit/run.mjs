import { jingeVitePlugin } from 'jinge-compiler';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');
await build({
  configFile: false,
  root,
  logLevel: 'warn',
  plugins: [jingeVitePlugin()],
  build: {
    outDir: 'test/.compiled/unit',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'test/fixtures/components.tsx',
      formats: ['es'],
      fileName: () => 'components.js',
    },
    rollupOptions: { external: ['jinge', 'zod'] },
  },
});
if (process.argv.includes('--prepare-only')) process.exit(0);
const suite = process.argv[2];
if (suite && !['components', 'regressions'].includes(suite))
  throw new Error(`Unknown suite: ${suite}`);
const componentNames = readdirSync(import.meta.dirname)
  .filter((name) => name.endsWith('.test.mjs') && name !== 'regressions.test.mjs')
  .map((name) => name.slice(0, -9))
  .sort();
const names =
  suite === 'regressions'
    ? ['regressions']
    : suite === 'components'
      ? componentNames
      : [...componentNames, 'regressions'];
const files = names.map((name) => `test/unit/${name}.test.mjs`);
mkdirSync(path.join(root, 'test/.results'), { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    '--test',
    '--test-concurrency=1',
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    '--test-reporter=junit',
    `--test-reporter-destination=test/.results/unit-${suite ?? 'all'}.xml`,
    ...files,
  ],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
