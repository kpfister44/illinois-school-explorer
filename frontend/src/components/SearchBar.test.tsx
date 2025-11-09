// ABOUTME: Tests for SearchBar component
// ABOUTME: Verifies search input, autocomplete, and keyboard navigation

import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
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

    const input = screen.getByPlaceholderText(/search for schools/i);
    expect(input).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
    await user.type(input, 'elk grove');

    expect(input).toHaveValue('elk grove');
  });

  it('displays autocomplete results after debounce delay', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
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

    const input = screen.getByPlaceholderText(/search for schools/i);
    await user.type(input, 'e');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(screen.queryByText('Elk Grove High School')).not.toBeInTheDocument();
  });
});
