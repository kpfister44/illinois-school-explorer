// ABOUTME: The categorical series colours as Tailwind classes, for fills and backgrounds
// ABOUTME: Series are numbered from 1; each class is written out in full so Tailwind generates it

const SERIES_FILLS = [
  'fill-series-1',
  'fill-series-2',
  'fill-series-3',
  'fill-series-4',
  'fill-series-5',
  'fill-series-6',
];

const SERIES_BACKGROUNDS = [
  'bg-series-1',
  'bg-series-2',
  'bg-series-3',
  'bg-series-4',
  'bg-series-5',
  'bg-series-6',
];

export const SERIES_COUNT = SERIES_FILLS.length;

export function seriesFill(series: number): string {
  return SERIES_FILLS[(series - 1) % SERIES_COUNT];
}

export function seriesBackground(series: number): string {
  return SERIES_BACKGROUNDS[(series - 1) % SERIES_COUNT];
}
