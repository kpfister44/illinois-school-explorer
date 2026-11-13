// ABOUTME: End-to-end test for school comparison flow
// ABOUTME: Tests full user journey from search to comparison

import { test, expect, Page } from '@playwright/test';
import { ELK_GROVE_HIGH, FIVE_HIGH_SCHOOLS, ROLLING_MEADOWS_HIGH, openPage } from './pages';

const COMPARE_URL = /\/compare\?schools=/;

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
    await expect(page).toHaveURL(COMPARE_URL);
  }
}

function schoolKey(page: Page) {
  return page.getByRole('list', { name: 'Schools compared' });
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

    await expect(page).toHaveURL(`/compare?schools=${ELK_GROVE_HIGH},${ROLLING_MEADOWS_HIGH}`);
    await expect(schoolKey(page).getByRole('link')).toHaveText([
      'Elk Grove High School',
      'Rolling Meadows High School',
    ]);
    if (isMobile) {
      await expect(page.getByRole('list', { name: 'ACT average' }).getByRole('listitem')).toHaveCount(2);
      await expect(page.getByRole('list', { name: 'Enrollment' })).toBeVisible();
      await expect(page.getByRole('table')).toBeHidden();
    } else {
      await expect(page.getByRole('cell', { name: 'Enrollment', exact: true })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'ACT English language arts' })).toBeVisible();
      await expect(page.getByRole('list', { name: 'ACT average' })).toBeHidden();
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

  test('a copied URL reproduces the comparison and fits a phone without swiping', async ({ page, isMobile }) => {
    await openPage(page, `/compare?schools=${FIVE_HIGH_SCHOOLS.join(',')}`);

    await ensureSelectionCount(page, 5);
    await expect(schoolKey(page).getByRole('link')).toHaveText([
      'Elk Grove High School',
      'Rolling Meadows High School',
      'John Hersey High School',
      'Prospect High School',
      'Buffalo Grove High School',
    ]);

    if (isMobile) {
      await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('State designation');
      const designations = page.getByRole('list', { name: 'State designation' }).getByRole('listitem');
      await expect(designations).toHaveCount(5);
      await expect(designations.first()).toContainText('Approaching Exemplary');
      for (const metric of ['ACT average', 'Low income', 'Enrollment']) {
        const rows = page.getByRole('list', { name: metric }).getByRole('listitem');
        await expect(rows).toHaveCount(5);
        await expect(rows.locator('circle')).toHaveCount(5);
      }
    } else {
      const firstRow = page.getByRole('table').getByRole('row').nth(1);
      await expect(firstRow).toContainText('State designation');
      await expect(page.getByRole('row', { name: /^ACT average/ }).locator('circle')).toHaveCount(5);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('removing a school on the Compare page updates its URL', async ({ page }) => {
    await openPage(page, `/compare?schools=${FIVE_HIGH_SCHOOLS.join(',')}`);

    await schoolKey(page).getByRole('button', { name: 'Remove Elk Grove High School' }).click();

    await expect(page).toHaveURL(`/compare?schools=${FIVE_HIGH_SCHOOLS.slice(1).join(',')}`);
    await ensureSelectionCount(page, 4);
  });
});
