// ABOUTME: Tests for the site-wide Footer component
// ABOUTME: Verifies ISBE data source attribution and last updated date

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('links to the ISBE report card data source', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Illinois State Board of Education' })).toHaveAttribute(
      'href',
      'https://www.isbe.net/Pages/Illinois-State-Report-Card-Data.aspx'
    );
  });

  it('shows when the 2026 report card data was loaded', () => {
    render(<Footer />);

    expect(screen.getByText(/Last Updated: October 30, 2026/)).toBeInTheDocument();
  });
});
