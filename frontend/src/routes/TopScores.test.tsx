// ABOUTME: Tests for Top Scores route
// ABOUTME: Covers the explainer, the view held in the URL, region ranking and the looked-up school

import { beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as apiQueries from '@/lib/api/queries';
import type { TopScoresResponse } from '@/lib/api/types';
import { DISTRICTS, ELK_GROVE_HIGH, CLEARMONT_ELEMENTARY } from '@/test/schoolList';
import { TOP_SCORE_ENTRY } from '@/test/topScores';
import TopScores from './TopScores';

const EMPTY: TopScoresResponse = { results: [], total: 0, school: null };

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  vi.spyOn(apiQueries, 'getTopScores').mockResolvedValue(EMPTY);
  vi.spyOn(apiQueries, 'useDistricts').mockReturnValue({
    data: DISTRICTS,
  } as unknown as ReturnType<typeof apiQueries.useDistricts>);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderTopScores(path = '/top-scores') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const router = createMemoryRouter([{ path: '/top-scores', element: <TopScores /> }], {
    initialEntries: [path],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return router;
}

const currentPath = (router: ReturnType<typeof renderTopScores>) =>
  `${router.state.location.pathname}${router.state.location.search}`;

test('renders hero heading and description', () => {
  renderTopScores();

  expect(screen.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();
  expect(screen.getByText(/ranked by average act score.*iar proficiency/i)).toBeInTheDocument();
});

test('explains the ranking as the published scores, with no normalization', () => {
  renderTopScores();

  const explainer = screen.getByText(/how rankings are calculated/i).parentElement!;

  expect(explainer).toHaveTextContent(/average of the grade 11 English language arts and math scores/i);
  expect(explainer).toHaveTextContent(/average of the English language arts and math proficiency rates/i);
  expect(explainer).toHaveTextContent(/same score share a rank/i);
  expect(explainer).toHaveTextContent(/county or district.*starting from 1/i);
  expect(explainer).toHaveTextContent(/low-income/i);
  expect(explainer).not.toHaveTextContent(/normalized|100-point/i);
  expect(screen.queryByText(/normalized/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/dark badges/i)).not.toBeInTheDocument();
});

test('ranks high schools on the ACT across Illinois by default', async () => {
  vi.mocked(apiQueries.getTopScores).mockResolvedValue({
    results: [TOP_SCORE_ENTRY],
    total: 684,
    school: null,
  });
  renderTopScores();

  expect(await screen.findByText('684 high schools ranked in Illinois')).toBeVisible();
  expect(apiQueries.getTopScores).toHaveBeenCalledWith({
    assessment: 'act',
    level: 'high',
    limit: 100,
  });
});

test('ranks the level and region in the URL', async () => {
  renderTopScores('/top-scores?level=middle&county=Cook');

  expect(await screen.findByText('0 middle schools ranked in Cook County')).toBeVisible();
  expect(apiQueries.getTopScores).toHaveBeenCalledWith({
    assessment: 'iar',
    level: 'middle',
    limit: 100,
    county: 'Cook',
  });
  expect(screen.getByLabelText('County')).toHaveValue('Cook');
});

test('names a district by its name', async () => {
  renderTopScores('/top-scores?district=05-016-2140-17');

  expect(await screen.findByText('0 high schools ranked in Township HSD 214')).toBeVisible();
});

test('choosing a region puts it in the URL and drops a looked-up school', async () => {
  const router = renderTopScores('/top-scores?level=elementary&school=1');

  await userEvent.selectOptions(screen.getByLabelText('County'), 'Madison');

  expect(currentPath(router)).toBe('/top-scores?level=elementary&county=Madison');
});

test('choosing a level keeps the region and drops a looked-up school', async () => {
  const router = renderTopScores('/top-scores?county=Cook&school=1');

  await userEvent.click(screen.getByRole('tab', { name: 'Middle School IAR' }));

  expect(currentPath(router)).toBe('/top-scores?level=middle&county=Cook');
});

test('shows the looked-up school and its place in the ranking', async () => {
  vi.mocked(apiQueries.getTopScores).mockResolvedValue({
    results: [],
    total: 684,
    school: { ...TOP_SCORE_ENTRY, rank: 214 },
  });
  const router = renderTopScores(`/top-scores?school=${TOP_SCORE_ENTRY.rcdts}`);

  const found = await screen.findByRole('region', { name: 'Elk Grove High School' });
  expect(found).toHaveTextContent('Rank 214 of 684 high schools in Illinois');
  expect(within(found).getByText('Elk Grove High School')).toHaveClass('bg-highlighter');
  expect(apiQueries.getTopScores).toHaveBeenCalledWith({
    assessment: 'act',
    level: 'high',
    limit: 100,
    school: TOP_SCORE_ENTRY.rcdts,
  });

  await userEvent.click(within(found).getByRole('link', { name: 'Clear' }));
  expect(currentPath(router)).toBe('/top-scores');
});

test('says when the looked-up school is not ranked here', async () => {
  renderTopScores('/top-scores?county=Madison&school=05-016-2140-17-0002');

  expect(await screen.findByText(/school you looked up is not ranked/i)).toBeVisible();
});

test('looking up a school ranks it with its own level and keeps a region it is in', async () => {
  vi.spyOn(apiQueries, 'getSchools').mockResolvedValue({
    results: [ELK_GROVE_HIGH, CLEARMONT_ELEMENTARY],
    total: 2,
  });
  const router = renderTopScores('/top-scores?county=Cook');

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'elk grove');
  await userEvent.click(await screen.findByRole('option', { name: /Clearmont Elementary School/ }));

  expect(currentPath(router)).toBe(
    `/top-scores?level=elementary&county=Cook&school=${CLEARMONT_ELEMENTARY.rcdts}`
  );
});

test('looking up a school outside the region ranks it across Illinois', async () => {
  vi.spyOn(apiQueries, 'getSchools').mockResolvedValue({ results: [ELK_GROVE_HIGH], total: 1 });
  const router = renderTopScores('/top-scores?county=Madison&district=41-057-0070-26');

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'elk grove');
  await userEvent.click(await screen.findByRole('option', { name: /Elk Grove High School/ }));

  expect(currentPath(router)).toBe(`/top-scores?school=${ELK_GROVE_HIGH.rcdts}`);
});
