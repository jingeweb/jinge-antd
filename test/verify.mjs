import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Audit the declared open/fixed regression statuses without weakening normal pnpm test.
// Fixes must update the manifest; missing, skipped or unrelated failures remain errors.
const root = path.resolve(import.meta.dirname, '..');
const results = path.join(root, 'test/.results');
for (const file of ['unit-all.xml', 'e2e.json', 'site.json', 'verification.json']) {
  await rm(path.join(results, file), { force: true });
}
const manifest = JSON.parse(await readFile(path.join(root, 'test/regressions.json'), 'utf8'));
const result = spawnSync(process.execPath, ['test/run.mjs'], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
assert.equal(
  result.status,
  manifest.some((issue) => issue.status !== 'fixed') ? 1 : 0,
  'Full suite exit code must match remaining open issues',
);

const xml = new JSDOM(await readFile(path.join(results, 'unit-all.xml'), 'utf8'), {
  contentType: 'text/xml',
});
const tests = [...xml.window.document.querySelectorAll('testcase')].map((entry) => ({
  name: entry.getAttribute('name'),
  layer: 'unit',
  status: entry.querySelector('failure')
    ? 'failed'
    : entry.querySelector('skipped')
      ? 'skipped'
      : 'passed',
  error: entry.querySelector('failure')?.textContent ?? '',
}));
xml.window.close();
const browser = JSON.parse(await readFile(path.join(results, 'e2e.json'), 'utf8'));
assert.deepEqual(browser.errors, [], 'No global browser/setup errors are allowed');
function walk(suite) {
  for (const spec of suite.specs ?? [])
    for (const entry of spec.tests) {
      assert.equal(entry.results.length, 1, 'Retries must not conceal a failure');
      tests.push({
        name: spec.title,
        layer: 'e2e',
        status: entry.results[0].status,
        error: entry.results[0].error?.message ?? '',
      });
    }
  for (const child of suite.suites ?? []) walk(child);
}
walk(browser);
const site = JSON.parse(await readFile(path.join(results, 'site.json'), 'utf8'));
assert.deepEqual(site.errors, [], 'No global documentation site errors are allowed');
walk(site);
const regressions = [];
const components = [];
for (const entry of tests) {
  const id = /^R\d{2}\b/.exec(entry.name)?.[0];
  if (id) {
    const issue = manifest.find((item) => item.id === id);
    const expected = issue?.status === 'fixed' ? 'passed' : 'failed';
    assert.equal(entry.status, expected, `${id} must match its declared ${issue?.status} status`);
    assert.equal(entry.layer, manifest.find((item) => item.id === id)?.layer);
    if (expected === 'failed')
      assert.match(
        entry.error,
        /AssertionError|expect\(|\.pick\(\)/,
        `${id} must fail on its behavior assertion or the documented Zod pick error`,
      );
    regressions.push({ id, layer: entry.layer, name: entry.name, status: entry.status });
  } else {
    assert.equal(entry.status, 'passed', `Component baseline failed: ${entry.name}`);
    components.push(entry);
  }
}
assert.deepEqual(
  regressions.map((entry) => entry.id).sort(),
  manifest.map((entry) => entry.id).sort(),
);
assert.ok(components.length >= 46, 'Original component baselines and new tests must run');
const summary = {
  components: { total: components.length, passed: components.length },
  regressions: {
    total: regressions.length,
    passed: regressions.filter((entry) => entry.status === 'passed').length,
    failed: regressions.filter((entry) => entry.status === 'failed').length,
    cases: regressions,
  },
};
await writeFile(path.join(results, 'verification.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(
  `\nVerified: ${components.length} component tests pass; regressions: ${summary.regressions.passed} fixed, ${summary.regressions.failed} open.`,
);
