// ABOUTME: Rows of label, dot on a shared scale, and value, for comparing a figure with its yardsticks
// ABOUTME: Can shade the band where most schools fall and highlights this school's row

import { formatMetric, type MetricKind } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DotPlotRow {
  label: string;
  value: number;
  highlighted?: boolean;
}

interface DotPlotProps {
  label: string;
  rows: DotPlotRow[];
  kind: MetricKind;
  scale: [number, number];
  band?: { low: number; high: number };
}

export default function DotPlot({ label, rows, kind, scale, band }: DotPlotProps) {
  const [lowest, highest] = scale;
  const position = (value: number) =>
    Math.min(Math.max(((value - lowest) / (highest - lowest)) * 100, 0), 100);
  const percent = (amount: number) => `${amount.toFixed(1)}%`;

  return (
    <ul role="list" aria-label={label} className="space-y-1">
      {rows.map((row) => (
        <li
          key={row.label}
          className={cn(
            'grid grid-cols-[6.5rem_1fr_3.25rem] items-center gap-2 text-sm',
            row.highlighted && 'font-bold'
          )}
        >
          <span
            className={cn(
              'justify-self-start',
              row.highlighted && 'bg-highlighter px-1 text-highlighter-foreground'
            )}
          >
            {row.label}
          </span>
          <svg aria-hidden="true" className="h-5 w-full overflow-visible">
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
            {row.highlighted ? (
              <circle
                cx={percent(position(row.value))}
                cy="50%"
                r={6.5}
                strokeWidth={1.5}
                className="fill-highlighter stroke-foreground"
              />
            ) : (
              <circle cx={percent(position(row.value))} cy="50%" r={5} className="fill-benchmark" />
            )}
          </svg>
          <span className="text-right font-semibold tabular-nums">
            {formatMetric(row.value, kind)}
          </span>
        </li>
      ))}
    </ul>
  );
}
