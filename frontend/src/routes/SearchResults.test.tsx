// ABOUTME: Tests for SearchResults page
// ABOUTME: Verifies the list rows, level chips, filters, sort and paging, all driven by the URL

import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import SearchResults from './SearchResults';
import {
  CLEARMONT_ELEMENTARY,
  DISTRICTS,
  ELK_GROVE_HIGH,
  listItem,
} from '@/test/schoolList';

const toastSpy = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let listRequests: URLSearchParams[] = [];

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const MANY_SCHOOLS = Array.from({ length: 30 }, (_, index) =>
  listItem({ rcdts: `15-016-2990-25-${String(index).padStart(4, '0')}`, display_name: `School ${index + 1}` })
);

const server = setupServer(
  http.get('http://localhost:8000/api/schools', ({ request }) => {
    const params = new URL(request.url).searchParams;
    listRequests.push(params);

    if (params.get('q') === 'nothing') {
      return HttpResponse.json({ results: [], total: 0 });
    }
    if (params.get('county') === 'Madison') {
      return HttpResponse.json({ results: [CLEARMONT_ELEMENTARY], total: 1 });
    }
    if (params.get('district') === '15-016-2990-25') {
      const offset = Number(params.get('offset'));
      return HttpResponse.json({ results: MANY_SCHOOLS.slice(offset, offset + 25), total: 30 });
    }
    return HttpResponse.json({ results: [CLEARMONT_ELEMENTARY, ELK_GROVE_HIGH], total: 2 });
  }),
  http.get('http://localhost:8000/api/districts', () => HttpResponse.json({ districts: DISTRICTS })),
  http.get('http://localhost:8000/api/search', () => HttpResponse.json({ results: [], total: 0 }))
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  listRequests = [];
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  server.resetHandlers();
  toastSpy.mockReset();
  consoleErrorSpy.mockRestore();
});
afterAll(() => server.close());

function Address() {
  const { pathname, search } = useLocation();
  return <p data-testid="address">{pathname + search}</p>;
}

