// ABOUTME: End-to-end test for the visual theme
// ABOUTME: Verifies colours in light and dark mode, self-hosted fonts, and that no page scrolls sideways

import { test, expect } from '@playwright/test';
import { ELK_GROVE_HIGH, PAGES, ROLLING_MEADOWS_HIGH, openPage, seedComparison } from './pages';

const THEMES = [
  { scheme: 'light', paper: 'rgb(244, 246, 249)', ink: 'rgb(20, 33, 58)' },
  { scheme: 'dark', paper: 'rgb(14, 21, 36)', ink: 'rgb(232, 236, 244)' },
] as const;

test.beforeEach(async ({ page }) => {
  await seedComparison(page, [ELK_GROVE_HIGH, ROLLING_MEADOWS_HIGH]);
});

for (const theme of THEMES) {
  for (const { name, path } of PAGES) {
    test(`${name} page uses paper and ink in ${theme.scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme.scheme });
      await openPage(page, path);

      const body = page.locator('body');
      await expect(body).toHaveCSS('background-color', theme.paper);
      await expect(body).toHaveCSS('color', theme.ink);
    });
  }
}

for (const { name, path } of PAGES) {
  test(`${name} page fits the screen width`, async ({ page }) => {
    await openPage(page, path);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('interface text is Schibsted Grotesk with tabular numerals', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const body = page.locator('body');
  await expect(body).toHaveCSS('font-family', /^"Schibsted Grotesk Variable"/);
  await expect(body).toHaveCSS('font-variant-numeric', 'tabular-nums');
});

test('school names and headlines are Newsreader', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  await expect(page.getByRole('heading', { name: 'Elk Grove High School' })).toHaveCSS(
    'font-family',
    /^"Newsreader Variable"/
  );
});

test('fonts load from the site itself', async ({ page }) => {
  const fontHosts = new Set<string>();
  page.on('response', (response) => {
    if (response.request().resourceType() === 'font') {
      fontHosts.add(new URL(response.url()).host);
    }
  });

  await openPage(page, `/school/${ELK_GROVE_HIGH}`);
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      text: document.fonts.check('16px "Schibsted Grotesk Variable"'),
      headline: document.fonts.check('16px "Newsreader Variable"'),
    };
  });

  expect(loaded).toEqual({ text: true, headline: true });
  expect([...fontHosts]).toEqual([new URL(page.url()).host]);
});
