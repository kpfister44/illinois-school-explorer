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

  it('preserves comparison order when multiple schools are selected', async () => {
    const schools = ['05-016-2140-17-0001', '05-016-2140-17-0002'];
    localStorage.setItem('school-comparison', JSON.stringify(schools));

    vi.spyOn(apiQueries, 'getSchoolDetail').mockImplementation((rcdts: string) => {
      return Promise.resolve({
        id: rcdts.endsWith('0001') ? 1 : 2,
        rcdts,
        school_name: rcdts.endsWith('0001') ? 'First School' : 'Second School',
        city: 'City',
        district: 'District',
        school_type: 'High School',
        county: null,
        grades_served: null,
        metrics: {
          enrollment: null,
          act: { ela_avg: null, math_avg: null, science_avg: null, overall_avg: null },
          demographics: { el_percentage: null, low_income_percentage: null },
          diversity: {
            white: null,
            black: null,
            hispanic: null,
            asian: null,
            pacific_islander: null,
            native_american: null,
            two_or_more: null,
            mena: null,
          },
        },
      });
    });

    const { result } = renderHook(() => useComparisonSchools(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.map((school) => school.rcdts)).toEqual(schools);
    });
  });

  it('includes placeholder entries when a school fails to load', async () => {
    const schools = ['05-016-2140-17-0001', '05-016-2140-17-0002'];
    localStorage.setItem('school-comparison', JSON.stringify(schools));

    const detailSpy = vi.spyOn(apiQueries, 'getSchoolDetail');
    detailSpy.mockImplementation((rcdts: string) => {
      if (rcdts === schools[0]) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({
        id: 2,
        rcdts,
        school_name: 'Loaded School',
        city: 'City',
        district: 'District',
        school_type: 'High School',
        county: null,
        grades_served: null,
        metrics: {
          enrollment: null,
          act: { ela_avg: null, math_avg: null, science_avg: null, overall_avg: null },
          demographics: { el_percentage: null, low_income_percentage: null },
          diversity: {
            white: null,
            black: null,
            hispanic: null,
            asian: null,
            pacific_islander: null,
            native_american: null,
            two_or_more: null,
            mena: null,
          },
        },
      });
    });

    const { result } = renderHook(() => useComparisonSchools(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current[0].rcdts).toBe(schools[0]);
      expect(result.current[0].school_name).toMatch(/unavailable|loading/i);
      expect(result.current[1].school_name).toBe('Loaded School');
    });
  });
});
