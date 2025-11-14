// ABOUTME: Presentational component for displaying historical yearly data
// ABOUTME: Shows 7 years of historical values for a metric in table format

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

  return (
    <div className="mt-2 text-sm">
      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Historical {metricLabel}</h4>
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
    </div>
  );
}
