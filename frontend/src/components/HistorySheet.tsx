// ABOUTME: Bottom sheet with a metric's full history: the line chart and a year-by-year table
// ABOUTME: Opens from whatever control is passed as its child

import type { ReactNode } from 'react';
import HistoryChart from '@/components/HistoryChart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatMetric, type MetricKind } from '@/lib/format';
import { FIRST_YEAR, SAT_YEARS, isSatYear, type YearValue } from '@/lib/history';
import { CURRENT_YEAR } from '@/lib/trendUtils';

interface HistorySheetProps {
  title: string;
  series: YearValue[];
  kind: MetricKind;
  satYears?: boolean;
  chart?: boolean;
  children: ReactNode;
}

export default function HistorySheet({
  title,
  series,
  kind,
  satYears = false,
  chart = true,
  children,
}: HistorySheetProps) {
  const newestFirst = [...series].reverse();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <div className="mx-auto max-w-xl space-y-4">
          <SheetHeader className="pr-10 text-left">
            <SheetTitle className="font-display text-2xl font-medium">{title}</SheetTitle>
            <SheetDescription>
              {FIRST_YEAR} to {CURRENT_YEAR}, as published by ISBE.
              {satYears &&
                ` From ${SAT_YEARS.first} to ${SAT_YEARS.last} Illinois gave the SAT, converted here to the ACT scale.`}
            </SheetDescription>
          </SheetHeader>

          {chart && <HistoryChart label={title} series={series} kind={kind} satYears={satYears} />}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-left text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Year
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {title}
                </th>
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((point) => (
                <tr key={point.year} className="border-b border-border">
                  <td className="py-2">
                    {point.year}
                    {satYears && point.value !== null && isSatYear(point.year) && (
                      <span className="ml-2 text-xs text-muted-foreground">SAT, converted</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {point.value === null ? (
                      <span className="text-muted-foreground">No data</span>
                    ) : (
                      <span className="font-semibold">{formatMetric(point.value, kind)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