function renderAt(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
        <Address />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const address = () => screen.getByTestId('address').textContent;
const lastRequest = () => Object.fromEntries(listRequests[listRequests.length - 1]);
const results = () => within(screen.getByRole('list', { name: 'Schools' }));

describe('SearchResults', () => {
  it('lists each school with its facts and headline score', async () => {
    renderAt('/search?q=grove');

    const row = await screen.findByRole('link', { name: /Elk Grove High School/ });
    expect(row).toHaveAttribute('href', '/school/05-016-2140-17-0002');
    expect(row).toHaveTextContent('Township HSD 214 · 9–12 · 1,721 students');
    expect(row).toHaveTextContent('18.1');
    expect(row).toHaveTextContent('ACT average');
    expect(screen.getByRole('link', { name: /Clearmont Elementary School/ })).toHaveTextContent(
      'IAR proficient'
    );
    expect(screen.getByText('2 schools')).toBeInTheDocument();
  });

  it('asks the API for the search and filters in the URL', async () => {
    renderAt(
      '/search?q=grove&level=high&county=Cook&city=Elk+Grove+Village&designation=Exemplary' +
        '&enrollment_min=300&low_income_max=42.5&sort=score'
    );

    await screen.findByRole('link', { name: /Elk Grove High School/ });
    expect(lastRequest()).toEqual({
      q: 'grove',
      level: 'high',
      county: 'Cook',
      city: 'Elk Grove Village',
      designation: 'Exemplary',
      enrollment_min: '300',
      low_income_max: '42.5',
      sort: 'score',
      order: 'desc',
      limit: '25',
      offset: '0',
    });
  });

  it('lists every school when the URL has no search or filter', async () => {
    renderAt('/search');

    await screen.findByRole('link', { name: /Elk Grove High School/ });
    expect(lastRequest()).toEqual({ limit: '25', offset: '0' });
    expect(screen.getByRole('heading', { level: 1, name: 'Illinois schools' })).toBeInTheDocument();
  });

  it('names the search or the city in its headline', async () => {
    renderAt('/search?q=grove');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Results for “grove”' })
    ).toBeInTheDocument();
  });

  it('headlines a city and lets the visitor leave it', async () => {
    const user = userEvent.setup();
    renderAt('/search?city=Elk+Grove+Village&level=high');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Schools in Elk Grove Village' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'All of Illinois' }));

    expect(address()).toBe('/search?level=high');
  });

  it('puts the search words in the search field', async () => {
    renderAt('/search?q=grove');

    expect(screen.getByPlaceholderText('School, city or district')).toHaveValue('grove');
  });

  it('offers a chip for each level that keeps the other filters', async () => {
    renderAt('/search?q=grove&county=Cook&level=middle&sort=score');
    const chips = within(screen.getByRole('navigation', { name: 'School level' }));

    expect(chips.getAllByRole('link').map((chip) => chip.textContent)).toEqual([
      'All levels',
      'Elementary',
      'Middle',
      'High',
    ]);
    expect(chips.getByRole('link', { name: 'Middle' })).toHaveAttribute('aria-current', 'true');
    expect(chips.getByRole('link', { name: 'High' })).toHaveAttribute(
      'href',
      '/search?q=grove&level=high&county=Cook&sort=score'
    );
    expect(chips.getByRole('link', { name: 'All levels' })).toHaveAttribute(
      'href',
      '/search?q=grove&county=Cook'
    );
  });

  it('marks All levels when no level is chosen', () => {
    renderAt('/search');
    const chips = within(screen.getByRole('navigation', { name: 'School level' }));

    expect(chips.getByRole('link', { name: 'All levels' })).toHaveAttribute('aria-current', 'true');
    expect(chips.getByRole('link', { name: 'High' })).not.toHaveAttribute('aria-current');
  });

  it('puts applied filters in the URL and lists the matching schools', async () => {
    const user = userEvent.setup();
    renderAt('/search?level=elementary');
    const filters = within(screen.getByRole('complementary', { name: 'Filters' }));

    await filters.findByRole('option', { name: 'Madison' });
    await user.selectOptions(filters.getByLabelText('County'), 'Madison');
    await user.click(filters.getByRole('button', { name: 'Show schools' }));

    expect(address()).toBe('/search?level=elementary&county=Madison');
    expect(await screen.findByText('1 school')).toBeInTheDocument();
    expect(results().getAllByRole('link')).toHaveLength(1);
  });

  it('opens the filters in a sheet from the Filters button and closes it on applying', async () => {
    const user = userEvent.setup();
    renderAt('/search?county=Cook&enrollment_min=300');

    await user.click(screen.getByRole('button', { name: 'Filters (2)' }));
    const sheet = within(await screen.findByRole('dialog', { name: 'Filters' }));
    await sheet.findByRole('option', { name: 'Madison' });
    await user.selectOptions(sheet.getByLabelText('County'), 'Madison');
    await user.click(sheet.getByRole('button', { name: 'Show schools' }));

    expect(address()).toBe('/search?county=Madison&enrollment_min=300');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sorts by name unless asked otherwise, and by best match for a search', async () => {
    renderAt('/search?level=high');
    const sort = screen.getByLabelText('Sort by');
    expect(within(sort).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Name',
      'Highest score',
      'Most students',
    ]);
    expect(sort).toHaveDisplayValue('Name');
  });

  it('puts the chosen sort in the URL', async () => {
    const user = userEvent.setup();
    renderAt('/search?level=high');

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Highest score');

    expect(address()).toBe('/search?level=high&sort=score');
    await waitFor(() => expect(lastRequest()).toMatchObject({ sort: 'score', order: 'desc' }));
    expect(screen.getByLabelText('Sort by')).toHaveDisplayValue('Highest score');
  });

  it('loads the next page when asked and stops offering more at the end', async () => {
    const user = userEvent.setup();
    renderAt('/search?district=15-016-2990-25');

    await screen.findByRole('link', { name: /School 25/ });
    expect(results().getAllByRole('link')).toHaveLength(25);
    expect(screen.getByText('30 schools')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more schools' }));

    await screen.findByRole('link', { name: /School 30/ });
    expect(results().getAllByRole('link')).toHaveLength(30);
    expect(lastRequest()).toMatchObject({ offset: '25' });
    expect(screen.queryByRole('button', { name: 'Show more schools' })).not.toBeInTheDocument();
  });

  it('says when no school matches', async () => {
    renderAt('/search?q=nothing');

    expect(await screen.findByText('No schools found')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Schools' })).not.toBeInTheDocument();
  });

  it('shows toast notification when the list cannot be loaded', async () => {
    server.use(
      http.get('http://localhost:8000/api/schools', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 })
      )
    );

    renderAt('/search?q=crash');

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Search Failed', variant: 'destructive' })
      );
    });
    expect(screen.getByText('The schools could not be loaded.')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
