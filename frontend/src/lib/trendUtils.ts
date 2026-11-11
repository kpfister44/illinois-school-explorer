// ABOUTME: Utility functions for trend metric calculations and formatting
// ABOUTME: Handles percentage calculation, thresholds, and display formatting

import type { HistoricalYearlyData, TrendWindow } from '@/lib/api/types';

export const CURRENT_YEAR = 2026;

const ZERO_THRESHOLD = 0.05;
const THRESHOLDS = {
  count: 50,
  score: 10.0,
  percentage: 5.0,
};

export function getTrendArrow(delta: number): string {
  if (Math.abs(delta) < ZERO_THRESHOLD) {
    return '→';
  }
  return delta > 0 ? '↑' : '↓';
}

export function formatTrendValue(delta: number, unit: string): string {
  const roundedDelta = Math.round(delta * 10) / 10;
  if (roundedDelta === 0) {
    return `0 ${unit}`;
  }

  const magnitude = Number.isInteger(roundedDelta)
    ? Math.abs(roundedDelta).toString()
    : Math.abs(roundedDelta).toFixed(1);
  const prefix = roundedDelta > 0 ? '+' : '-';

  return `${prefix}${magnitude} ${unit}`;
}

export function formatPercentage(percent: number | null): string {
  if (percent === null) {
    return '—';
  }

  const rounded = Math.round(percent * 10) / 10;
  const formatted = rounded.toFixed(1);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

export function shouldShowPercentage(
  current: number,
  metricType: 'count' | 'score' | 'percentage'
): boolean {
  return current >= THRESHOLDS[metricType];
}

export function calculatePercentageChange(
  current: number,
  delta: number,
  metricType: 'count' | 'score' | 'percentage'
): number | null {
  if (!shouldShowPercentage(current, metricType)) {
    return null;
  }

  if (delta === 0) {
    return 0;
  }

  const historical = current - delta;
  if (historical <= 0) {
    return null;
  }

  return (delta / historical) * 100;
}

function changeSince(
  currentValue: number,
  history: HistoricalYearlyData,
  yearsBack: number
): number | null {
  const baseYear = CURRENT_YEAR - yearsBack;
  const baseValue =
    history[`yr_${baseYear}` as keyof HistoricalYearlyData] ??
    // The synced composite trend reads the year before a missing five-year base
    (yearsBack === 5 ? history[`yr_${baseYear - 1}` as keyof HistoricalYearlyData] : null);

  if (baseValue == null) {
    return null;
  }
  return Math.round((currentValue - baseValue) * 100) / 100;
}

export function trendFromHistory(
  currentValue: number,
  history: HistoricalYearlyData | undefined
): TrendWindow | null {
  if (!history) {
    return null;
  }

  const trend: TrendWindow = {
    one_year: changeSince(currentValue, history, 1),
    three_year: changeSince(currentValue, history, 3),
    five_year: changeSince(currentValue, history, 5),
    ten_year: changeSince(currentValue, history, 10),
    fifteen_year: changeSince(currentValue, history, 15),
  };

  return Object.values(trend).some((change) => change !== null) ? trend : null;
}
