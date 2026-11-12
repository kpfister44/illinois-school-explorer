// ABOUTME: Tests for year-by-year history helpers
// ABOUTME: Verifies series ordering, gaps, first and latest reported years, and change wording

import { describe, it, expect } from 'vitest';
import {
  describeChange,
  firstReported,
  latestReported,
  percentChange,
  reportedRuns,
  yearSeries,
} from './history';

describe('yearSeries', () => {
  it('lists every year from 2010 to 2026 in order', () => {
    const series = yearSeries({ yr_2026: 18.1, yr_2010: 22.5 });

    expect(series).toHaveLength(17);
    expect(series[0]).toEqual({ year: 2010, value: 22.5 });
    expect(series[16]).toEqual({ year: 2026, value: 18.1 });
  });

  it('marks years without a value as null', () => {
    const series = yearSeries({ yr_2026: 18.1, yr_2020: null });

    expect(series.find((point) => point.year === 2020)?.value).toBeNull();
    expect(series.find((point) => point.year === 2015)?.value).toBeNull();
  });

  it('returns every year as null when there is no history', () => {
    const series = yearSeries(undefined);

    expect(series).toHaveLength(17);
    expect(series.every((point) => point.value === null)).toBe(true);
  });
});

describe('firstReported and latestReported', () => {
  it('skip years without a value', () => {
    const series = yearSeries({ yr_2012: 400, yr_2019: 380, yr_2025: 350 });

    expect(firstReported(series)).toEqual({ year: 2012, value: 400 });
    expect(latestReported(series)).toEqual({ year: 2025, value: 350 });
  });

  it('return null when no year has a value', () => {
    const series = yearSeries({});

    expect(firstReported(series)).toBeNull();
    expect(latestReported(series)).toBeNull();
  });
});

describe('reportedRuns', () => {
  it('splits the series at missing years', () => {
    const series = yearSeries({ yr_2016: 21.3, yr_2017: 21.4, yr_2019: 19.6, yr_2021: 18.6, yr_2022: 17.9 });

    const runs = reportedRuns(series);

    expect(runs.map((run) => run.map((point) => point.year))).toEqual([
      [2016, 2017],
      [2019],
      [2021, 2022],
    ]);
  });
});

describe('describeChange', () => {
  it('describes a rise', () => {
    expect(describeChange(3.14, ' points', 2025)).toBe('Up 3.1 points since 2025');
  });

  it('describes a fall', () => {
    expect(describeChange(-16, '%', 2010)).toBe('Down 16% since 2010');
  });

  it('describes a change that rounds to zero', () => {
    expect(describeChange(0.04, ' points', 2025)).toBe('Unchanged since 2025');
  });
});

describe('percentChange', () => {
  it('gives the whole-number percent change from the earlier value', () => {
    expect(percentChange(2044, 1721)).toBe(-16);
  });

  it('returns null when the earlier value is zero', () => {
    expect(percentChange(0, 20)).toBeNull();
  });
});
