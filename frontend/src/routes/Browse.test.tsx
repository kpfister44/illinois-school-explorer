// ABOUTME: Tests for the Browse page
// ABOUTME: Verifies the district and city lists, switching between them and narrowing by name

import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Browse from './Browse';
import { CITIES, DISTRICTS } from '@/test/schoolList';

const server = setupServer(
  http.get('http://localhost:8000/api/districts', () => HttpResponse.json({ districts: DISTRICTS })),
  http.get('http://localhost:8000/api/cities', () => HttpResponse.json({ cities: CITIES }))
);

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  server.resetHandlers();
  consoleErrorSpy.mockRestore();
});
afterAll(() => server.close());

function renderAt(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/browse" element={<Browse />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const places = () => within(screen.getByRole('list', { name: 'Places' })).getAllByRole('link');

describe('Browse', () => {
  it('lists districts first, each linked to its page with its county and school count', async () => {
    renderAt('/browse');

    const district = await screen.findByRole('link', { name: /Township HSD 214/ });
    expect(district).toHaveAttribute('href', '/district/05-016-2140-17');
    expect(district).toHaveTextContent('Cook County · 6 schools');
    expect(places()).toHaveLength(3);
    expect(screen.getByText('3 districts')).toBeInTheDocument();
  });

  it('lists cities and towns, each linked to its schools', async () => {
    renderAt('/browse?by=city');

    const city = await screen.findByRole('link', { name: /Elk Grove Village/ });
    expect(city).toHaveAttribute('href', '/search?city=Elk+Grove+Village');
    expect(city).toHaveTextContent('10 schools');
    expect(screen.getByRole('link', { name: /Avon/ })).toHaveTextContent('1 school');
    expect(screen.getByText('3 cities and towns')).toBeInTheDocument();
  });

  it('switches between districts and cities', async () => {
    const user = userEvent.setup();
    renderAt('/browse');
    const kinds = within(screen.getByRole('navigation', { name: 'Browse by' }));

    expect(kinds.getByRole('link', { name: 'Districts' })).toHaveAttribute('aria-current', 'true');
    await user.click(kinds.getByRole('link', { name: 'Cities and towns' }));

    expect(await screen.findByRole('link', { name: /Edwardsville/ })).toHaveAttribute(
      'href',
      '/search?city=Edwardsville'
    );
    expect(kinds.getByRole('link', { name: 'Cities and towns' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('narrows the list to names containing the typed letters', async () => {
    const user = userEvent.setup();
    renderAt('/browse');
    await screen.findByRole('link', { name: /Township HSD 214/ });

    await user.type(screen.getByLabelText('Narrow by name'), 'edw');

    expect(places().map((place) => place.textContent)).toEqual([
      'Edwardsville CUSD 7Madison County · 13 schools',
    ]);
    expect(screen.getByText('1 district')).toBeInTheDocument();
  });

  it('says when no name matches', async () => {
    const user = userEvent.setup();
    renderAt('/browse?by=city');
    await screen.findByRole('link', { name: /Avon/ });

    await user.type(screen.getByLabelText('Narrow by name'), 'zzz');

    expect(screen.getByText('No cities or towns match “zzz”.')).toBeInTheDocument();
  });

  it('links to the list of every school', () => {
    renderAt('/browse');

    expect(screen.getByRole('link', { name: 'See every school' })).toHaveAttribute('href', '/search');
  });

  it('says when the list cannot be loaded', async () => {
    server.use(
      http.get('http://localhost:8000/api/districts', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 })
      )
    );

    renderAt('/browse');

    expect(await screen.findByText('The districts could not be loaded.')).toBeInTheDocument();
  });
});
