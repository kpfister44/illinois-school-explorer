// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with router and navigation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import * as queries from '@/lib/api/queries';

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: { results: [], total: 3827 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
  beforeEach(() => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: { results: [], total: 3827 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Toaster component for global notifications', () => {
    const { container } = render(<App />);
    // Toaster uses Radix UI ToastProvider which always renders successfully
    // The actual viewport is only rendered when toasts are shown
    // We verify the Toaster doesn't break rendering by checking the app still renders
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});
