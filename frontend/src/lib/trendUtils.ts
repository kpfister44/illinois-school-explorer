// ABOUTME: Utility functions for trend metric calculations and formatting
// ABOUTME: Handles percentage calculation, thresholds, and display formatting

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
