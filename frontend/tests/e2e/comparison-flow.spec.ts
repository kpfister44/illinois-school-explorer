// ABOUTME: End-to-end test for school comparison flow
// ABOUTME: Tests full user journey from search to comparison

import { test, expect, Page } from '@playwright/test';

async function searchAndOpenSchool(page: Page, searchTerm: string, schoolName: string) {
  await page.goto('/');
  await page.getByPlaceholder(/search for schools/i).fill(searchTerm);
  await expect(page.getByRole('option', { name: new RegExp(schoolName, 'i') })).toBeVisible({ timeout: 2000 });
  await page.getByRole('option', { name: new RegExp(schoolName, 'i') }).first().click();
  await expect(page).toHaveURL(/\/school\//);
  await expect(page.getByRole('heading', { name: new RegExp(schoolName, 'i') })).toBeVisible();
}

async function addSchoolToComparison(page: Page, searchTerm: string, schoolName: string) {
  await searchAndOpenSchool(page, searchTerm, schoolName);
  const addButton = page.getByRole('button', { name: /add to compare/i });
  await expect(addButton).toBeVisible();
  await addButton.click();
}

async function ensureSelectionCount(page: Page, count: number) {
  await expect(page.getByText(new RegExp(`${count} schools selected`, 'i'))).toBeVisible();
}

function getCompareButton(page: Page) {
  return page.getByRole('button', { name: /^compare$/i });
}

test.describe('School Comparison Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('complete comparison flow', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await ensureSelectionCount(page, 1);

    await addSchoolToComparison(page, 'rolling meadows', 'Rolling Meadows High School');
    await ensureSelectionCount(page, 2);

    const compareButton = getCompareButton(page);
    await expect(compareButton).toBeEnabled();
    await compareButton.click();

    await expect(page).toHaveURL('/compare');
    await expect(page.getByText('Elk Grove High School').first()).toBeVisible();
    await expect(page.getByText('Rolling Meadows High School').first()).toBeVisible();
    await expect(page.getByText('Enrollment')).toBeVisible();
    await expect(page.getByText('ACT ELA Average')).toBeVisible();
  });

  test('comparison persists across page refresh', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');

    await page.reload();

    await ensureSelectionCount(page, 1);
  });

  test('remove school from comparison', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await addSchoolToComparison(page, 'rolling meadows', 'Rolling Meadows High School');

    const removeButton = page.getByLabel(/remove elk grove/i).first();
    await removeButton.click();

    await ensureSelectionCount(page, 1);
  });

  test('clear all schools from comparison', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');

    await page.getByRole('button', { name: /clear all/i }).click();

    await expect(page.getByText(/schools selected/i)).toHaveCount(0);
  });

  test('cannot compare with only one school', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');

    const compareButton = getCompareButton(page);
    await expect(compareButton).toHaveAttribute('aria-disabled', 'true');
  });

  test('cannot add more than five schools', async ({ page }) => {
    const schools = [
      { term: 'elk grove', name: 'Elk Grove High School' },
      { term: 'rolling meadows', name: 'Rolling Meadows High School' },
      { term: 'hersey', name: 'John Hersey High School' },
      { term: 'buffalo grove', name: 'Buffalo Grove High School' },
      { term: 'prospect', name: 'Prospect High School' },
    ];

    for (const school of schools) {
      await addSchoolToComparison(page, school.term, school.name);
    }

    await ensureSelectionCount(page, 5);

    await searchAndOpenSchool(page, 'fremd', 'Fremd High School');
    const addButton = page.getByRole('button', { name: /add to compare/i });
    await expect(addButton).toBeDisabled();
  });
});
