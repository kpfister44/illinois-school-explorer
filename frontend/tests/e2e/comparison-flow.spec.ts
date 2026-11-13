// ABOUTME: End-to-end test for school comparison flow
// ABOUTME: Tests full user journey from search to comparison

import { test, expect, Page } from '@playwright/test';

async function searchAndOpenSchool(page: Page, searchTerm: string, schoolName: string) {
  await page.goto('/');
  await page.getByPlaceholder(/school, city or district/i).fill(searchTerm);
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

function compareDestination(page: Page) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /^Compare/ });
}

async function ensureSelectionCount(page: Page, count: number) {
  const selected = count === 1 ? '1 school selected' : `${count} schools selected`;
  await expect(compareDestination(page)).toHaveAccessibleName(`Compare ${selected}`);
}

// Phones manage the selection on the Compare page; desktop has it in the bottom bar on every page
async function showSelection(page: Page, isMobile: boolean) {
  if (isMobile) {
    await compareDestination(page).click();
    await expect(page).toHaveURL('/compare');
  }
}

// The name as shown on the Compare page itself, not in the desktop bar that sits on every page
function comparedSchool(page: Page, schoolName: string) {
  return page.getByRole('main').getByText(schoolName).filter({ visible: true }).first();
}

function getCompareButton(page: Page) {
  return page.getByRole('button', { name: /^compare$/i });
}

test.describe('School Comparison Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('complete comparison flow', async ({ page, isMobile }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await ensureSelectionCount(page, 1);

    await addSchoolToComparison(page, 'rolling meadows', 'Rolling Meadows High School');
    await ensureSelectionCount(page, 2);

    if (isMobile) {
      await compareDestination(page).click();
    } else {
      const compareButton = getCompareButton(page);
      await expect(compareButton).toBeEnabled();
      await compareButton.click();
    }

    await expect(page).toHaveURL('/compare');
    await expect(comparedSchool(page, 'Elk Grove High School')).toBeVisible();
    await expect(comparedSchool(page, 'Rolling Meadows High School')).toBeVisible();
    if (isMobile) {
      await expect(page.getByText('Enrollment', { exact: true }).filter({ visible: true })).toHaveCount(1);
      await expect(page.getByText('ACT ELA Average').filter({ visible: true })).toHaveCount(1);
    } else {
      await expect(page.getByRole('cell', { name: 'Enrollment', exact: true })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'ACT ELA Average' })).toBeVisible();
    }
  });

  test('comparison persists across page refresh', async ({ page }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');

    await page.reload();

    await ensureSelectionCount(page, 1);
  });

  test('remove school from comparison', async ({ page, isMobile }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await addSchoolToComparison(page, 'rolling meadows', 'Rolling Meadows High School');
    await showSelection(page, isMobile);

    await page.getByRole('button', { name: /remove elk grove/i }).click();

    await ensureSelectionCount(page, 1);
    await expect(page.getByRole('button', { name: /remove rolling meadows/i })).toBeVisible();
  });

  test('clear all schools from comparison', async ({ page, isMobile }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await showSelection(page, isMobile);

    await page.getByRole('button', { name: /clear all/i }).click();

    await expect(compareDestination(page)).toHaveAccessibleName('Compare');
    await expect(page.getByRole('button', { name: /remove elk grove/i })).toHaveCount(0);
  });

  test('cannot compare with only one school', async ({ page, isMobile }) => {
    await addSchoolToComparison(page, 'elk grove', 'Elk Grove High School');
    await showSelection(page, isMobile);

    if (isMobile) {
      await expect(page.getByText(/select at least 2 schools/i)).toBeVisible();
    } else {
      await expect(getCompareButton(page)).toHaveAttribute('aria-disabled', 'true');
    }
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
