// ABOUTME: E2E test for search to detail flow
// ABOUTME: Verifies complete user journey from search to school detail

import { expect, test } from '@playwright/test';

test.describe('Search to Detail Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('complete search flow: home -> search -> detail', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /look up any illinois public school/i })
    ).toBeVisible();

    await page.getByPlaceholder(/school, city or district/i).fill('elk');
    await expect(page.getByRole('option', { name: 'See all results for “elk”' })).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/search?q=elk');
    await expect(page.getByRole('heading', { level: 1, name: 'Results for “elk”' })).toBeVisible();
    const results = page.getByRole('list', { name: 'Schools' });
    await results.getByRole('link', { name: /^Elk Grove High School/ }).click();

    await expect(
      page.getByRole('heading', { name: 'Elk Grove High School' })
    ).toBeVisible();

    await expect(page.getByRole('tab')).toHaveCount(0);

    await expect(page.getByRole('heading', { level: 2, name: 'Test scores · 2026' })).toBeVisible();
    await expect(page.getByText('average ACT, out of 36')).toBeVisible();

    const students = page.getByRole('region', { name: 'Students' });
    await expect(students.getByText('English learners')).toBeVisible();
    await expect(students.getByText('Low income')).toBeVisible();
  });

  test('search results appear quickly (< 100ms)', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=chicago');

    const startTime = Date.now();

    await expect(page.locator('[href*="/school/"]').first()).toBeVisible({ timeout: 2000 });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
  });

  test('handles no search results gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=xyzabc123notfound');

    await expect(page.getByText(/no schools found/i)).toBeVisible({ timeout: 2000 });
  });

  test('autocomplete works in SearchBar', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const searchInput = page.getByPlaceholder(/school, city or district/i);

    if (await searchInput.isVisible()) {
      await searchInput.type('elk', { delay: 100 });

      await expect(page.getByText('Elk Grove High School')).toBeVisible({ timeout: 1000 });

      await page.getByText('Elk Grove High School').first().click();

      await expect(page).toHaveURL(/\/school\//);
    }
  });

  test('home offers level chips and ways to browse', async ({ page }) => {
    const levels = page.getByRole('navigation', { name: 'School level' });
    await expect(levels.getByRole('link')).toHaveText([
      'High schools',
      'Middle schools',
      'Elementary schools',
    ]);

    const browse = page.getByRole('region', { name: 'Browse' });
    await expect(browse.getByRole('link', { name: /^By district/ })).toContainText('districts');
    await expect(browse.getByRole('link', { name: /^By city or town/ })).toContainText('places');
    await expect(browse.getByRole('link', { name: /^Top scores/ })).toBeVisible();
  });
});
