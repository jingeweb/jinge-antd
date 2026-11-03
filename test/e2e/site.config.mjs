import { defineConfig } from '@playwright/test';
import path from 'node:path';

import base from './playwright.config.mjs';
const root = path.resolve(import.meta.dirname, '../..');
export default defineConfig({
  ...base,
  testMatch: 'site.spec.mjs',
  outputDir: path.join(root, 'test/.results/site-artifacts'),
  reporter: [['list'], ['json', { outputFile: path.join(root, 'test/.results/site.json') }]],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5199', viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: `"${process.execPath}" "${import.meta.dirname}/site-server.mjs"`,
    url: 'http://127.0.0.1:5199',
    timeout: 30000,
    reuseExistingServer: false,
  },
});
