// ABOUTME: Presentational component for displaying historical yearly data
// ABOUTME: Shows 7 years of historical values for a metric in table format

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { HistoricalYearlyData } from '@/lib/api/types';

interface HistoricalDataTableProps {
  data: HistoricalYearlyData;
  metricType: 'score' | 'percentage' | 'count';
  metricLabel: string;
}

export default function HistoricalDataTable({
  data,
  metricType,
  metricLabel,
}: HistoricalDataTableProps) {
  const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019];

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (metricType) {
      case 'score':
        return value.toFixed(1);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const isACTMetric = metricLabel.includes('ACT');

  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">Historical {metricLabel}</h4>
        {isACTMetric && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>ACT scores for 2019-2024 are converted from SAT scores using the official ACT/SAT concordance tables</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <table className="w-full table-fixed">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-2 w-1/2">Year</th>
            <th className="text-left font-medium pb-2 w-1/2">Value</th>
          </tr>
        </thead>
        <tbody>
          {years.map((year) => {
            const key = `yr_${year}` as keyof HistoricalYearlyData;
            const value = data[key];

            return (
              <tr key={year} className="border-t border-border">
                <td className="py-2 w-1/2">{year}</td>
                <td className="py-2 w-1/2">{formatValue(value)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isACTMetric && (
        <p className="text-xs text-muted-foreground mt-2">
          *2019-2024 scores converted from SAT using ACT concordance tables
        </p>
      )}
    </div>
  );
}
