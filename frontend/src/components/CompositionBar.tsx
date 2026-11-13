// ABOUTME: One stacked bar showing how a whole divides into groups, with a legend
// ABOUTME: Lists every group that has data, largest first, plus any share that is not reported

import { formatMetric } from '@/lib/format';
import { SERIES_COUNT, seriesBackground } from '@/lib/series';
import { cn } from '@/lib/utils';

interface Group {
  label: string;
  value: number | null;
}

interface CompositionBarProps {
  label: string;
  groups: Group[];
}

interface Segment {
  label: string;
  value: number;
  colour: string;
}

const NOT_REPORTED_COLOUR = 'bg-muted';

// Published shares are rounded, so a whole can fall a little short of 100
const ROUNDING_ALLOWANCE = 0.5;

export default function CompositionBar({ label, groups }: CompositionBarProps) {
  const segments: Segment[] = groups
    .filter((group): group is { label: string; value: number } => group.value !== null)
    .sort((a, b) => b.value - a.value)
    .map((group, index) => ({
      ...group,
      colour: seriesBackground(Math.min(index + 1, SERIES_COUNT)),
    }));

  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground">Not reported</p>;
  }

  const description = segments
    .map((segment) => `${segment.label} ${formatMetric(segment.value, 'percentage')}`)
    .join(', ');

  const notReported = 100 - segments.reduce((total, segment) => total + segment.value, 0);
  if (notReported >= ROUNDING_ALLOWANCE) {
    segments.push({ label: 'Not reported', value: notReported, colour: NOT_REPORTED_COLOUR });
  }

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={`${label}: ${description}`}
        className="flex h-5 gap-px overflow-hidden rounded-sm"
      >
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={cn('basis-0', segment.colour)}
            style={{ flexGrow: segment.value }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm min-[400px]:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-baseline gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 flex-none rounded-full',
                segment.colour,
                segment.colour === NOT_REPORTED_COLOUR && 'border border-benchmark'
              )}
            />
            <span className="min-w-0 flex-1">{segment.label}</span>
            <span className="font-semibold tabular-nums">
              {formatMetric(segment.value, 'percentage')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
