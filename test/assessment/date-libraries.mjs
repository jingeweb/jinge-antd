// Opt-in dependency assessment. Uses published tarballs in the OS temp directory;
// never installs packages or modifies package.json / pnpm-lock.yaml.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const versions = { 'date-fns': '4.4.0', dayjs: '1.11.23' };
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
async function probe(root) {
  const packages = await json(path.join(root, 'packages.json'));
  const fns = await import(pathToFileURL(path.join(packages['date-fns'].path, 'index.js')).href);
  const { zhCN } = await import(
    pathToFileURL(path.join(packages['date-fns'].path, 'locale/zh-CN.js')).href
  );
  const results = [];
  const check = (name, fn) => {
    fn();
    results.push(name);
  };
  const reference = new Date(2000, 0, 1);
  function strict(input, pattern = 'yyyy-MM-dd') {
    const value = fns.parse(input, pattern, reference, { locale: zhCN });
    return fns.isValid(value) && fns.format(value, pattern, { locale: zhCN }) === input
      ? value
      : null;
  }
  check('valid leap day', () => assert.ok(strict('2024-02-29')));
  check('reject non-leap day', () => assert.equal(strict('2025-02-29'), null));
  check('reject overflowing date', () => assert.equal(strict('2024-02-31'), null));
  check('reject month zero', () => assert.equal(strict('2024-00-01'), null));
  check('reject day zero', () => assert.equal(strict('2024-01-00'), null));
  check('reject unpadded input with exact format', () => assert.equal(strict('2024-2-9'), null));
  check('reject trailing input', () => assert.equal(strict('2024-02-29x'), null));
  check('reject empty input', () => assert.equal(strict(''), null));
  check('valid time', () => assert.ok(strict('23:59:59', 'HH:mm:ss')));
  check('reject hour overflow', () => assert.equal(strict('24:00:00', 'HH:mm:ss'), null));
  check('reject minute overflow', () => assert.equal(strict('23:60:00', 'HH:mm:ss'), null));
  check('reject second overflow', () => assert.equal(strict('23:59:60', 'HH:mm:ss'), null));
  check('reject malformed format without silent normalization', () =>
    assert.throws(() => strict('23 AM', 'HH a'), RangeError),
  );
  check('month end clamps in leap year', () =>
    assert.equal(fns.format(fns.addMonths(new Date(2024, 0, 31), 1), 'yyyy-MM-dd'), '2024-02-29'),
  );
  check('month end clamps in common year', () =>
    assert.equal(fns.format(fns.addMonths(new Date(2025, 0, 31), 1), 'yyyy-MM-dd'), '2025-02-28'),
  );
  check('month end backward', () =>
    assert.equal(fns.format(fns.addMonths(new Date(2025, 2, 31), -1), 'yyyy-MM-dd'), '2025-02-28'),
  );
  check('year change clamps leap day', () =>
    assert.equal(fns.format(fns.addYears(new Date(2024, 1, 29), 1), 'yyyy-MM-dd'), '2025-02-28'),
  );
  check('calendar start obeys Monday setting', () =>
    assert.equal(fns.startOfWeek(new Date(2026, 10, 3), { weekStartsOn: 1 }).getDay(), 1),
  );
  check('fixed 42 day grid crosses year boundary', () => {
    const start = fns.startOfWeek(fns.startOfMonth(new Date(2026, 0, 1)), { weekStartsOn: 1 });
    const days = fns.eachDayOfInterval({ start, end: fns.addDays(start, 41) });
    assert.equal(days.length, 42);
    assert.equal(days[0].getFullYear(), 2025);
  });
  check('range comparison includes boundaries', () =>
    assert.equal(
      fns.isWithinInterval(new Date(2026, 0, 1), {
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 3),
      }),
      true,
    ),
  );
  check('calendar day arithmetic crosses spring DST', () => {
    const before = new Date(2026, 2, 7, 12),
      next = fns.addDays(before, 1);
    assert.equal(next.getDate(), 8);
    assert.equal(next.getHours(), 12);
    assert.equal(fns.differenceInCalendarDays(next, before), 1);
    assert.equal((next - before) / 3600000, process.env.TZ === 'America/New_York' ? 23 : 24);
  });
  check('calendar day arithmetic crosses autumn DST', () => {
    const before = new Date(2026, 9, 31, 12),
      next = fns.addDays(before, 1);
    assert.equal(next.getDate(), 1);
    assert.equal(next.getHours(), 12);
    assert.equal((next - before) / 3600000, process.env.TZ === 'America/New_York' ? 25 : 24);
  });
  check('nonexistent local datetime is rejected by round trip', () => {
    const value = strict('2026-03-08 02:30', 'yyyy-MM-dd HH:mm');
    assert.equal(value === null, process.env.TZ === 'America/New_York');
  });
  check('operations clone the input Date', () => {
    const source = new Date(2026, 0, 31),
      stamp = source.getTime(),
      result = fns.addMonths(source, 1);
    assert.notEqual(result, source);
    assert.equal(source.getTime(), stamp);
  });
  check('Chinese locale month and weekday labels', () =>
    assert.equal(fns.format(new Date(2026, 10, 3), 'MMMM EEEE', { locale: zhCN }), '十一月 星期二'),
  );
  check('small years are preserved', () =>
    assert.equal(fns.format(strict('0099-01-01'), 'yyyy-MM-dd'), '0099-01-01'),
  );
  return {
    timeZone: process.env.TZ,
    passed: results.length,
    cases: results,
    observations: {
      permissiveWidth: fns.isValid(fns.parse('2024-2-9', 'yyyy-MM-dd', reference)),
      fallbackAmbiguousTime:
        process.env.TZ === 'America/New_York'
          ? strict('2026-11-01 01:30', 'yyyy-MM-dd HH:mm').toISOString()
          : null,
    },
  };
}
if (process.argv[2] === '--probe') {
  process.stdout.write(JSON.stringify(await probe(process.argv[3])));
} else {
  let root = process.argv[2];
  if (!root) {
    root = await mkdtemp(path.join(tmpdir(), 'jinge-date-assessment-'));
    const packages = {};
    for (const [name, version] of Object.entries(versions)) {
      const response = await fetch(`https://registry.npmjs.org/${name}/${version}`);
      if (!response.ok) throw new Error(`Registry returned ${response.status}`);
      const metadata = await response.json();
      const archive = Buffer.from(await (await fetch(metadata.dist.tarball)).arrayBuffer());
      const destination = path.join(root, name);
      await mkdir(destination);
      const file = path.join(root, `${name}.tgz`);
      await writeFile(file, archive);
      execFileSync('tar', ['-xzf', file, '-C', destination]);
      packages[name] = {
        version,
        license: metadata.license,
        dependencies: metadata.dependencies ?? {},
        unpackedSize: metadata.dist.unpackedSize,
        tarballBytes: archive.length,
        path: path.join(destination, 'package'),
      };
    }
    await writeFile(path.join(root, 'packages.json'), JSON.stringify(packages, null, 2));
  }
  const packages = await json(path.join(root, 'packages.json'));
  const results = ['Asia/Shanghai', 'UTC', 'America/New_York'].map((zone) => {
    const child = spawnSync(process.execPath, [import.meta.filename, '--probe', root], {
      env: { ...process.env, TZ: zone },
      encoding: 'utf8',
    });
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(child.stdout);
  });
  const fns = packages['date-fns'].path,
    day = packages.dayjs.path;
  const operations = [
    'addDays',
    'addMonths',
    'addYears',
    'startOfDay',
    'startOfWeek',
    'startOfMonth',
    'endOfMonth',
    'getDaysInMonth',
    'getDay',
    'getYear',
    'getMonth',
    'set',
    'isValid',
    'isSameDay',
    'isBefore',
    'isAfter',
    'isWithinInterval',
    'differenceInCalendarDays',
    'eachDayOfInterval',
    'format',
    'parse',
  ];
  const entries = {
    'date-fns-picker': `import { ${operations.join(',')} } from ${JSON.stringify(path.join(fns, 'index.js'))};\nimport { zhCN } from ${JSON.stringify(path.join(fns, 'locale/zh-CN.js'))};\nexport const picker = { ${operations.join(',')}, zhCN };`,
    'dayjs-picker': `import dayjs from ${JSON.stringify(path.join(day, 'dayjs.min.js'))};\nimport parse from ${JSON.stringify(path.join(day, 'plugin/customParseFormat.js'))};\nimport between from ${JSON.stringify(path.join(day, 'plugin/isBetween.js'))};\nimport locale from ${JSON.stringify(path.join(day, 'locale/zh-cn.js'))};\ndayjs.extend(parse);dayjs.extend(between);export { dayjs, locale };`,
    'date-fns-format-only': `export { format } from ${JSON.stringify(path.join(fns, 'format.js'))};`,
  };
  // Check the installed runtime with native Date values; no Jinge/compiler changes.
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><body></body>');
  for (const name of ['window', 'document', 'Node', 'Element', 'HTMLElement'])
    globalThis[name] =
      name === 'window' ? dom.window : name === 'document' ? dom.window.document : dom.window[name];
  globalThis.OffscreenCanvas = class OffscreenCanvas {};
  const runtime = await import('jinge');
  const original = new Date(2026, 0, 1),
    state = runtime.vm({ value: original });
  let notifications = 0;
  const stop = runtime.vmWatch(state, 'value', () => {
    notifications++;
  });
  assert.equal(runtime.isViewModel(state.value), false);
  original.setDate(2);
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(notifications, 0);
  state.value = new Date(2026, 0, 3);
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(notifications, 1);
  stop();
  dom.window.close();
  const jingeDateIntegration = {
    passed: 3,
    cases: [
      'native Date stays outside VM proxying',
      'mutating Date internals is not reactive',
      'replacing Date instance notifies watchers',
    ],
  };
  const bundles = {};
  for (const [name, source] of Object.entries(entries)) {
    const entry = path.join(root, `${name}.js`);
    await writeFile(entry, source);
    const output = await build({
      configFile: false,
      logLevel: 'silent',
      root,
      resolve: { alias: { dayjs: path.join(day, 'dayjs.min.js') } },
      build: {
        write: false,
        minify: true,
        target: 'es2022',
        lib: { entry, formats: ['es'] },
        rolldownOptions: { output: { minify: true } },
      },
    });
    const all = (Array.isArray(output) ? output : [output])
      .flatMap((entry) => entry.output)
      .filter((entry) => entry.type === 'chunk')
      .map((entry) => entry.code)
      .join('\n');
    bundles[name] = {
      minifiedBytes: Buffer.byteLength(all),
      gzipBytes: gzipSync(all, { level: 9 }).length,
    };
  }
  const report = {
    assessedOn: new Date().toISOString(),
    node: process.version,
    vite: '8.3.5',
    packages: Object.fromEntries(
      Object.entries(packages).map(([name, { path: _packagePath, ...metadata }]) => [
        name,
        metadata,
      ]),
    ),
    probes: results,
    jingeDateIntegration,
    totalPassed: results.reduce((sum, entry) => sum + entry.passed, 0),
    bundles,
    bundleScope:
      'Isolated ESM capability surface; no picker UI, no timezone plugins. date-fns exports 21 named helpers + zh-CN; dayjs exports core + customParseFormat + isBetween + zh-cn. Not a performance or universal size ranking.',
  };
  await mkdir('test/.results', { recursive: true });
  await writeFile('test/.results/date-assessment.json', JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
