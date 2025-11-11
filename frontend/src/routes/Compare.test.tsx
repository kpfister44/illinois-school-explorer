// ABOUTME: Tests for Compare route component
// ABOUTME: Verifies comparison page displays correctly

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import type { CompareResponse } from '@/lib/api/types';
import Compare from './Compare';

const mockUseCompare = vi.fn();
const mockToast = vi.fn();

vi.mock('@/lib/api/queries', () => ({
  useCompare: (...args: unknown[]) => mockUseCompare(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ComparisonProvider>
    </QueryClientProvider>
  );
}

describe('Compare', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseCompare.mockReset();
    mockToast.mockReset();
    mockUseCompare.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it('shows message when no schools selected', () => {
    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/no schools selected/i)).toBeInTheDocument();
  });

  it('shows message when only one school selected', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['05-016-2140-17-0002']));

    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/select at least 2 schools/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching schools', () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['05-016-2140-17-0002', '05-016-2140-17-0003'])
    );
    mockUseCompare.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading comparison/i)).toBeInTheDocument();
  });

  it('renders ComparisonView when schools are loaded', async () => {
    const response: CompareResponse = {
      schools: [
        {
          id: 1,
          rcdts: '05-016-2140-17-0002',
          school_name: 'Elk Grove High School',
          city: 'Elk Grove Village',
          district: 'Township HSD 214',
          county: 'Cook',
          school_type: 'High School',
          grades_served: '9-12',
          metrics: {
            enrollment: 1775,
            act: {
              ela_avg: 17.7,
              math_avg: 18.2,
              science_avg: 18.9,
              overall_avg: 17.95,
            },
            demographics: {
              el_percentage: 29.0,
              low_income_percentage: 38.4,
            },
            diversity: {
              white: 36.8,
              black: 1.9,
              hispanic: 48.3,
              asian: 8.7,
              pacific_islander: null,
              native_american: null,
              two_or_more: 3.0,
              mena: null,
            },
          },
        },
        {
          id: 2,
          rcdts: '05-016-2140-17-0003',
          school_name: 'Rolling Meadows High School',
          city: 'Rolling Meadows',
          district: 'Township HSD 214',
          county: 'Cook',
          school_type: 'High School',
          grades_served: '9-12',
          metrics: {
            enrollment: 1850,
            act: {
              ela_avg: 18.5,
              math_avg: 19.1,
              science_avg: 19.3,
              overall_avg: 18.8,
            },
            demographics: {
              el_percentage: 15.0,
              low_income_percentage: 25.0,
            },
            diversity: {
              white: 45.0,
              black: 3.0,
              hispanic: 35.0,
              asian: 12.0,
              pacific_islander: null,
              native_american: null,
              two_or_more: 4.0,
              mena: null,
            },
          },
        },
      ],
    };

    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['05-016-2140-17-0002', '05-016-2140-17-0003'])
    );
    mockUseCompare.mockReturnValue({
      data: response,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Compare />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
      expect(screen.getByText('Rolling Meadows High School')).toBeInTheDocument();
    });
  });

  it('shows error state when fetching fails', async () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['05-016-2140-17-0002', '05-016-2140-17-0003'])
    );
    const error = new Error('Network error');
    mockUseCompare.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    });

    render(<Compare />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load comparison/i)).toBeInTheDocument();
    });
    expect(mockToast).toHaveBeenCalled();
  });
});
