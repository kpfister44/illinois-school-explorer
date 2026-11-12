// ABOUTME: Small inline trend line for a metric's history
// ABOUTME: Leaves gaps at missing years and highlights the latest year with a value

import { latestReported, reportedRuns, type ReportedYear, type YearValue } from '@/lib/history';
import { cn } from '@/lib/utils';

interface SparklineProps {
  series: YearValue[];
  className?: string;
}

const WIDTH = 120;
const HEIGHT = 34;
const INSET = 4;

export default function Sparkline({ series, className }: SparklineProps) {
  const runs = reportedRuns(series);
  const values = runs.flat().map((point) => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const firstYear = series[0]?.year ?? 0;
  const yearSpan = Math.max(series.length - 1, 1);

  const x = (point: ReportedYear) =>
    INSET + ((point.year - firstYear) / yearSpan) * (WIDTH - 2 * INSET);
  const y = (point: ReportedYear) =>
    highest === lowest
      ? HEIGHT / 2
      : HEIGHT - INSET - ((point.value - lowest) / (highest - lowest)) * (HEIGHT - 2 * INSET);

  const latest = latestReported(series);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className={cn('h-[34px] w-[120px] flex-none overflow-visible', className)}
    >
      {runs.map((run) =>
        run.length === 1 ? (
          <circle key={run[0].year} cx={x(run[0])} cy={y(run[0])} r={1.5} className="fill-foreground" />
        ) : (
          <polyline
            key={run[0].year}
            points={run.map((point) => `${x(point).toFixed(1)},${y(point).toFixed(1)}`).join(' ')}
            fill="none"
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-foreground"
          />
        )
      )}
      {latest && (
        <circle
          cx={x(latest)}
          cy={y(latest)}
          r={3.2}
          strokeWidth={1.2}
          className="fill-highlighter stroke-foreground"
        />
      )}
    </svg>
  );
}
