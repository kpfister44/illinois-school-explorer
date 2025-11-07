// ABOUTME: End-to-end test for main application
// ABOUTME: Verifies app loads and displays header correctly

import { test, expect } from '@playwright/test';

test('app displays header and initial content', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Illinois School Explorer' })).toBeVisible();
  await expect(page.getByText('Frontend foundation setup')).toBeVisible();
});
