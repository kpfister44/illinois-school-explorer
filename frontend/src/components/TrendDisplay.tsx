// ABOUTME: Expandable trend display component
// ABOUTME: Handles expand/collapse state, and says so when a metric has no trend

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrendTable from './TrendTable';
import HistoricalDataTable from './HistoricalDataTable';
import type { TrendWindow, HistoricalYearlyData } from '@/lib/api/types';

interface TrendDisplayProps {
  label: string;
  currentValue: number;
  trendData: TrendWindow | null | undefined;
  historicalData?: HistoricalYearlyData;
  metricType: 'count' | 'score' | 'percentage';
  unit: string;
}

export default function TrendDisplay({
  label,
  currentValue,
  trendData,
  historicalData,
  metricType,
  unit,
}: TrendDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (trendData === null || trendData === undefined) {
    return <p className="mt-2 text-xs text-muted-foreground">Trend data unavailable</p>;
  }

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-2 text-xs"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="mr-1 h-3 w-3" aria-hidden="true" />
            Hide trends
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-3 w-3" aria-hidden="true" />
            Show trends
          </>
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-4">
          {historicalData && (
            <HistoricalDataTable
              data={historicalData}
              metricType={metricType}
              metricLabel={label}
            />
          )}
          <TrendTable
            currentValue={currentValue}
            trendData={trendData}
            metricType={metricType}
            unit={unit}
            metricLabel={label}
          />
        </div>
      )}
    </div>
  );
}
