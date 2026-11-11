// ABOUTME: Tests for Top Scores route
// ABOUTME: Ensures the hero and the ranking explanation render

import { beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as apiQueries from '@/lib/api/queries';
import TopScores from './TopScores';

beforeEach(() => {
  vi.spyOn(apiQueries, 'getTopScores').mockResolvedValue({ results: [] } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderTopScores() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/top-scores']}>
        <Routes>
          <Route path="/top-scores" element={<TopScores />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

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
  expect(explainer).not.toHaveTextContent(/normalized|100-point/i);
  expect(screen.queryByText(/normalized/i)).not.toBeInTheDocument();
});
