// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with correct header text

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getByText('Illinois School Explorer')).toBeInTheDocument();
  });

  it('renders the foundation setup message', () => {
    render(<App />);
    expect(screen.getByText('Frontend foundation setup')).toBeInTheDocument();
  });
});
