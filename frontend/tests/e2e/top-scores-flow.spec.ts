// ABOUTME: Playwright spec for Top Scores flow
// ABOUTME: Covers the Home link, level choice, school context on every row, regions, rank lookup and the URL

import { test, expect, type Page } from '@playwright/test';
import { ELK_GROVE_HIGH, openPage } from './pages';

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// The ranking as phones show it, or as desktop shows it
function rankedRows(page: Page, isMobile: boolean) {
  return isMobile
    ? page.getByRole('main').getByRole('list').last().getByRole('link')
    : page.getByRole('table').getByRole('button', { name: /View details for/ });
}

test.describe('Top Scores leaderboard', () => {
  test('user opens leaderboard, switches tabs, and visits school detail', async ({ page, isMobile }) => {
    await page.goto(FRONTEND);
    await page.getByRole('main').getByRole('link', { name: /^Top scores/ }).click();

    await expect(page).toHaveURL(/\/top-scores$/);
    await expect(page.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();

    if (isMobile) {
      await page.getByRole('combobox', { name: 'Ranking' }).click();
      await page.getByRole('option', { name: /Middle School IAR/ }).click();
    } else {
      await page.getByRole('tab', { name: /Middle School IAR/ }).click();
    }
    await expect(page).toHaveURL(/\/top-scores\?level=middle$/);
    await expect(page.getByText(/middle schools ranked in Illinois/)).toBeVisible();

    const firstRow = rankedRows(page, isMobile).first();
    await expect(firstRow).toBeVisible();

    await firstRow.click();
    await expect(page).toHaveURL(/\/school\//);
  });

  test('every row shows enrollment and low-income share', async ({ page, isMobile }) => {
    await openPage(page, '/top-scores');

    const rows = rankedRows(page, isMobile);
    await expect(rows).toHaveCount(20);
    for (const row of await rows.all()) {
      await expect(row).toBeVisible();
      if (isMobile) {
        await expect(row).toContainText(/(students|Enrollment not reported)/);
        await expect(row).toContainText(/(low income|Low income not reported)/);
      } else {
        await expect(row.getByRole('cell').nth(2)).toHaveText(/^([\d,]+|Not reported)$/);
        await expect(row.getByRole('cell').nth(3)).toHaveText(/^(\d+\.\d%|Not reported)$/);
      }
    }
  });

  test('a county ranks its own schools from 1', async ({ page, isMobile }) => {
    await openPage(page, '/top-scores');

    await page.getByLabel('County').selectOption('Dupage');

    await expect(page).toHaveURL(/\/top-scores\?county=Dupage$/);
    await expect(page.getByText('23 high schools ranked in Dupage County')).toBeVisible();
    const first = rankedRows(page, isMobile).first();
    await expect(first).toContainText('Hinsdale Central High School');
    await expect(first).toContainText('1');
  });

  test('finds the rank of a school outside the top 100', async ({ page }) => {
    await openPage(page, '/top-scores?level=middle');

    await page.getByLabel("Find a school's rank").fill('elk grove high');
    await page.getByRole('option', { name: /Elk Grove High School/ }).click();

    await expect(page).toHaveURL(`/top-scores?school=${ELK_GROVE_HIGH}`);
    const found = page.getByRole('region', { name: 'Elk Grove High School' });
    await expect(found).toContainText('Rank 243 of 684 high schools in Illinois');
    await expect(found).toContainText('1,721 students');
  });

  test('a copied URL reproduces the ranking and the looked-up school', async ({ page, isMobile }) => {
    await openPage(page, `/top-scores?county=Cook&school=${ELK_GROVE_HIGH}`);

    await expect(page.getByLabel('County')).toHaveValue('Cook');
    await expect(page.getByText(/^\d+ high schools ranked in Cook County$/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Elk Grove High School' })).toContainText(
      /Rank \d+ of \d+ high schools in Cook County/
    );
    await expect(rankedRows(page, isMobile).first()).toBeVisible();
  });
});
