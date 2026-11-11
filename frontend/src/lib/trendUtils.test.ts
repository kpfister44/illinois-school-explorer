// ABOUTME: Unit tests for trend utility functions
// ABOUTME: Tests percentage calculation, formatting, and thresholds

import { describe, it, expect } from 'vitest';
import {
  getTrendArrow,
  formatTrendValue,
  formatPercentage,
  shouldShowPercentage,
  calculatePercentageChange,
  trendFromHistory,
} from './trendUtils';

describe('getTrendArrow', () => {
  it('returns up arrow for positive delta', () => {
    expect(getTrendArrow(5)).toBe('↑');
  });

  it('returns down arrow for negative delta', () => {
    expect(getTrendArrow(-5)).toBe('↓');
  });

  it('returns right arrow for zero delta', () => {
    expect(getTrendArrow(0)).toBe('→');
  });

  it('returns right arrow for near-zero positive delta', () => {
    expect(getTrendArrow(0.03)).toBe('→');
  });

  it('returns right arrow for near-zero negative delta', () => {
    expect(getTrendArrow(-0.04)).toBe('→');
  });
});

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

describe('formatPercentage', () => {
  it('formats positive percentage with plus sign', () => {
    expect(formatPercentage(12.3)).toBe('+12.3%');
  });

  it('formats negative percentage with minus sign', () => {
    expect(formatPercentage(-12.3)).toBe('-12.3%');
  });

  it('formats zero percentage', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('returns em dash for null', () => {
    expect(formatPercentage(null)).toBe('—');
  });

  it('rounds to one decimal place', () => {
    expect(formatPercentage(12.367)).toBe('+12.4%');
  });
});

describe('shouldShowPercentage', () => {
  describe('enrollment (count)', () => {
    it('returns true when current >= 50', () => {
      expect(shouldShowPercentage(50, 'count')).toBe(true);
      expect(shouldShowPercentage(100, 'count')).toBe(true);
    });

    it('returns false when current < 50', () => {
      expect(shouldShowPercentage(49, 'count')).toBe(false);
      expect(shouldShowPercentage(10, 'count')).toBe(false);
    });
  });

  describe('ACT scores (score)', () => {
    it('returns true when current >= 10.0', () => {
      expect(shouldShowPercentage(10.0, 'score')).toBe(true);
      expect(shouldShowPercentage(20.5, 'score')).toBe(true);
    });

    it('returns false when current < 10.0', () => {
      expect(shouldShowPercentage(9.9, 'score')).toBe(false);
      expect(shouldShowPercentage(5.0, 'score')).toBe(false);
    });
  });

  describe('demographics/diversity (percentage)', () => {
    it('returns true when current >= 5.0', () => {
      expect(shouldShowPercentage(5.0, 'percentage')).toBe(true);
      expect(shouldShowPercentage(25.5, 'percentage')).toBe(true);
    });

    it('returns false when current < 5.0', () => {
      expect(shouldShowPercentage(4.9, 'percentage')).toBe(false);
      expect(shouldShowPercentage(1.0, 'percentage')).toBe(false);
    });
  });
});

describe('calculatePercentageChange', () => {
  it('calculates positive percentage change', () => {
    const result = calculatePercentageChange(100, 10, 'count');
    expect(result).toBeCloseTo(11.11, 1);
  });

  it('calculates negative percentage change', () => {
    const result = calculatePercentageChange(100, -10, 'count');
    expect(result).toBeCloseTo(-9.09, 1);
  });

  it('returns null when current value below threshold', () => {
    expect(calculatePercentageChange(40, 5, 'count')).toBe(null);
    expect(calculatePercentageChange(8.0, 1.0, 'score')).toBe(null);
    expect(calculatePercentageChange(3.0, 0.5, 'percentage')).toBe(null);
  });

  it('returns null when historical value would be zero', () => {
    expect(calculatePercentageChange(10, 10, 'count')).toBe(null);
  });

  it('returns null when historical value would be negative', () => {
    expect(calculatePercentageChange(10, 15, 'count')).toBe(null);
  });

  it('handles delta of zero', () => {
    const result = calculatePercentageChange(100, 0, 'count');
    expect(result).toBe(0);
  });
});

describe('trendFromHistory', () => {
  it('subtracts each base year from the current value', () => {
    const trend = trendFromHistory(17.6, {
      yr_2026: 17.6,
      yr_2025: 17.7,
      yr_2023: 17.0,
      yr_2021: 18.1,
      yr_2016: 21.1,
      yr_2011: 21.8,
    });

    expect(trend).toEqual({
      one_year: -0.1,
      three_year: 0.6,
      five_year: -0.5,
      ten_year: -3.5,
      fifteen_year: -4.2,
    });
  });

  it('leaves a window null when its base year is missing or suppressed', () => {
    const trend = trendFromHistory(17.6, { yr_2025: 17.7, yr_2023: null });

    expect(trend).toEqual({
      one_year: -0.1,
      three_year: null,
      five_year: null,
      ten_year: null,
      fifteen_year: null,
    });
  });

  it('uses the year before a missing five-year base, as the composite trend does', () => {
    const trend = trendFromHistory(20, { yr_2020: 18 });

    expect(trend?.five_year).toBe(2);
  });

  it('returns null when no base year has a value', () => {
    expect(trendFromHistory(17.6, { yr_2026: 17.6 })).toBeNull();
    expect(trendFromHistory(17.6, undefined)).toBeNull();
  });
});
