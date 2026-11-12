// ABOUTME: Shared list of pages for end-to-end checks that apply to every page
// ABOUTME: Covers each route with real schools, including a seeded comparison

import type { Page } from '@playwright/test';

export const ELK_GROVE_HIGH = '05-016-2140-17-0002';
export const ROLLING_MEADOWS_HIGH = '05-016-2140-17-0007';
export const CLEARMONT_ELEMENTARY = '05-016-0590-04-2003';
export const AC_CENTRAL_MIDDLE = '01-009-2620-26-1002';
export const ALWOOD_MIDDLE_HIGH = '28-037-2250-26-0001';
export const AVON_ELEMENTARY = '33-048-2760-26-2002';

export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'search results', path: '/search?q=elk' },
  { name: 'high school', path: `/school/${ELK_GROVE_HIGH}` },
  { name: 'elementary school', path: `/school/${CLEARMONT_ELEMENTARY}` },
  { name: 'middle school', path: `/school/${AC_CENTRAL_MIDDLE}` },
  { name: 'dually designated school', path: `/school/${ALWOOD_MIDDLE_HIGH}` },
  { name: 'school without test scores', path: `/school/${AVON_ELEMENTARY}` },
  { name: 'compare', path: '/compare' },
  { name: 'top scores', path: '/top-scores' },
  { name: 'not found', path: '/no-such-page' },
];

export async function seedComparison(page: Page, rcdtsList: string[]) {
  await page.addInitScript((list) => {
    localStorage.setItem('school-comparison', JSON.stringify(list));
  }, rcdtsList);
}

export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
