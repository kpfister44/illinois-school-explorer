// ABOUTME: Presentational component for displaying trend data
// ABOUTME: Shows 1/3/5-year windows with absolute changes

import type { TrendWindow } from '@/lib/api/types';
import {
  getTrendArrow,
  formatTrendValue,
} from '@/lib/trendUtils';

interface TrendTableProps {
  currentValue: number;
  trendData: TrendWindow;
  metricType: 'count' | 'score' | 'percentage';
  unit: string;
  metricLabel: string;
}

interface TrendRow {
  label: string;
  delta: number | null;
}

export default function TrendTable({ trendData, unit, metricLabel }: Omit<TrendTableProps, 'currentValue' | 'metricType'>) {
  const rows: TrendRow[] = [
    { label: '1 Year', delta: trendData.one_year },
    { label: '3 Year', delta: trendData.three_year },
    { label: '5 Year', delta: trendData.five_year },
  ];

  return (
    <div className="mt-2 text-sm">
      <h4 className="text-sm font-medium mb-2 text-muted-foreground">{metricLabel} Trends</h4>
      <table className="w-full table-fixed">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-2 w-1/2">Period</th>
            <th className="text-left font-medium pb-2 w-1/2">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.delta === null) {
              return (
                <tr key={row.label} className="border-t border-border">
                  <td className="py-2 w-1/2">{row.label}</td>
                  <td className="py-2 w-1/2 text-muted-foreground">N/A</td>
                </tr>
              );
            }

            const arrow = getTrendArrow(row.delta);
            const changeText = formatTrendValue(row.delta, unit);

            return (
              <tr key={row.label} className="border-t border-border">
                <td className="py-2 w-1/2">{row.label}</td>
                <td className="py-2 w-1/2">
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden="true">{arrow}</span>
                    <span>{changeText}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
