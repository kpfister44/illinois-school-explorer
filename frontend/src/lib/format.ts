// ABOUTME: Display formatting for metric values and grade ranges
// ABOUTME: Counts get thousands separators; scores and percentages get one decimal place

export type MetricKind = 'count' | 'score' | 'percentage';

export function formatMetric(value: number, kind: MetricKind): string {
  switch (kind) {
    case 'count':
      return Math.round(value).toLocaleString('en-US');
    case 'score':
      return value.toFixed(1);
    case 'percentage':
      return `${value.toFixed(1)}%`;
  }
}

export function formatGrades(grades: string): string {
  return grades.replace(/\s*-\s*/, '–');
}
