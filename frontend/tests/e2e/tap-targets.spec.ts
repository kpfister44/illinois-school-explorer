// ABOUTME: End-to-end test for touch target sizes
// ABOUTME: Verifies every control on every page is at least 44px in both directions

import { test, expect, type Page } from '@playwright/test';
import { ELK_GROVE_HIGH, PAGES, ROLLING_MEADOWS_HIGH, openPage, seedComparison } from './pages';

const MINIMUM_SIZE = 44;
const CONTROLS =
  'a[href], button, input, select, [role="button"], [role="tab"], [role="combobox"], [role="option"]';

async function undersizedControls(page: Page): Promise<string[]> {
  return page.locator(CONTROLS).evaluateAll((elements, minimum) => {
    return elements
      .filter((element) => {
        const isLinkInRunningText = element.matches('p a');
        const box = element.getBoundingClientRect();
        const isRendered = box.width > 0 && box.height > 0;
        return isRendered && !isLinkInRunningText && (box.width < minimum || box.height < minimum);
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        const label = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40);
        return `${element.tagName.toLowerCase()} "${label}" ${Math.round(box.width)}x${Math.round(box.height)}`;
      });
  }, MINIMUM_SIZE);
}

test.beforeEach(async ({ page }) => {
  await seedComparison(page, [ELK_GROVE_HIGH, ROLLING_MEADOWS_HIGH]);
});

for (const { name, path } of PAGES) {
  test(`${name} page controls are large enough to tap`, async ({ page }) => {
    await openPage(page, path);

    expect(await undersizedControls(page)).toEqual([]);
  });
}

test('school page history sheets are large enough to tap', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  for (const control of ['See every year', 'English learners history', 'Enrollment history']) {
    await page.getByRole('button', { name: control }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    expect(await undersizedControls(page)).toEqual([]);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  }
});

test('similar schools list is large enough to tap', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);
  await page.getByRole('button', { name: 'See similar schools' }).click();
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(25);

  expect(await undersizedControls(page)).toEqual([]);
});

test('search suggestions are large enough to tap', async ({ page }) => {
  await openPage(page, '/');
  await page.getByPlaceholder(/school, city or district/i).fill('elk grove');
  await expect(page.getByRole('option').first()).toBeVisible();

  expect(await undersizedControls(page)).toEqual([]);
});

test('top scores filter choices are large enough to tap', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the filter is a dropdown on phones only');
  await openPage(page, '/top-scores');
  await page.getByRole('combobox', { name: 'Ranking' }).click();
  await expect(page.getByRole('option').first()).toBeVisible();

  expect(await undersizedControls(page)).toEqual([]);
});
