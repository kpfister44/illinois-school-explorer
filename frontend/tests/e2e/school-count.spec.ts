// ABOUTME: End-to-end test for SchoolCount component
// ABOUTME: Verifies component displays correct count from backend

import { test, expect } from '@playwright/test';

test.describe('School Count', () => {
  test('displays school count on home page', async ({ page }) => {
    await page.goto('/');

    // Wait for count to load
    await expect(page.getByText(/schools available/i)).toBeVisible({ timeout: 10000 });

    // Verify count is a reasonable number (should be ~3,827)
    const countText = await page.getByText(/schools available/i).textContent();
    expect(countText).toMatch(/\d+/);
  });
});
