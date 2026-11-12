// ABOUTME: The current Report Card year and formatting for a change in a metric
// ABOUTME: Changes are shown signed, to one decimal place, with their unit

export const CURRENT_YEAR = 2026;

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
