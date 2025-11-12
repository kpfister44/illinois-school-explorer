// ABOUTME: Playwright spec for Top Scores flow
// ABOUTME: Verifies CTA navigation, tab switching, and detail link

import { test, expect } from '@playwright/test';

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173';

test.describe('Top Scores leaderboard', () => {
  test('user opens leaderboard, switches tabs, and visits school detail', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.getByRole('link', { name: /Explore Top 100 Scores/i }).click();

    await expect(page).toHaveURL(/\/top-scores$/);
    await expect(page.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();

    await page.getByRole('tab', { name: /Middle School IAR/ }).click();
    const firstRow = page.getByRole('row').nth(1);
    await expect(firstRow).toContainText('1');

    await firstRow.click();
    await expect(page).toHaveURL(/\/school\//);
  });
});
