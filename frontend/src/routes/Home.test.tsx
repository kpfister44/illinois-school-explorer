// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies welcome message renders correctly

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders welcome message', () => {
    render(<Home />);
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });

  it('renders search instruction', () => {
    render(<Home />);
    expect(screen.getByText(/enter a school name or city/i)).toBeInTheDocument();
  });
});
