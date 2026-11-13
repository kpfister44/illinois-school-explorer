// ABOUTME: End-to-end test for browsing schools by town and district, and for the filtered school list
// ABOUTME: Verifies a parent reaches a school from Home without typing its name, with filters and sort held in the URL

import { test, expect, type Page } from '@playwright/test';
import { CLEARMONT_ELEMENTARY, DISTRICT_59, ELK_GROVE_HIGH, openPage } from './pages';

function schoolList(page: Page) {
  return page.getByRole('list', { name: 'Schools' });
}

async function openFilters(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: /^Filters/ }).click();
    return page.getByRole('dialog');
  }
  return page.getByRole('complementary', { name: 'Filters' });
}

test('a parent goes from Home to a town and on to a school', async ({ page }) => {
  await openPage(page, '/');

  await page.getByRole('region', { name: 'Browse' }).getByRole('link', { name: /^By city or town/ }).click();
  await expect(page).toHaveURL('/browse?by=city');
  await expect(page.getByRole('link', { name: 'Cities and towns' })).toHaveAttribute('aria-current', 'true');

  await page.getByLabel('Narrow by name').fill('elk grove');
  const places = page.getByRole('list', { name: 'Places' });
  await expect(places.getByRole('link')).toHaveCount(1);
  await places.getByRole('link', { name: /^Elk Grove Village/ }).click();

  await expect(page).toHaveURL('/search?city=Elk+Grove+Village');
  await expect(page.getByRole('heading', { level: 1, name: 'Schools in Elk Grove Village' })).toBeVisible();
  await expect(page.getByText('10 schools', { exact: true })).toBeVisible();

  await page.getByRole('navigation', { name: 'School level' }).getByRole('link', { name: 'High' }).click();
  await expect(page).toHaveURL('/search?level=high&city=Elk+Grove+Village');
  await expect(page.getByText('1 school', { exact: true })).toBeVisible();

  const row = schoolList(page).getByRole('link');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Township HSD 214');
  await expect(row).toContainText('18.1');
  await expect(row).toContainText('Approaching Exemplary');
  await row.click();

  await expect(page).toHaveURL(`/school/${ELK_GROVE_HIGH}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Elk Grove High School' })).toBeVisible();
});

test('a parent goes from Home to a district and on to a school', async ({ page }) => {
  await openPage(page, '/');

  await page.getByRole('region', { name: 'Browse' }).getByRole('link', { name: /^By district/ }).click();
  await expect(page).toHaveURL('/browse?by=district');

  await page.getByLabel('Narrow by name').fill('comm cons sd 59');
  const district = page.getByRole('list', { name: 'Places' }).getByRole('link');
  await expect(district).toHaveCount(1);
  await expect(district).toContainText('Cook County · 15 schools');
  await district.click();

  await expect(page).toHaveURL(`/district/${DISTRICT_59}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Comm Cons SD 59' })).toBeVisible();
  await expect(page.getByText(/^Cook County · 15 schools · [\d,]+ students$/)).toBeVisible();

  const elementary = page.getByRole('region', { name: 'Elementary schools' });
  await expect(elementary.getByText('IAR proficiency by school · 2026')).toBeVisible();
  await elementary.getByRole('link', { name: 'Clearmont Elementary School' }).click();

  await expect(page).toHaveURL(`/school/${CLEARMONT_ELEMENTARY}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Clearmont Elementary School' })).toBeVisible();
});

test('the district page plots each level and offers to compare a small level', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await openPage(page, `/district/${DISTRICT_59}`);

  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Elementary schools',
    'Middle schools',
    'Other schools',
  ]);

  const elementary = page.getByRole('region', { name: 'Elementary schools' });
  await expect(elementary.getByText(/^District average [\d.]+% · Illinois elementary schools average [\d.]+%\.$/)).toBeVisible();
  await expect(elementary.getByText(/^Shaded band: where most Illinois elementary schools fall/)).toBeVisible();
  await expect(elementary.getByRole('button', { name: /^Compare/ })).toHaveCount(0);

  const middle = page.getByRole('region', { name: 'Middle schools' });
  await expect(middle.getByRole('list', { name: 'IAR proficiency by school' }).getByRole('link')).toHaveCount(3);
  await middle.getByRole('button', { name: 'Compare all 3' }).click();

  await expect(page).toHaveURL('/compare');
  for (const name of ['Friendship Jr High School', 'Holmes Jr High School', 'Grove Jr High School']) {
    await expect(page.getByRole('main').getByText(name).filter({ visible: true }).first()).toBeVisible();
  }
});

test('the district page links to its schools as a list', async ({ page }) => {
  await openPage(page, `/district/${DISTRICT_59}`);

  await page.getByRole('link', { name: 'See these schools as a list' }).click();

  await expect(page).toHaveURL(`/search?district=${DISTRICT_59}`);
  await expect(page.getByText('15 schools', { exact: true })).toBeVisible();
  await expect(schoolList(page).getByRole('link')).toHaveCount(15);
});

test('an unknown district says it was not found', async ({ page }) => {
  await openPage(page, '/district/99-999-9999-99');

  await expect(page.getByRole('heading', { level: 1, name: 'District not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse districts' })).toHaveAttribute('href', '/browse?by=district');
});

test('the school page links its town and district', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);
  const location = page.getByTestId('school-location');

  await location.getByRole('link', { name: 'Township HSD 214' }).click();
  await expect(page).toHaveURL('/district/05-016-2140-17');
  await expect(page.getByRole('heading', { level: 1, name: 'Township HSD 214' })).toBeVisible();

  await page.getByRole('link', { name: 'Elk Grove High School' }).click();
  await page.getByTestId('school-location').getByRole('link', { name: 'Elk Grove Village' }).click();
  await expect(page).toHaveURL('/search?city=Elk+Grove+Village');
  await expect(page.getByRole('heading', { level: 1, name: 'Schools in Elk Grove Village' })).toBeVisible();
});

test('filters and sort live in the URL and survive a reload', async ({ page, isMobile }) => {
  await openPage(page, '/search?level=high&county=Cook');
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Filters' })).toBeHidden();
  }

  const filters = await openFilters(page, isMobile);
  await expect(filters.getByLabel('County')).toHaveValue('Cook');
  await filters.getByLabel('State designation').selectOption('Exemplary');
  await filters.getByRole('button', { name: 'Show schools' }).click();

  await expect(page).toHaveURL('/search?level=high&county=Cook&designation=Exemplary');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('33 schools', { exact: true })).toBeVisible();

  await page.getByLabel('Sort by').selectOption({ label: 'Highest score' });
  await expect(page).toHaveURL('/search?level=high&county=Cook&designation=Exemplary&sort=score');
  await expect(schoolList(page).getByRole('link').first()).toContainText('Payton College Preparatory High School');

  await page.reload();
  await expect(page.getByLabel('Sort by')).toHaveValue('score');
  await expect(schoolList(page).getByRole('link').first()).toContainText('Payton College Preparatory High School');
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Filters (2)' })).toBeVisible();
  }

  await page.goBack();
  await expect(page).toHaveURL('/search?level=high&county=Cook&designation=Exemplary');
  await expect(page.getByLabel('Sort by')).toHaveValue('name');
});

test('the list shows more schools a page at a time', async ({ page }) => {
  await openPage(page, '/search?level=middle');

  await expect(page.getByText('602 schools', { exact: true })).toBeVisible();
  await expect(schoolList(page).getByRole('link')).toHaveCount(25);

  await page.getByRole('button', { name: 'Show more schools' }).click();
  await expect(schoolList(page).getByRole('link')).toHaveCount(50);
});

test('the Browse destination is current on Browse and district pages', async ({ page }) => {
  for (const path of ['/browse', `/district/${DISTRICT_59}`]) {
    await openPage(page, path);
    const browse = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Browse' });
    await expect(browse).toHaveAttribute('aria-current', 'page');
  }
});
