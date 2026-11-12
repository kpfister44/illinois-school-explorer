// ABOUTME: Sparkline that opens the metric's full chart and year table in a bottom sheet
// ABOUTME: Renders nothing when fewer than two years have a value

import { ChevronRight } from 'lucide-react';
import HistorySheet from '@/components/HistorySheet';
import Sparkline from '@/components/Sparkline';
import type { MetricKind } from '@/lib/format';
import type { YearValue } from '@/lib/history';

interface HistorySparklineProps {
  label: string;
  series: YearValue[];
  kind: MetricKind;
}

export default function HistorySparkline({ label, series, kind }: HistorySparklineProps) {
  const reportedYears = series.filter((point) => point.value !== null).length;
  if (reportedYears < 2) {
    return null;
  }

  return (
    <HistorySheet title={label} series={series} kind={kind}>
      <button
        type="button"
        aria-label={`${label} history`}
        className="flex min-h-11 flex-none items-center gap-1 rounded-md py-1 pl-2 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkline series={series} />
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </HistorySheet>
  );
}
