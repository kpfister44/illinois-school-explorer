// ABOUTME: Tests for TopScoresTable component
// ABOUTME: Ensures leaderboard rows and empty states render

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import type { TopScoreEntry } from '@/lib/api/types';
import TopScoresTable from './TopScoresTable';

const ENTRIES: TopScoreEntry[] = [
  {
    rank: 1,
    rcdts: '11',
    school_name: 'Sample High',
    city: 'Normal',
    district: 'Unit 5',
    school_type: 'High School',
    level: 'high',
    enrollment: 1200,
    score: 24.3,
  },
];

const renderWithRouter = (ui: React.ReactNode) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: ui,
    },
  ]);

  render(<RouterProvider router={router} />);
  return router;
};

test('shows rank, school name, and score badge', () => {
  renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);
  expect(screen.getByText('Sample High')).toBeVisible();
  const score = screen.getByText('24.3');
  expect(score).toBeVisible();
  expect(score).toHaveAttribute('title', expect.stringContaining('ELA'));
  expect(screen.getByText('1')).toBeVisible();
});

test('renders percent for IAR entries', () => {
  renderWithRouter(
    <TopScoresTable
      entries={[{ ...ENTRIES[0], score: 72.5, level: 'middle' }]}
      assessment="iar"
    />
  );
  expect(screen.getByText('72.5%')).toBeVisible();
});

test('navigates when a row is activated', async () => {
  const router = renderWithRouter(<TopScoresTable entries={ENTRIES} assessment="act" />);
  const user = userEvent.setup();
  await user.click(screen.getByText('Sample High'));
  await waitFor(() => expect(router.state.location.pathname).toBe('/school/11'));
});

test('renders empty message when no entries present', () => {
  renderWithRouter(<TopScoresTable entries={[]} assessment="act" />);
  expect(screen.getByText(/No ranked schools available/i)).toBeVisible();
});
