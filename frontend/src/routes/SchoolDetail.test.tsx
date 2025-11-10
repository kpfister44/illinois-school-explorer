// ABOUTME: Tests for SchoolDetail page
// ABOUTME: Verifies school detail loading, error handling, and display

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import SchoolDetail from './SchoolDetail';

const toastSpy = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const mockSchoolDetail = {
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
};

const server = setupServer(
  http.get('http://localhost:8000/api/schools/:rcdts', ({ params }) => {
    if (params.rcdts === '05-016-2140-17-0002') {
      return HttpResponse.json(mockSchoolDetail);
    }
    return new HttpResponse(null, { status: 404 });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  toastSpy.mockReset();
});
afterAll(() => server.close());

const createWrapper = (rcdts: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/school/${rcdts}`]}>
        <Routes>
          <Route path="/school/:rcdts" element={<SchoolDetail />} />
        </Routes>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SchoolDetail', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('displays loading skeleton while fetching', () => {
    render(<SchoolDetail />, { wrapper: createWrapper('05-016-2140-17-0002') });

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays school detail after loading', async () => {
    render(<SchoolDetail />, { wrapper: createWrapper('05-016-2140-17-0002') });

    await waitFor(() => {
      expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    });

    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
  });

  it('displays error message when school not found', async () => {
    render(<SchoolDetail />, { wrapper: createWrapper('invalid-rcdts') });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const [label, status] = consoleErrorSpy.mock.calls[0];
    expect(label).toBe('API Error:');
    expect(status).toBe(404);
  });

  it('shows toast notification when detail request fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/schools/:rcdts', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 })
      )
    );

    render(<SchoolDetail />, { wrapper: createWrapper('05-016-2140-17-0002') });

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failed to Load School', variant: 'destructive' })
      );
    });
  });
});
