// ABOUTME: End-to-end test for API client integration
// ABOUTME: Verifies frontend can successfully fetch from backend API

import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running
    await page.goto('/');
  });

  test('can reach backend health endpoint', async ({ page }) => {
    // Use page.request to directly test API
    const response = await page.request.get('http://localhost:8000/api/search?q=high&limit=1');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('total');
  });

  test('API client configuration is correct', async ({ page }) => {
    await page.goto('/');

    // Check that page loads without errors (API client is properly configured)
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
