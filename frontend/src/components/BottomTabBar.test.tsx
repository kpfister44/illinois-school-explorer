// ABOUTME: Tests for BottomTabBar component
// ABOUTME: Verifies destinations, the current-page marker, and the Compare count badge

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import BottomTabBar from './BottomTabBar';

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ComparisonProvider>
        <BottomTabBar />
      </ComparisonProvider>
    </MemoryRouter>
  );
  return within(screen.getByRole('navigation', { name: 'Primary' }));
}

describe('BottomTabBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('links to Search, Compare and Top scores', () => {
    const nav = renderAt('/');

    expect(nav.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/');
    expect(nav.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
    expect(nav.getByRole('link', { name: 'Top scores' })).toHaveAttribute('href', '/top-scores');
  });

  it('shows how many schools are selected on the Compare tab', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['a', 'b', 'c']));

    const nav = renderAt('/');

    expect(nav.getByRole('link', { name: 'Compare 3 schools selected' })).toBeInTheDocument();
    expect(nav.getByText('3')).toBeInTheDocument();
  });

  it('marks the tab for the current page', () => {
    const nav = renderAt('/top-scores');

    expect(nav.getByRole('link', { name: 'Top scores' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Search current on the results page', () => {
    const nav = renderAt('/search?q=elk');

    expect(nav.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks no tab on a school page', () => {
    const nav = renderAt('/school/05-016-2140-17-0002');

    expect(nav.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toEqual([]);
  });
});
