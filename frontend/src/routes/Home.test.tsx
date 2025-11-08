// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies welcome message renders correctly

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Home', () => {
  it('renders welcome message', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });

  it('renders search instruction', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByText(/enter a school name or city/i)).toBeInTheDocument();
  });
});
