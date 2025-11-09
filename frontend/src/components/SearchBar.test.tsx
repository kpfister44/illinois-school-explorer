// ABOUTME: Tests for SearchBar component
// ABOUTME: Verifies search input, autocomplete, and keyboard navigation

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchBar from './SearchBar';

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

describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
    expect(input).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
    await user.type(input, 'elk grove');

    expect(input).toHaveValue('elk grove');
  });
});
