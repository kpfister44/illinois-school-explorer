// ABOUTME: End-to-end test for the school page
// ABOUTME: Verifies the single scroll and its benchmarks for high, middle, elementary and mixed schools with real data

import { test, expect } from '@playwright/test';
import {
  AC_CENTRAL_MIDDLE,
  ALWOOD_MIDDLE_HIGH,
  AVON_ELEMENTARY,
  CLEARMONT_ELEMENTARY,
  ELK_GROVE_HIGH,
  openPage,
} from './pages';

test('high school page leads with the ACT average and charts its history', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Elk Grove High School' })).toBeVisible();
  await expect(page.getByText('Approaching Exemplary')).toBeVisible();

  const scores = page.getByRole('region', { name: 'Test scores · 2026' });
  await expect(scores.getByText('18.1').first()).toBeVisible();
  await expect(scores.getByText('average ACT, out of 36')).toBeVisible();

  const overTime = page.getByRole('region', { name: 'Over time' });
  const chart = overTime.getByRole('img', { name: /^Average ACT from 2010 to 2026: 22.5 in 2010, 18.1 in 2026/ });
  await expect(chart.locator('.recharts-line-curve').first()).toBeVisible();
  await expect(chart.getByText('SAT years, converted')).toBeVisible();
  await expect(chart.getByText('22.5')).toBeVisible();
  await expect(overTime.getByRole('list', { name: 'ACT subject scores' })).toContainText('17.6English');
});

test('high school page says where the ACT average stands and compares it on one scale', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const scores = page.getByRole('region', { name: 'Test scores · 2026' });
  await expect(
    scores.getByText('Higher than 64% of Illinois high schools, and below the average for its district.')
  ).toBeVisible();

  const rows = scores.getByRole('list', { name: 'Average ACT compared' }).getByRole('listitem');
  await expect(rows).toHaveText([
    'This school18.1',
    'Illinois17.6',
    'District20.5',
    'Similar schools18.3',
  ]);
  await expect(scores.getByText(/where most Illinois high schools fall, 14.2 to 20.7\./)).toBeVisible();

  const dots = await rows.locator('circle').evaluateAll((circles) =>
    circles.map((circle) => circle.getBoundingClientRect().x)
  );
  const [school, illinois, district] = dots;
  expect(illinois).toBeLessThan(school);
  expect(school).toBeLessThan(district);

  const band = (await rows.first().locator('rect').boundingBox())!;
  const schoolDot = (await rows.first().locator('circle').boundingBox())!;
  expect(band.width).toBeGreaterThan(20);
  expect(schoolDot.x).toBeGreaterThan(band.x);
  expect(schoolDot.x + schoolDot.width).toBeLessThan(band.x + band.width);
});

test('ACT chart draws the Illinois average as a second, dashed line', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const overTime = page.getByRole('region', { name: 'Over time' });
  const chart = overTime.getByRole('img', { name: /Illinois high school average: 17.6 in 2026\.$/ });
  await expect(chart.locator('.recharts-line-curve')).toHaveCount(2);
  await expect(chart.locator('.recharts-line-curve[stroke-dasharray="3 3"]')).toBeVisible();
  await expect(overTime.getByText('Illinois high school average')).toBeVisible();
  await expect(overTime.getByText('This school')).toBeVisible();
});

test('similar schools open in a sheet and lead to each school', async ({ page }) => {
  await openPage(page, '/top-scores');
  await page.getByRole('button', { name: /View details for/i }).first().click();
  await expect(page).toHaveURL(/\/school\//);
  const firstSchool = page.url();

  await page.getByRole('button', { name: 'See similar schools' }).click();

  const sheet = page.getByRole('dialog', { name: 'Similar schools' });
  await expect(sheet.getByRole('link')).toHaveCount(25);
  await expect(sheet.getByText(/^Their average ACT is \d+\.\d\.$/)).toBeVisible();

  const similar = sheet.getByRole('link').first();
  const name = await similar.locator('span span').first().innerText();
  await similar.click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  expect(page.url()).not.toBe(firstSchool);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(firstSchool);
});

test('school page links to how the yardsticks work', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  await page.getByRole('region', { name: 'Test scores · 2026' }).getByRole('link', { name: 'How this works' }).click();

  await expect(page).toHaveURL(/\/how-this-works$/);
  await expect(page.getByRole('heading', { level: 1, name: 'How this works' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Similar schools' })).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(new RegExp(`/school/${ELK_GROVE_HIGH}$`));
});

test('ACT chart reads out the year under the pointer', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const plot = page.getByRole('region', { name: 'Over time' }).locator('.recharts-surface').first();
  await plot.scrollIntoViewIfNeeded();
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);

  await expect(page.locator('.recharts-tooltip-wrapper')).toContainText(/20\d\d \d+\.\d \(SAT, converted\)/);
});

test('high school page lists every ACT year in a sheet', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  await page.getByRole('button', { name: 'See every year' }).click();

  const sheet = page.getByRole('dialog', { name: 'Average ACT' });
  await expect(sheet.getByRole('row', { name: /2019/ })).toContainText('19.6');
  await expect(sheet.getByRole('row', { name: /2019/ })).toContainText('SAT, converted');
  await expect(sheet.getByRole('row', { name: /2018/ })).toContainText('No data');
});

