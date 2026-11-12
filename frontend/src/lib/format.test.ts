// ABOUTME: Tests for display formatting of metric values and grade ranges
// ABOUTME: Verifies counts, scores, percentages and grade spans

import { describe, it, expect } from 'vitest';
import { formatGrades, formatMetric } from './format';

describe('formatMetric', () => {
  it('formats counts with thousands separators', () => {
    expect(formatMetric(1721, 'count')).toBe('1,721');
  });

  it('formats scores to one decimal place', () => {
    expect(formatMetric(18, 'score')).toBe('18.0');
  });

  it('formats percentages to one decimal place with a percent sign', () => {
    expect(formatMetric(35.2, 'percentage')).toBe('35.2%');
  });
});

describe('formatGrades', () => {
  it('joins a grade span with an en dash', () => {
    expect(formatGrades('9 - 12')).toBe('9–12');
  });

  it('leaves a single grade unchanged', () => {
    expect(formatGrades('PK')).toBe('PK');
  });
});
