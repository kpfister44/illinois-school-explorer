// ABOUTME: Tests for SearchResults page
// ABOUTME: Verifies search results display and loading states

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import SearchResults from './SearchResults';

const server = setupServer(
  http.get('http://localhost:8000/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query === 'grove') {
      return HttpResponse.json({
        results: [
          {
            id: 1,
            rcdts: '05-016-2140-17-0002',
            school_name: 'Elk Grove High School',
            city: 'Elk Grove Village',
            district: 'Township HSD 214',
            school_type: 'High School',
          },
          {
            id: 2,
            rcdts: '05-016-2260-17-0003',
            school_name: 'Buffalo Grove High School',
            city: 'Buffalo Grove',
            district: 'Township HSD 214',
            school_type: 'High School',
          },
        ],
        total: 2,
      });
    }

    return HttpResponse.json({ results: [], total: 0 });
  })
);

beforeAll(() => {
  server.listen();
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = (initialRoute = '/search?q=grove') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SearchResults', () => {
  it('displays search results from URL query parameter', async () => {
    render(<SearchResults />, { wrapper: createWrapper('/search?q=grove') });

    await waitFor(() => {
      expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    });

    expect(screen.getByText('Buffalo Grove High School')).toBeInTheDocument();
  });

  it('displays "no results" message when search returns empty', async () => {
    render(<SearchResults />, { wrapper: createWrapper('/search?q=xyz') });

    await waitFor(() => {
      expect(screen.getByText(/no schools found/i)).toBeInTheDocument();
    });
  });

  it('displays SearchBar at top of results', () => {
    render(<SearchResults />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search for schools/i)).toBeInTheDocument();
  });
});
