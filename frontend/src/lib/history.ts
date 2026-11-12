// ABOUTME: Helpers for a metric's year-by-year history
// ABOUTME: Builds an ordered series with gaps for missing years and words a change between two years

import type { HistoricalYearlyData } from '@/lib/api/types';
import { CURRENT_YEAR } from '@/lib/trendUtils';

export const FIRST_YEAR = 2010;

// Illinois gave the SAT in these years; ISBE's scores are converted to the ACT scale
export const SAT_YEARS = { first: 2019, last: 2024 };

export interface YearValue {
  year: number;
  value: number | null;
}

export interface ReportedYear {
  year: number;
  value: number;
}

function isReported(point: YearValue): point is ReportedYear {
  return point.value !== null;
}

export function yearSeries(history: HistoricalYearlyData | undefined): YearValue[] {
  const series: YearValue[] = [];
  for (let year = FIRST_YEAR; year <= CURRENT_YEAR; year++) {
    series.push({ year, value: history?.[`yr_${year}` as keyof HistoricalYearlyData] ?? null });
  }
  return series;
}

export function firstReported(series: YearValue[]): ReportedYear | null {
  return series.find(isReported) ?? null;
}

export function latestReported(series: YearValue[]): ReportedYear | null {
  return series.filter(isReported).at(-1) ?? null;
}

export function isSatYear(year: number): boolean {
  return year >= SAT_YEARS.first && year <= SAT_YEARS.last;
}

export function reportedRuns(series: YearValue[]): ReportedYear[][] {
  const runs: ReportedYear[][] = [];
  let run: ReportedYear[] = [];

  for (const point of series) {
    if (isReported(point)) {
      run.push(point);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) {
    runs.push(run);
  }
  return runs;
}

export function describeChange(delta: number, unit: string, sinceYear: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) {
    return `Unchanged since ${sinceYear}`;
  }

  const magnitude = Number.isInteger(rounded)
    ? Math.abs(rounded).toString()
    : Math.abs(rounded).toFixed(1);
  return `${rounded > 0 ? 'Up' : 'Down'} ${magnitude}${unit} since ${sinceYear}`;
}

export function percentChange(earlier: number, later: number): number | null {
  if (earlier === 0) {
    return null;
  }
  return Math.round(((later - earlier) / earlier) * 100);
}
