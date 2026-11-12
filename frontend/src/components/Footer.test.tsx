// ABOUTME: Tests for the site-wide Footer component
// ABOUTME: Verifies ISBE data source attribution, last updated date and the How this works link

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe('Footer', () => {
  it('links to the ISBE report card data source', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Illinois State Board of Education' })).toHaveAttribute(
      'href',
      'https://www.isbe.net/Pages/Illinois-State-Report-Card-Data.aspx'
    );
  });

  it('shows when the 2026 report card data was loaded', () => {
    renderFooter();

    expect(screen.getByText(/Last Updated: October 30, 2026/)).toBeInTheDocument();
  });

  it('links to how the figures are worked out', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'How this works' })).toHaveAttribute(
      'href',
      '/how-this-works'
    );
  });
});
