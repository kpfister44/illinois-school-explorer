// ABOUTME: End-to-end test for SchoolCount component
// ABOUTME: Verifies the home page shows the number of schools in the database

import { test, expect } from '@playwright/test';

test.describe('School Count', () => {
  test('displays school count on home page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('3,828 schools available')).toBeVisible({ timeout: 10000 });
  });
});
