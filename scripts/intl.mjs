import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { parseCsv, writeCsv } from './csv.mjs';
import { sourceStrings } from './source-i18n.mjs';
const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const locales = ['zh-CN', 'zh-TW', 'en'];
const extract = process.argv.includes('--extract');
const bin = (name) =>
  path.join(root, 'node_modules/.bin', name + (process.platform === 'win32' ? '.cmd' : ''));
async function readOr(file, fallback) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}
async function save(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  if ((await readOr(file, '')) !== text) await writeFile(file, text);
}
await save(
  'intl/translate.csv',
  await readOr('intl/translate.csv', 'id,file,orig,zh-CN,zh-TW,en\n'),
);
execFileSync(
  bin('intl-extract'),
  ['--lang', locales.join(','), '--csv', 'intl/translate.csv', 'site/components'],
  { stdio: 'pipe' },
);
const missing = [];
const generated = [];
for (const row of parseCsv(await readFile('intl/translate.csv', 'utf8')).slice(1))
  for (const [index, locale] of locales.entries())
    if (!row[index + 3]) missing.push(`${locale}: ${row[2]}`);
for (const folder of ['data', 'demos']) {
  const file = `intl/${folder}.csv`;
  const existing = new Map(
    parseCsv(await readOr(file, 'source,zh-TW,en\n'))
      .slice(1)
      .map((row) => [row[0], row]),
  );
  const inputs = await Promise.all(
    (await readdir(`site/${folder}`))
      .filter((name) => /\.tsx?$/.test(name))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map(async (name) => ({ name, source: await readFile(`site/${folder}/${name}`, 'utf8') })),
  );
  const keys = [
    ...new Set(
      inputs.flatMap(
        (input) =>
          sourceStrings(input.source, input.name, undefined, {
            preserveDefaults: folder === 'data',
          }).strings,
      ),
    ),
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const rows = keys.map((key) => existing.get(key) ?? [key, '', '']);
  await save(file, writeCsv([['source', 'zh-TW', 'en'], ...rows]));
  const table = new Map(rows.map((row) => [row[0], row]));
  for (const row of rows)
    for (const [index, locale] of ['zh-TW', 'en'].entries())
      if (!row[index + 1]) missing.push(`${locale}: ${row[0]}`);
      else if (
        JSON.stringify(
          [...row[0].matchAll(/\{\d+\}/g)]
            .map((match) => match[0])
            .sort((a, b) => a.localeCompare(b)),
        ) !==
        JSON.stringify(
          [...row[index + 1].matchAll(/\{\d+\}/g)]
            .map((match) => match[0])
            .sort((a, b) => a.localeCompare(b)),
        )
      ) {
        missing.push(`${locale}: template placeholders differ: ${row[0]}`);
      }
  if (!extract && !missing.length)
    for (const locale of locales)
      for (const input of inputs) {
        const translated =
          locale === 'zh-CN'
            ? input.source
            : sourceStrings(
                input.source,
                input.name,
                (value) => table.get(value)?.[locale === 'en' ? 2 : 1] ?? '',
                { preserveDefaults: folder === 'data' },
              ).source;
        // Only write complete translations; never generate a silently empty document.
        if (!missing.length)
          generated.push([`site/generated/${locale}/${folder}/${input.name}`, translated]);
      }
}
if (extract) {
  console.log(`Extracted site strings. ${missing.length} translations need attention.`);
  process.exit(0);
}
if (missing.length)
  throw new Error(`Missing ${missing.length} translations:\n${missing.slice(0, 30).join('\n')}`);
for (const [file, source] of generated) await save(file, source);
await mkdir('site/generated/intl', { recursive: true });
execFileSync(
  bin('intl-compile'),
  ['--csv', 'intl/translate.csv', '--output-dir', 'site/generated/intl'],
  {
    stdio: 'pipe',
  },
);
console.log('Generated site UI, docs and demo sources for zh-CN / zh-TW / en.');
