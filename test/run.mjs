import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const suite = process.argv[2];
if (suite && !['components', 'regressions'].includes(suite))
  throw new Error(`Unknown suite: ${suite}`);
let failed = false;
for (const args of [
  ['test/unit/run.mjs', ...(suite ? [suite] : [])],
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'test/e2e/playwright.config.mjs',
    ...(suite === 'regressions'
      ? ['regressions.spec.mjs']
      : suite === 'components'
        ? [
            'components.spec.mjs',
            'button.spec.mjs',
            'floating.spec.mjs',
            'overlays.spec.mjs',
            'dialogs.spec.mjs',
            'notices.spec.mjs',
            'display.spec.mjs',
            'containers.spec.mjs',
            'feedback.spec.mjs',
            'inputs.spec.mjs',
            'choices.spec.mjs',
            'selects.spec.mjs',
            'forms.spec.mjs',
            'navigation.spec.mjs',
            'data.spec.mjs',
            'pickers.spec.mjs',
            'upload.spec.mjs',
            'hierarchy.spec.mjs',
          ]
        : []),
  ],
  ...(suite === 'regressions'
    ? []
    : [['node_modules/@playwright/test/cli.js', 'test', '--config', 'test/e2e/site.config.mjs']]),
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
