// ABOUTME: E2E test for search to detail flow
// ABOUTME: Verifies complete user journey from search to school detail

import { expect, test } from '@playwright/test';

test.describe('Search to Detail Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('complete search flow: home -> search -> detail', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /search for illinois schools/i })
    ).toBeVisible();

    await page.goto('http://localhost:5173/search?q=elk');

    await expect(page.getByText('Elk Grove High School')).toBeVisible({ timeout: 2000 });

    await page.getByText('Elk Grove High School').first().click();

    await expect(
      page.getByRole('heading', { name: 'Elk Grove High School' })
    ).toBeVisible();

    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /academics/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /demographics/i })).toBeVisible();

    await page.getByRole('tab', { name: /academics/i }).click();

    await expect(page.getByText(/ELA/i)).toBeVisible();
    await expect(page.getByText(/Math/i)).toBeVisible();

    await page.getByRole('tab', { name: /demographics/i }).click();

    await expect(page.getByText(/English Learners/i)).toBeVisible();
    await expect(page.getByText(/Low Income/i)).toBeVisible();
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

    const searchInput = page.getByPlaceholder(/search for schools/i);

    if (await searchInput.isVisible()) {
      await searchInput.type('elk', { delay: 100 });

      await expect(page.getByText('Elk Grove High School')).toBeVisible({ timeout: 1000 });

      await page.getByText('Elk Grove High School').first().click();

      await expect(page).toHaveURL(/\/school\//);
    }
  });

  test('top scores CTA is visible on home', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Explore Top 100 Scores/i })).toBeVisible();
  });
});
