// ABOUTME: Tests for Top Scores route
// ABOUTME: Ensures hero heading and description render

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

test('renders hero heading and description', () => {
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

  expect(screen.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();
  expect(screen.getByText(/ranked by act.*iar/i)).toBeInTheDocument();
});
