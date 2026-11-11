// ABOUTME: Shared list of pages for end-to-end checks that apply to every page
// ABOUTME: Covers each route with real schools, including a seeded comparison

import type { Page } from '@playwright/test';

export const ELK_GROVE_HIGH = '05-016-2140-17-0002';
export const ROLLING_MEADOWS_HIGH = '05-016-2140-17-0007';
export const CLEARMONT_ELEMENTARY = '05-016-0590-04-2003';

export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'search results', path: '/search?q=elk' },
  { name: 'high school', path: `/school/${ELK_GROVE_HIGH}` },
  { name: 'elementary school', path: `/school/${CLEARMONT_ELEMENTARY}` },
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
