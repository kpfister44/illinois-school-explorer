// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies welcome message renders correctly

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Home', () => {
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
});
