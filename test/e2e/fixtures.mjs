import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  browserErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'Browser fixture should not throw unrelated runtime errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
