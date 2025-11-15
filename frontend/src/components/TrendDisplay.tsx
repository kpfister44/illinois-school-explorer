// ABOUTME: Expandable trend display component
// ABOUTME: Handles expand/collapse state and conditional rendering

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const hasTrendData = trendData !== null && trendData !== undefined;

  const handleToggle = () => {
    if (hasTrendData) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="mt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={!hasTrendData}
              className="h-8 px-2 text-xs"
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
          </TooltipTrigger>
          {!hasTrendData && (
            <TooltipContent>
              <p>Trend data unavailable</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {isExpanded && hasTrendData && (
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
