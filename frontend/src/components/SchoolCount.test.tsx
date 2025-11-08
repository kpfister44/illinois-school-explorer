// ABOUTME: Unit tests for SchoolCount component
// ABOUTME: Verifies component displays loading, error, and data states

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchoolCount from './SchoolCount';
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

describe('SchoolCount', () => {
  it('displays loading state initially', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays school count when data loads', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: { results: [], total: 3827 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/3,827 schools available/i)).toBeInTheDocument();
  });

  it('displays error message on failure', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
