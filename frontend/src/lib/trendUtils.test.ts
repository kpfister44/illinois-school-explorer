// ABOUTME: Unit tests for trend utility functions
// ABOUTME: Tests signed formatting of a change in a metric

import { describe, it, expect } from 'vitest';
import { formatTrendValue } from './trendUtils';

describe('formatTrendValue', () => {
  it('formats positive integer with plus sign and unit', () => {
    expect(formatTrendValue(50, 'students')).toBe('+50 students');
  });

  it('formats negative integer with minus sign and unit', () => {
    expect(formatTrendValue(-50, 'students')).toBe('-50 students');
  });

  it('formats positive decimal with one decimal place', () => {
    expect(formatTrendValue(2.5, 'points')).toBe('+2.5 points');
  });

  it('formats negative decimal with one decimal place', () => {
    expect(formatTrendValue(-2.5, 'points')).toBe('-2.5 points');
  });

  it('formats zero', () => {
    expect(formatTrendValue(0, 'students')).toBe('0 students');
  });

  it('rounds to one decimal place', () => {
    expect(formatTrendValue(2.567, 'points')).toBe('+2.6 points');
  });
});
