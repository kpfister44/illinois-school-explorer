// ABOUTME: Tests for benchmark wording and series helpers
// ABOUTME: Verifies level names, district standing at display precision and the state average series

import { describe, it, expect } from 'vitest';
import { describeLevel, districtStanding, stateSeries } from './benchmarks';
import type { StateBenchmark } from '@/lib/api/types';

describe('describeLevel', () => {
  it('names the schools a figure is compared with', () => {
    expect(describeLevel('high')).toBe('Illinois high schools');
    expect(describeLevel('middle')).toBe('Illinois middle schools');
    expect(describeLevel('elementary')).toBe('Illinois elementary schools');
    expect(describeLevel('other')).toBe('Illinois schools of other kinds');
  });
});

describe('districtStanding', () => {
  it('says whether a value is above or below the district average', () => {
    expect(districtStanding(18.1, 20.47)).toBe('below');
    expect(districtStanding(23.9, 20.47)).toBe('above');
  });

  it('treats values that display the same as equal', () => {
    expect(districtStanding(20.5, 20.47)).toBe('the same as');
    expect(districtStanding(20.46, 20.54)).toBe('the same as');
  });
});

describe('stateSeries', () => {
  const state: StateBenchmark = {
    metric: 'act',
    level: 'high',
    schools: 684,
    band_low: 14.2,
    band_high: 20.7,
    years: [
      { year: 2010, average: 20.1, schools: 530 },
      { year: 2026, average: 17.55, schools: 684 },
    ],
  };

  it('covers every year from 2010 with gaps where the state has no average', () => {
    const series = stateSeries(state);

    expect(series).toHaveLength(17);
    expect(series[0]).toEqual({ year: 2010, value: 20.1 });
    expect(series[1]).toEqual({ year: 2011, value: null });
    expect(series[16]).toEqual({ year: 2026, value: 17.55 });
  });

  it('is empty of values before the state benchmark has loaded', () => {
    expect(stateSeries(undefined).every((point) => point.value === null)).toBe(true);
  });
});
