// ABOUTME: A horizontal track with dots placed along a fixed scale
// ABOUTME: Draws this school in highlighter yellow, compared schools in their series colours and the rest as benchmarks

import { cn } from '@/lib/utils';

export interface TrackDot {
  value: number;
  highlighted?: boolean;
  series?: number;
}

interface DotTrackProps {
  dots: TrackDot[];
  scale: [number, number];
  band?: { low: number; high: number };
  className?: string;
}

// Written out in full so Tailwind generates each class
const SERIES_FILLS = [
  'fill-series-1',
  'fill-series-2',
  'fill-series-3',
  'fill-series-4',
  'fill-series-5',
  'fill-series-6',
];

export function seriesFill(series: number): string {
  return SERIES_FILLS[(series - 1) % SERIES_FILLS.length];
}

export default function DotTrack({ dots, scale, band, className }: DotTrackProps) {
  const [lowest, highest] = scale;
  const position = (value: number) =>
    Math.min(Math.max(((value - lowest) / (highest - lowest)) * 100, 0), 100);
  const percent = (amount: number) => `${amount.toFixed(1)}%`;

  return (
    <svg aria-hidden="true" className={cn('h-5 w-full overflow-visible', className)}>
      {band && (
        <rect
          x={percent(position(band.low))}
          width={percent(position(band.high) - position(band.low))}
          y={0}
          height="100%"
          className="fill-muted"
        />
      )}
      <line x1="0" x2="100%" y1="50%" y2="50%" strokeWidth={1} className="stroke-border" />
      {dots.map((dot, index) =>
        dot.highlighted ? (
          <circle
            key={index}
            cx={percent(position(dot.value))}
            cy="50%"
            r={6.5}
            strokeWidth={1.5}
            className="fill-highlighter stroke-foreground"
          />
        ) : dot.series !== undefined ? (
          <circle
            key={index}
            cx={percent(position(dot.value))}
            cy="50%"
            r={6}
            strokeWidth={1.5}
            className={cn(seriesFill(dot.series), 'stroke-card')}
          />
        ) : (
          <circle
            key={index}
            cx={percent(position(dot.value))}
            cy="50%"
            r={5}
            className="fill-benchmark"
          />
        )
      )}
    </svg>
  );
}