test('sparkline opens the full chart and year table', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  await page.getByRole('button', { name: 'Enrollment history' }).click();

  const sheet = page.getByRole('dialog', { name: 'Enrollment' });
  await expect(sheet.locator('.recharts-line-curve')).toBeVisible();
  await expect(sheet.getByRole('row', { name: /2010/ })).toContainText('2,044');
  await expect(sheet.getByRole('row', { name: /2026/ })).toContainText('1,721');
});

test('students section shows every race and ethnicity group with data', async ({ page }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const students = page.getByRole('region', { name: 'Students' });
  await expect(students.getByRole('img', { name: /^Race and ethnicity: Hispanic 47.9%, White 35.6%/ })).toBeVisible();
  await expect(students.getByText('Middle Eastern or North African')).toBeVisible();
  await expect(students.getByText('30.7%')).toBeVisible();
  await expect(students.getByText('Illinois high schools: 18.1%')).toBeVisible();
  await expect(students.getByText('Illinois high schools: 49.5%')).toBeVisible();
});

test('section links jump down the page and keep Back pointing at the previous page', async ({ page }) => {
  await openPage(page, '/top-scores');
  await page.getByRole('button', { name: /View details for/i }).first().click();
  await expect(page).toHaveURL(/\/school\//);

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Enrollment' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Enrollment' })).toBeInViewport();
  await expect(page.getByRole('navigation', { name: 'Sections' })).toBeInViewport();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/top-scores$/);
});

for (const [level, rcdts] of [
  ['elementary', CLEARMONT_ELEMENTARY],
  ['middle', AC_CENTRAL_MIDDLE],
] as const) {
  test(`${level} school page leads with IAR proficiency and where it stands`, async ({ page }) => {
    await openPage(page, `/school/${rcdts}`);

    const scores = page.getByRole('region', { name: 'Test scores · 2026' });
    await expect(scores.getByText('of students proficient on the IAR')).toBeVisible();
    await expect(scores.getByText(new RegExp(`^Higher than \\d+% of Illinois ${level} schools`))).toBeVisible();
    await expect(
      scores.getByRole('list', { name: 'IAR proficiency compared' }).getByRole('listitem').first()
    ).toHaveText(/^This school\d+\.\d%$/);
    await expect(scores.getByText(new RegExp(`where most Illinois ${level} schools fall`))).toBeVisible();

    const overTime = page.getByRole('region', { name: 'Over time' });
    await expect(overTime.getByRole('row', { name: /Overall/ })).toContainText(/%.*%.*pts/);
    await expect(overTime.locator('.recharts-surface')).toHaveCount(0);
    await expect(page.getByText(/ACT/)).toHaveCount(0);
  });
}

test('elementary school page shows the official name under the display name', async ({ page }) => {
  await openPage(page, `/school/${CLEARMONT_ELEMENTARY}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Clearmont Elementary School' })).toBeVisible();
  await expect(page.getByText('Official name: Clearmont Elem School')).toBeVisible();
});

test('dually designated school shows both tests and sits off the designation scale', async ({ page }) => {
  await openPage(page, `/school/${ALWOOD_MIDDLE_HIGH}`);

  await expect(page.getByText('Dually Designated')).toBeVisible();
  await expect(page.getByRole('img', { name: /of five levels/ })).toHaveCount(0);

  const scores = page.getByRole('region', { name: 'Test scores · 2026' });
  await expect(scores.getByText('average ACT, out of 36')).toBeVisible();
  await expect(scores.getByText('of students proficient on the IAR')).toBeVisible();
  await expect(scores.getByText(/^Higher than \d+% of Illinois high schools/)).toBeVisible();
  await expect(scores.getByText('Higher than 60% of Illinois middle schools.')).toBeVisible();
  await expect(scores.getByRole('button', { name: 'See similar schools' })).toHaveCount(2);
});

test('school without scores or a designation says so', async ({ page }) => {
  await openPage(page, `/school/${AVON_ELEMENTARY}`);

  await expect(page.getByText('Not designated')).toBeVisible();
  await expect(page.getByText(/No 2026 test scores are published/)).toBeVisible();
  await expect(page.getByText('No test score history is published for this school.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Enrollment' }).getByText('20', { exact: true })).toBeVisible();
});

test('desktop puts the history beside the summary and phones stack them', async ({ page, isMobile }) => {
  await openPage(page, `/school/${ELK_GROVE_HIGH}`);

  const scores = (await page.getByRole('region', { name: 'Test scores · 2026' }).boundingBox())!;
  const overTime = (await page.getByRole('region', { name: 'Over time' }).boundingBox())!;

  if (isMobile) {
    expect(overTime.y).toBeGreaterThan(scores.y + scores.height - 1);
    expect(overTime.x).toBe(scores.x);
  } else {
    expect(overTime.x).toBeGreaterThan(scores.x + scores.width);
    expect(overTime.y).toBeLessThan(scores.y);
  }
});
