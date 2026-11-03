// Explicit local-development fallback requested by the user. Replace files atomically,
// rather than editing pnpm's potentially hard-linked store files in place.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const entry = await realpath(require.resolve('jinge'));
const installed = path.dirname(path.dirname(entry));
const source = path.resolve(root, '../jinge');
const metadata = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
const targetMetadata = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
assert.equal(
  metadata.version,
  targetMetadata.version,
  'Build and installed Jinge versions must match',
);
let routerEntry;
try {
  routerEntry = require.resolve('jinge-router');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}
if (routerEntry)
  assert.equal(
    await realpath(createRequire(routerEntry).resolve('jinge')),
    entry,
    'Router must use this same Jinge before syncing',
  );
const backup = path.join(root, 'test/.results/jinge-original-runtime');
await mkdir(backup, { recursive: true });
const files = {};
for (const file of ['jinge.prod.js', 'jinge.prod.js.map', 'jinge.dev.js', 'jinge.dev.js.map']) {
  const from = path.join(source, 'dist', file),
    to = path.join(installed, 'dist', file);
  await stat(from);
  try {
    await stat(path.join(backup, file));
  } catch {
    await copyFile(to, path.join(backup, file));
  }
  await copyFile(from, `${to}.local-tmp`);
  await rename(`${to}.local-tmp`, to);
  files[file] = createHash('sha256')
    .update(await readFile(to))
    .digest('hex');
}
const report = {
  source,
  installed,
  version: metadata.version,
  router: routerEntry ?? 'not installed',
  files,
};
await writeFile(
  path.join(root, 'test/.results/local-jinge-runtime.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
