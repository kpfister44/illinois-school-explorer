// ABOUTME: Tests for useComparisonSchools hook
// ABOUTME: Verifies fetching school data for comparison list

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import { useComparisonSchools } from './useComparisonSchools';
import * as apiQueries from '@/lib/api/queries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>{children}</ComparisonProvider>
    </QueryClientProvider>
  );
}

describe('useComparisonSchools', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns empty array when no schools in comparison', () => {
    const { result } = renderHook(() => useComparisonSchools(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual([]);
  });

  it('fetches schools from comparison list', async () => {
    localStorage.setItem('school-comparison', JSON.stringify(['05-016-2140-17-0002']));

    vi.spyOn(apiQueries, 'getSchoolDetail').mockResolvedValue({
      id: 1,
      rcdts: '05-016-2140-17-0002',
      school_name: 'Elk Grove High School',
      city: 'Elk Grove Village',
      district: 'Township HSD 214',
      school_type: 'High School',
      county: 'Cook',
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
    });

    const { result } = renderHook(() => useComparisonSchools(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          id: 1,
          rcdts: '05-016-2140-17-0002',
          school_name: 'Elk Grove High School',
          city: 'Elk Grove Village',
          district: 'Township HSD 214',
          school_type: 'High School',
        },
      ]);
    });
  });
});
