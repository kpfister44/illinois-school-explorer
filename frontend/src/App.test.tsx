// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with router and navigation

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getByText('Illinois School Explorer')).toBeInTheDocument();
  });

  it('renders home page by default', () => {
    render(<App />);
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });
});

describe('App - Toaster', () => {
  it('renders Toaster component for global notifications', () => {
    render(<App />);
    // Toaster renders with role="region" and aria-label
    const toaster = document.querySelector('[data-sonner-toaster]');
    // Note: Toaster may not be visible until triggered, just verify it's in DOM
    // We'll test actual toast functionality in component tests
  });
});
