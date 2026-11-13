// ABOUTME: Tests for TopScoresTable component
// ABOUTME: Ensures the phone list and desktop table carry each school's context, and the empty state

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import type { TopScoreEntry } from '@/lib/api/types';
import { TOP_SCORE_ENTRY } from '@/test/topScores';
import TopScoresTable from './TopScoresTable';

const ENTRIES: TopScoreEntry[] = [
  TOP_SCORE_ENTRY,
  {
    ...TOP_SCORE_ENTRY,
    rcdts: '05-016-2140-17-0004',
    school_name: 'Rolling Meadows High School',
    display_name: 'Rolling Meadows High School',
    city: 'Rolling Meadows',
    enrollment: null,
    low_income_percentage: null,
    designation: null,
  },
];

const renderWithRouter = (ui: React.ReactNode) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: ui,
    },
    {
      path: '/school/:rcdts',
      element: <div>School detail</div>,
    },
  ]);

  render(<RouterProvider router={router} />);
  return router;
};

const table = () => screen.getByRole('table');
const phoneList = () => screen.getByRole('list');

test('lists every school with its context on phones', () => {
  renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);

  const rows = within(phoneList()).getAllByRole('link');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent('1,721 students · 35.2% low income');
  expect(rows[1]).toHaveTextContent('Enrollment not reported · Low income not reported');
});

test('gives the desktop table enrollment, low-income and designation columns', () => {
  renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);

  expect(
    within(table())
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['Rank', 'School', 'Students', 'Low income', 'Designation', 'Score']);
  const [first, second] = within(table()).getAllByRole('button');
  expect(first).toHaveTextContent('1,721');
  expect(first).toHaveTextContent('35.2%');
  expect(first).toHaveTextContent('Approaching Exemplary');
  expect(first).toHaveTextContent('Elk Grove Village · Township HSD 214');
  expect(second).toHaveTextContent('Not reported');
  expect(second).toHaveTextContent('Not designated');
});

test('shows the ACT subject averages as visible text under the score', () => {
  renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);

  expect(within(table()).getAllByText('ELA 17.6 · Math 18.6')[0]).toBeVisible();
  expect(within(table()).getAllByText('18.1')[0]).not.toHaveAttribute('title');
});

test('renders percent and no subject averages for IAR entries', () => {
  renderWithRouter(
    <TopScoresTable
      entries={[{ ...TOP_SCORE_ENTRY, score: 72.5, level: 'middle' }]}
      assessment="iar"
    />
  );

  expect(within(table()).getByText('72.5%')).toBeVisible();
  expect(screen.queryByText(/ELA/)).not.toBeInTheDocument();
});

test('marks the looked-up school in both layouts', () => {
  renderWithRouter(
    <TopScoresTable entries={ENTRIES} assessment="act" highlighted={TOP_SCORE_ENTRY.rcdts} />
  );

  expect(within(table()).getByText('Elk Grove High School')).toHaveClass('bg-highlighter');
  expect(within(phoneList()).getByText('Elk Grove High School')).toHaveClass('bg-highlighter');
  expect(within(table()).getByText('Rolling Meadows High School')).not.toHaveClass('bg-highlighter');
});

test('navigates when a table row is activated', async () => {
  const router = renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);
  const user = userEvent.setup();
  await user.click(within(table()).getByText('Elk Grove High School'));
  await waitFor(() =>
    expect(router.state.location.pathname).toBe(`/school/${TOP_SCORE_ENTRY.rcdts}`)
  );
});

test('renders empty message when no entries present', () => {
  renderWithRouter(<TopScoresTable entries={[]} assessment="act" />);
  expect(screen.getByText(/No ranked schools/i)).toBeVisible();
});
