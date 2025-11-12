// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies welcome message and SearchBar render correctly

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';
import * as queries from '@/lib/api/queries';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Home', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: { results: [], total: 3827 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders welcome message', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });

  it('renders search instruction', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByText(/enter a school name or city/i)).toBeInTheDocument();
  });

  it('renders SearchBar component', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText(/search for schools/i)).toBeInTheDocument();
  });

  it('renders top scores CTA with link', () => {
    render(<Home />, { wrapper: createWrapper() });
    const cta = screen.getByRole('link', { name: /Explore Top 100 Scores/i });
    expect(cta).toHaveAttribute('href', '/top-scores');
  });
});
