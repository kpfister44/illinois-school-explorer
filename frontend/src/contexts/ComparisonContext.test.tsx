// ABOUTME: Tests for ComparisonContext
// ABOUTME: Verifies add/remove/clear operations and localStorage persistence

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ComparisonProvider, useComparison } from './ComparisonContext';

describe('ComparisonContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts with empty comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    expect(result.current.comparisonList).toEqual([]);
  });

  it('adds school to comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0001']);
  });

  it('removes school from comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
      result.current.addToComparison('12-345-6789-01-0002');
    });

    act(() => {
      result.current.removeFromComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0002']);
  });

  it('prevents adding more than 5 schools', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('rcdts-1');
      result.current.addToComparison('rcdts-2');
      result.current.addToComparison('rcdts-3');
      result.current.addToComparison('rcdts-4');
      result.current.addToComparison('rcdts-5');
    });

    expect(result.current.comparisonList).toHaveLength(5);
    expect(result.current.canAddMore).toBe(false);

    act(() => {
      result.current.addToComparison('rcdts-6');
    });

    expect(result.current.comparisonList).toHaveLength(5);
  });

  it('checks if school is in comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.isInComparison('12-345-6789-01-0001')).toBe(true);
    expect(result.current.isInComparison('12-345-6789-01-0002')).toBe(false);
  });

  it('clears all schools from comparison', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('rcdts-1');
      result.current.addToComparison('rcdts-2');
    });

    expect(result.current.comparisonList).toHaveLength(2);

    act(() => {
      result.current.clearComparison();
    });

    expect(result.current.comparisonList).toEqual([]);
  });

  it('persists to localStorage when adding school', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    const stored = localStorage.getItem('school-comparison');
    expect(stored).toBe(JSON.stringify(['12-345-6789-01-0001']));
  });

  it('loads from localStorage on mount', () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['12-345-6789-01-0001', '12-345-6789-01-0002'])
    );

    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    expect(result.current.comparisonList).toEqual([
      '12-345-6789-01-0001',
      '12-345-6789-01-0002',
    ]);
  });

  it('prevents duplicate schools', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0001']);
  });
});
