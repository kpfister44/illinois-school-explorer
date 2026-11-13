// ABOUTME: Tests for SearchBar component
// ABOUTME: Verifies search input, autocomplete, and keyboard navigation

import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act } from 'react';
import SearchBar from './SearchBar';

const server = setupServer(
  http.get('http://localhost:8000/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query === 'elk') {
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
        ],
        total: 1,
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('School, city or district');
    expect(input).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('School, city or district');
    await user.type(input, 'elk grove');

    expect(input).toHaveValue('elk grove');
  });

  it('displays autocomplete results after debounce delay', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('School, city or district');
    await user.type(input, 'elk');

    await waitFor(
      () => {
        expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(screen.getByText(/Elk Grove Village/i)).toBeInTheDocument();
  });

  it('does not search until 2 characters entered', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('School, city or district');
    await user.type(input, 'e');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(screen.queryByText('Elk Grove High School')).not.toBeInTheDocument();
  });

  it('hides results when the field loses focus and shows them again on return', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('School, city or district');
    await user.type(input, 'elk');
    await screen.findByText('Elk Grove High School');

    await user.tab();
    expect(screen.queryByText('Elk Grove High School')).not.toBeInTheDocument();

    await user.click(input);
    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
  });

  it('opens the school when a result is clicked', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SearchBar />
        <Routes>
          <Route path="/school/:rcdts" element={<div>School page</div>} />
          <Route path="*" element={null} />
        </Routes>
      </>,
      { wrapper: createWrapper() }
    );

    await user.type(screen.getByPlaceholderText('School, city or district'), 'elk');
    await user.click(await screen.findByText('Elk Grove High School'));

    expect(screen.getByText('School page')).toBeInTheDocument();
  });

  it('opens the results list for the typed words when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchBarWithResultsPage />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('School, city or district'), 'elk grove{Enter}');

    expect(screen.getByText('Results page ?q=elk+grove')).toBeInTheDocument();
  });

  it('opens the results list when the suggestions have loaded and Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchBarWithResultsPage />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('School, city or district'), 'elk');
    await screen.findByText('Elk Grove High School');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Results page ?q=elk')).toBeInTheDocument();
  });

  it('offers every result above the suggested schools', async () => {
    const user = userEvent.setup();
    render(<SearchBarWithResultsPage />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('School, city or district'), 'elk');
    await screen.findByText('Elk Grove High School');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('See all results for “elk”');
    await user.click(options[0]);

    expect(screen.getByText('Results page ?q=elk')).toBeInTheDocument();
  });

  it('does not open the results list for a single character', async () => {
    const user = userEvent.setup();
    render(<SearchBarWithResultsPage />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('School, city or district'), 'e{Enter}');

    expect(screen.queryByText(/Results page/)).not.toBeInTheDocument();
  });

  it('says when no school matches', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText('School, city or district'), 'zzz');

    expect(await screen.findByText('No schools found.')).toBeInTheDocument();
  });

  it('starts with the words it is given', () => {
    render(<SearchBar defaultQuery="elk grove" />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText('School, city or district')).toHaveValue('elk grove');
  });
});

function ResultsPage() {
  return <div>Results page {useLocation().search}</div>;
}

function SearchBarWithResultsPage() {
  return (
    <>
      <SearchBar />
      <Routes>
        <Route path="/search" element={<ResultsPage />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  );
}
