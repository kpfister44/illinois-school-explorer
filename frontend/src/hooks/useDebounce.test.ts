// ABOUTME: Tests for useDebounce hook
// ABOUTME: Verifies debouncing delays value updates correctly

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('delays updating value until after delay period', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    expect(result.current).toBe('first');

    // Update the value
    rerender({ value: 'second', delay: 500 });

    // Should still be first immediately after change
    expect(result.current).toBe('first');

    // Fast forward time by 499ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('first');

    // Fast forward remaining 1ms to complete delay
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('resets timer if value changes before delay completes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Change value again before 500ms completes
    rerender({ value: 'third' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should still be 'first' because timer was reset
    expect(result.current).toBe('first');

    // Complete the full delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('third');
  });
});
