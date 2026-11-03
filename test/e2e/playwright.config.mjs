import { defineConfig } from '@playwright/test';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: [
    'components.spec.mjs',
    'regressions.spec.mjs',
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
  ],
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 15000,
  expect: { timeout: 1500 },
  outputDir: path.join(root, 'test/.results/e2e-artifacts'),
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(root, 'test/.results/e2e.json') }],
    ['html', { outputFolder: path.join(root, 'test/.results/e2e-report'), open: 'never' }],
  ],
  use: {
    browserName: 'chromium',
    // Uses locally installed Chrome by default; set PLAYWRIGHT_CHANNEL=chromium for Playwright's browser.
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    baseURL: 'http://127.0.0.1:5198',
    headless: true,
    viewport: { width: 1000, height: 800 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `"${process.execPath}" "${import.meta.dirname}/server.mjs"`,
    url: 'http://127.0.0.1:5198',
    timeout: 30000,
    reuseExistingServer: false,
  },
});
