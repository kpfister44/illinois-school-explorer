// ABOUTME: Rows of label, dot on a shared scale, and value, for comparing a figure with its yardsticks
// ABOUTME: Can shade the band where most schools fall, highlights this school's row, colours rows by series and links a row to its page

import { Link } from 'react-router-dom';
import DotTrack from '@/components/DotTrack';
import { formatMetric, type MetricKind } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DotPlotRow {
  label: string;
  value: number | null;
  highlighted?: boolean;
  series?: number;
  to?: string;
}

interface DotPlotProps {
  label: string;
  rows: DotPlotRow[];
  kind: MetricKind;
  scale: [number, number];
  band?: { low: number; high: number };
  wideLabels?: boolean;
}

export default function DotPlot({ label, rows, kind, scale, band, wideLabels }: DotPlotProps) {
  return (
    <ul role="list" aria-label={label} className="space-y-1">
      {rows.map((row) => (
        <li
          key={row.label}
          className={cn(
            'grid items-center gap-2 text-sm',
            wideLabels
              ? 'grid-cols-[9.5rem_1fr_3.25rem] sm:grid-cols-[16rem_1fr_3.25rem]'
              : 'grid-cols-[6.5rem_1fr_3.25rem]',
            row.highlighted && 'font-bold'
          )}
        >
          {row.to ? (
            <Link
              to={row.to}
              className="flex min-h-11 items-center font-medium text-link underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {row.label}
            </Link>
          ) : (
            <span
              className={cn(
                'justify-self-start',
                row.highlighted && 'bg-highlighter px-1 text-highlighter-foreground'
              )}
            >
              {row.label}
            </span>
          )}
          <DotTrack
            dots={
              row.value === null
                ? []
                : [{ value: row.value, highlighted: row.highlighted, series: row.series }]
            }
            scale={scale}
            band={band}
          />
          {row.value === null ? (
            <span className="text-right text-xs text-muted-foreground">Not reported</span>
          ) : (
            <span className="text-right font-semibold tabular-nums">
              {formatMetric(row.value, kind)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
