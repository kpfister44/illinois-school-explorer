// ABOUTME: Unit tests for SchoolCount component
// ABOUTME: Verifies the home page count comes from the stats endpoint, with loading and error states

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchoolCount from './SchoolCount';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

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

beforeEach(() => {
  mockedGet.mockReset();
});

describe('SchoolCount', () => {
  it('displays loading state while the count is requested', () => {
    mockedGet.mockReturnValue(new Promise(() => {}));

    render(<SchoolCount />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays the number of schools from the stats endpoint', async () => {
    mockedGet.mockResolvedValue({ data: { schools: 3828, districts: 864, cities: 845 } });

    render(<SchoolCount />, { wrapper: createWrapper() });

    expect(await screen.findByText('3,828 schools available')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/stats');
  });

  it('displays error message on failure', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'));

    render(<SchoolCount />, { wrapper: createWrapper() });

    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });
});
