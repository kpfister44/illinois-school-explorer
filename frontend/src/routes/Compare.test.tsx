// ABOUTME: Tests for Compare route component
// ABOUTME: Verifies the comparison follows its URL, is remembered, and handles empty, loading and error states

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import type { CompareResponse, SchoolDetail } from '@/lib/api/types';
import Compare from './Compare';

const mockUseCompare = vi.fn();
const mockToast = vi.fn();

vi.mock('@/lib/api/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/queries')>()),
  useCompare: (...args: unknown[]) => mockUseCompare(...args),
  getSchoolDetail: (rcdts: string) =>
    Promise.resolve({
      id: 1,
      rcdts,
      school_name: `School ${rcdts}`,
      display_name: `School ${rcdts}`,
      city: 'Elk Grove Village',
      district: 'Township HSD 214',
      school_type: 'High School',
    }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const ELK_GROVE = '05-016-2140-17-0002';
const ROLLING_MEADOWS = '05-016-2140-17-0007';
const HERSEY = '05-016-2140-17-0004';
const STORAGE_KEY = 'school-comparison';

function school(rcdts: string, name: string): SchoolDetail {
  return {
    id: 1,
    rcdts,
    school_name: name,
    display_name: name,
    city: 'Arlington Heights',
    district: 'Township HSD 214',
    county: 'Cook',
    school_type: 'High School',
    grades_served: '9-12',
    designation: 'Commendable',
    metrics: {
      enrollment: 1775,
      act: { ela_avg: 17.7, math_avg: 18.2, science_avg: 18.9, overall_avg: 17.9 },
      iar_ela_proficiency_pct: null,
      iar_math_proficiency_pct: null,
      iar_overall_proficiency_pct: null,
      demographics: { el_percentage: 29.0, low_income_percentage: 38.4 },
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
  };
}

const LOADED: CompareResponse = {
  schools: [
    school(ELK_GROVE, 'Elk Grove High School'),
    school(ROLLING_MEADOWS, 'Rolling Meadows High School'),
  ],
};

function CurrentUrl() {
  const location = useLocation();
  return <p data-testid="url">{`${location.pathname}${location.search}`}</p>;
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/compare" element={<Compare />} />
          </Routes>
          <CurrentUrl />
        </MemoryRouter>
      </ComparisonProvider>
    </QueryClientProvider>
  );
}

const currentUrl = () => screen.getByTestId('url').textContent;
const remembered = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

function compareReturns(result: Partial<ReturnType<typeof mockUseCompare>>) {
  mockUseCompare.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...result,
  });
}

describe('Compare', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseCompare.mockReset();
    mockToast.mockReset();
    compareReturns({});
  });

  it('shows message when no schools selected', () => {
    renderAt('/compare');

    expect(screen.getByText(/no schools selected/i)).toBeInTheDocument();
  });

  it('opens the remembered comparison at its own URL', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([ELK_GROVE, ROLLING_MEADOWS]));

    renderAt('/compare');

    await waitFor(() =>
      expect(currentUrl()).toBe(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`)
    );
  });

  it('compares the schools in the URL and remembers them in place of the earlier list', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([HERSEY]));
    compareReturns({ data: LOADED });

    renderAt(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`);

    expect(mockUseCompare).toHaveBeenLastCalledWith([ELK_GROVE, ROLLING_MEADOWS]);
    expect(screen.getByRole('link', { name: 'Elk Grove High School' })).toBeInTheDocument();
    await waitFor(() => expect(remembered()).toEqual([ELK_GROVE, ROLLING_MEADOWS]));
  });

  it('shows message when only one school selected', () => {
    renderAt(`/compare?schools=${ELK_GROVE}`);

    expect(screen.getByText(/select at least 2 schools/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching schools', () => {
    compareReturns({ isLoading: true });

    renderAt(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`);

    expect(screen.getByText(/loading comparison/i)).toBeInTheDocument();
  });

  it('shows error state when fetching fails', async () => {
    compareReturns({ isError: true, error: new Error('Network error') });

    renderAt(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`);

    await waitFor(() => {
      expect(screen.getByText(/failed to load comparison/i)).toBeInTheDocument();
    });
    expect(mockToast).toHaveBeenCalled();
  });

  it('removes a school from the URL and the remembered list', async () => {
    const user = userEvent.setup();
    compareReturns({ data: LOADED });

    renderAt(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS},${HERSEY}`);
    await user.click(screen.getByRole('button', { name: 'Remove Elk Grove High School' }));

    expect(currentUrl()).toBe(`/compare?schools=${ROLLING_MEADOWS},${HERSEY}`);
    await waitFor(() => expect(remembered()).toEqual([ROLLING_MEADOWS, HERSEY]));
  });

  it('lists a lone selected school so it can be removed', async () => {
    const user = userEvent.setup();

    renderAt(`/compare?schools=${ELK_GROVE}`);

    expect(screen.getByText('1 school selected')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: `Remove School ${ELK_GROVE}` }));

    expect(screen.getByText(/no schools selected/i)).toBeInTheDocument();
    expect(screen.queryByText(/school selected/i)).not.toBeInTheDocument();
  });

  it('clears every selected school at once', async () => {
    const user = userEvent.setup();
    compareReturns({ data: LOADED });

    renderAt(`/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`);
    expect(screen.getByText('2 schools selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(screen.getByText(/no schools selected/i)).toBeInTheDocument();
    expect(currentUrl()).toBe('/compare?schools=');
    await waitFor(() => expect(remembered()).toEqual([]));
  });
});
