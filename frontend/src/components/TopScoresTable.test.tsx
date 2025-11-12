// ABOUTME: Tests for TopScoresTable component
// ABOUTME: Ensures leaderboard rows and empty states render

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

test('shows rank, school name, and score badge', () => {
  renderWithRouter(<TopScoresTable entries={ENTRIES} />);
  expect(screen.getByText('Sample High')).toBeVisible();
  expect(screen.getByText('24.3')).toBeVisible();
  expect(screen.getByText('1')).toBeVisible();
});

test('renders empty message when no entries present', () => {
  renderWithRouter(<TopScoresTable entries={[]} />);
  expect(screen.getByText(/No ranked schools available/i)).toBeVisible();
});
