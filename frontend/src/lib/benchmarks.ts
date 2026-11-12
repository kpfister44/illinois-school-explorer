// ABOUTME: Helpers for showing a school's benchmarks
// ABOUTME: Names the schools compared with, words a district comparison and builds the state average series

import type { Assessment, BenchmarkLevel, StateBenchmark } from '@/lib/api/types';
import { yearSeries, type YearValue } from '@/lib/history';

const LEVEL_SCHOOLS: Record<BenchmarkLevel, string> = {
  high: 'Illinois high schools',
  middle: 'Illinois middle schools',
  elementary: 'Illinois elementary schools',
  other: 'Illinois schools of other kinds',
};

// The range a dot plot covers for each test: ACT averages run from about 12 to 30
export const ASSESSMENT_SCALES: Record<Assessment, [number, number]> = {
  act: [10, 32],
  iar: [0, 100],
};

export type DistrictStanding = 'above' | 'below' | 'the same as';

export function describeLevel(level: BenchmarkLevel): string {
  return LEVEL_SCHOOLS[level];
}

// Compares at one decimal place, the precision both figures are shown at
export function districtStanding(value: number, districtAverage: number): DistrictStanding {
  const shown = Number(value.toFixed(1));
  const shownAverage = Number(districtAverage.toFixed(1));
  if (shown === shownAverage) {
    return 'the same as';
  }
  return shown > shownAverage ? 'above' : 'below';
}

export function stateSeries(state: StateBenchmark | undefined): YearValue[] {
  const averages = Object.fromEntries(
    (state?.years ?? []).map((point) => [`yr_${point.year}`, point.average])
  );
  return yearSeries(averages);
}
