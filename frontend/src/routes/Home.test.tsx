// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies the headline, search field, level chips, browse links and school count

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

function mockStats(result: Partial<ReturnType<typeof queries.useStats>>) {
  vi.spyOn(queries, 'useStats').mockReturnValue({
    isLoading: false,
    isError: false,
    error: null,
    ...result,
  } as unknown as ReturnType<typeof queries.useStats>);
}

describe('Home', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    mockStats({ data: { schools: 3828, districts: 864, cities: 845 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens with the headline', () => {
    render(<Home />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Look up any Illinois public school' })
    ).toBeInTheDocument();
  });

  it('renders SearchBar component', () => {
    render(<Home />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText('School, city or district')).toBeInTheDocument();
  });

  it('links each level to its list of schools', () => {
    render(<Home />, { wrapper: createWrapper() });
    const levels = within(screen.getByRole('navigation', { name: 'School level' }));

    expect(levels.getByRole('link', { name: 'High schools' })).toHaveAttribute(
      'href',
      '/search?level=high'
    );
    expect(levels.getByRole('link', { name: 'Middle schools' })).toHaveAttribute(
      'href',
      '/search?level=middle'
    );
    expect(levels.getByRole('link', { name: 'Elementary schools' })).toHaveAttribute(
      'href',
      '/search?level=elementary'
    );
  });

  it('links to districts, cities and top scores with how many there are', () => {
    render(<Home />, { wrapper: createWrapper() });
    const browse = within(screen.getByRole('region', { name: 'Browse' }));

    const districts = browse.getByRole('link', { name: /By district/ });
    expect(districts).toHaveAttribute('href', '/browse?by=district');
    expect(districts).toHaveTextContent('864 districts');
    const cities = browse.getByRole('link', { name: /By city or town/ });
    expect(cities).toHaveAttribute('href', '/browse?by=city');
    expect(cities).toHaveTextContent('845 places');
    expect(browse.getByRole('link', { name: /Top scores/ })).toHaveAttribute('href', '/top-scores');
  });

  it('keeps the browse links while the counts are loading', () => {
    mockStats({ data: undefined, isLoading: true });

    render(<Home />, { wrapper: createWrapper() });
    const browse = within(screen.getByRole('region', { name: 'Browse' }));

    expect(browse.getByRole('link', { name: 'By district' })).toHaveAttribute(
      'href',
      '/browse?by=district'
    );
    expect(browse.queryByText(/districts$/)).not.toBeInTheDocument();
  });

  it('shows how many schools the site covers', () => {
    render(<Home />, { wrapper: createWrapper() });

    expect(screen.getByText('3,828 schools available')).toBeInTheDocument();
  });
});
