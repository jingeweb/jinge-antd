import { test, expect } from './fixtures.mjs';

test('Floating closes immediately after mounting without waiting for an enter timer', async ({
  page,
}) => {
  await page.goto('/?case=floating');
  await page.locator('#lab-trigger').click();
  await page.locator('#rapid-close').click({ force: true });
  await expect(page.locator('.ja-floating')).toHaveCount(0);
  await page.locator('#lab-trigger').click();
  await expect(page.locator('.ja-floating')).toBeVisible();
  await page.locator('#lab-trigger').click();
  await expect(page.locator('.ja-floating')).toHaveCount(0);
});
test('Floating reacts to placement and offset and flips against a viewport edge', async ({
  page,
}) => {
  await page.goto('/?case=floating');
  await page.locator('#lab-trigger').click();
  await expect(page.locator('.ja-floating')).toHaveAttribute('data-placement', 'bottom');
  await page.evaluate(() => {
    window.testApp.lab.placement = 'top';
    window.testApp.lab.offset = 20;
  });
  await expect(page.locator('.ja-floating')).toHaveAttribute('data-placement', 'top');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const a = document.querySelector('#lab-trigger').getBoundingClientRect(),
          b = document.querySelector('.ja-floating').getBoundingClientRect();
        return Math.abs(a.top - b.bottom - 20);
      }),
    )
    .toBeLessThan(1);
  await page.locator('#lab-anchor').evaluate((el) => {
    el.style.cssText = 'position:fixed;left:8px;top:200px';
  });
  await page.evaluate(() => {
    window.testApp.lab.placement = 'left-start';
  });
  await expect(page.locator('.ja-floating')).toHaveAttribute('data-placement', 'right-start');
});
test('Floating keeps oversized content in the viewport with internal scrolling, including after resize', async ({
  page,
}) => {
  await page.goto('/?case=floating');
  await page.evaluate(() => {
    window.testApp.lab.wide = true;
  });
  await page.locator('#lab-trigger').click();
  const bounds = () =>
    page.locator('.ja-floating').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.left >= 7 &&
        r.top >= 7 &&
        r.right <= document.documentElement.clientWidth - 7 &&
        r.bottom <= innerHeight - 7 &&
        el.scrollHeight > el.clientHeight
      );
    });
  await expect.poll(bounds).toBe(true);
  await page.setViewportSize({ width: 700, height: 500 });
  await expect.poll(bounds).toBe(true);
});
test('Floating follows an ancestor scroll container', async ({ page }) => {
  await page.goto('/?case=scroll');
  await page.locator('#scroll-trigger').click();
  await expect(page.locator('.ja-floating')).toBeVisible();
  const gap = () =>
    page.evaluate(() => {
      const a = document.querySelector('#scroll-trigger').getBoundingClientRect(),
        b = document.querySelector('.ja-floating').getBoundingClientRect();
      return Math.abs(b.top - a.bottom - 10);
    });
  await expect.poll(gap).toBeLessThan(1);
  await page.locator('#scroll-box').evaluate((el) => {
    el.scrollTop += 40;
  });
  await expect.poll(gap).toBeLessThan(1);
});
test('Floating hover supports travelling to content and back on a scrolled page', async ({
  page,
}) => {
  await page.goto('/?case=polygon');
  await page.evaluate(() => scrollTo(0, 700));
  await page.locator('#polygon-trigger').hover();
  await expect(page.locator('#polygon-content')).toBeVisible();
  await page.locator('#polygon-content').hover();
  await expect(page.locator('#polygon-content')).toBeVisible();
  await page.locator('#polygon-trigger').hover();
  await expect(page.locator('#polygon-content')).toBeVisible();
  await page.mouse.move(900, 600);
  await expect(page.locator('#polygon-content')).toHaveCount(0);
});
test('Nested Floating portals preserve the parent and Escape dismisses the topmost child only', async ({
  page,
}) => {
  await page.goto('/?case=nested');
  await page.locator('#parent-trigger').click();
  await page.locator('#child-trigger').click();
  await page.locator('#child-action').click();
  await expect(page.locator('.ja-floating')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-floating')).toHaveCount(1);
  await expect(page.locator('#child-trigger')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ja-floating')).toHaveCount(0);
  await expect(page.locator('#parent-trigger')).toBeFocused();
});
test('Floating closes when disabled and stops reacting to its trigger', async ({ page }) => {
  await page.goto('/?case=floating');
  await page.locator('#lab-trigger').click();
  await expect(page.locator('.ja-floating')).toBeVisible();
  await page.evaluate(() => {
    window.testApp.lab.disabled = true;
  });
  await expect(page.locator('.ja-floating')).toHaveCount(0);
  await page.locator('#lab-trigger').click();
  await expect(page.locator('.ja-floating')).toHaveCount(0);
});
