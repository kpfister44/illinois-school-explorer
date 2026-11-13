// ABOUTME: A horizontal track with dots placed along a fixed scale
// ABOUTME: Draws this school in highlighter yellow, compared schools in their series colours and the rest as benchmarks

import { seriesFill } from '@/lib/series';
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
