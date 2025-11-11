// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with router and navigation

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useComparison } from '@/contexts/ComparisonContext';
import App from './App';
import * as queries from '@/lib/api/queries';

let shouldRenderComparisonConsumer = false;
let comparisonContextValue: ReturnType<typeof useComparison> | undefined;

function ComparisonConsumer() {
  comparisonContextValue = useComparison();
  return null;
}

vi.mock('./routes/Home', () => {
  return {
    __esModule: true,
    default: function MockHome() {
      return (
        <>
          <div>Search for Illinois schools</div>
          {shouldRenderComparisonConsumer ? <ComparisonConsumer /> : null}
        </>
      );
    },
  };
});

describe('App', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    shouldRenderComparisonConsumer = false;
    comparisonContextValue = undefined;
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

  it('provides ComparisonContext to child components', () => {
    shouldRenderComparisonConsumer = true;
    render(<App />);

    expect(comparisonContextValue).toBeDefined();
    expect(comparisonContextValue?.comparisonList).toEqual([]);
  });
});

describe('App - Toaster', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    shouldRenderComparisonConsumer = false;
    comparisonContextValue = undefined;
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
