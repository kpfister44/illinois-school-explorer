// ABOUTME: Tests for SiteHeader component
// ABOUTME: Verifies the site title, desktop navigation, and the header search field

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import SiteHeader from './SiteHeader';

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <ComparisonProvider>
          <SiteHeader />
        </ComparisonProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SiteHeader', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('links the site title to Home', () => {
    renderAt('/top-scores');

    expect(screen.getByRole('link', { name: 'Illinois School Explorer' })).toHaveAttribute('href', '/');
  });

  it('links to Compare and Top scores, without a Search link', () => {
    renderAt('/top-scores');
    const nav = within(screen.getByRole('navigation', { name: 'Primary' }));

    expect(nav.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
    expect(nav.getByRole('link', { name: 'Top scores' })).toHaveAttribute('aria-current', 'page');
    expect(nav.queryByRole('link', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('shows how many schools are selected beside Compare', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['a', 'b']));

    renderAt('/top-scores');

    expect(screen.getByRole('link', { name: 'Compare 2 schools selected' })).toBeInTheDocument();
  });

  it('has a search field on pages other than Home', () => {
    renderAt('/school/05-016-2140-17-0002');

    expect(screen.getByPlaceholderText(/search for schools/i)).toBeInTheDocument();
  });

  it('leaves the search field to the Home page itself', () => {
    renderAt('/');

    expect(screen.queryByPlaceholderText(/search for schools/i)).not.toBeInTheDocument();
  });
});
