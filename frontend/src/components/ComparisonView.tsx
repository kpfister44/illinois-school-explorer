// ABOUTME: Side-by-side comparison table for schools
// ABOUTME: Displays metrics with color coding for best and worst values

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SchoolDetail } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ComparisonViewProps {
  schools: SchoolDetail[];
}

interface MetricRow {
  label: string;
  getValue: (school: SchoolDetail) => number | null;
  format: (value: number | null) => string;
  higherIsBetter: boolean;
}

const metrics: MetricRow[] = [
  {
    label: 'Enrollment',
    getValue: (s) => s.metrics.enrollment,
    format: (v) => (v === null ? 'N/A' : v.toLocaleString()),
    higherIsBetter: false,
  },
  {
    label: 'ACT ELA Average',
    getValue: (s) => s.metrics.act?.ela_avg ?? null,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Math Average',
    getValue: (s) => s.metrics.act?.math_avg ?? null,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Science Average',
    getValue: (s) => s.metrics.act?.science_avg ?? null,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'IAR Overall Proficiency %',
    getValue: (s) => s.metrics.iar_overall_proficiency_pct,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'IAR ELA Proficiency %',
    getValue: (s) => s.metrics.iar_ela_proficiency_pct,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'IAR Math Proficiency %',
    getValue: (s) => s.metrics.iar_math_proficiency_pct,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'English Learner %',
    getValue: (s) => s.metrics.demographics.el_percentage,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Low Income %',
    getValue: (s) => s.metrics.demographics.low_income_percentage,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'White %',
    getValue: (s) => s.metrics.diversity.white,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Black %',
    getValue: (s) => s.metrics.diversity.black,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Hispanic %',
    getValue: (s) => s.metrics.diversity.hispanic,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Asian %',
    getValue: (s) => s.metrics.diversity.asian,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
];

function getColorClass(
  value: number | null,
  values: (number | null)[],
  higherIsBetter: boolean
): string {
  if (value === null) return '';

  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length < 2) return '';

  const max = Math.max(...validValues);
  const min = Math.min(...validValues);

  if (higherIsBetter) {
    return value === max ? 'bg-green-100 dark:bg-green-900' : '';
  }

  return value === min ? 'bg-green-100 dark:bg-green-900' : '';
}

export default function ComparisonView({ schools }: ComparisonViewProps) {
  if (schools.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schools to compare</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48 font-bold">Metric</TableHead>
            {schools.map((school) => (
              <TableHead key={school.rcdts} className="min-w-[200px]">
                <div>
                  <div className="font-bold">{school.school_name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {school.city}
                  </div>
                  {school.school_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {school.school_type}
                    </Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => {
            const values = schools.map((s) => metric.getValue(s));

            return (
              <TableRow key={metric.label}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                {schools.map((school) => {
                  const value = metric.getValue(school);
                  const colorClass = getColorClass(value, values, metric.higherIsBetter);

                  return (
                    <TableCell
                      key={school.rcdts}
                      className={cn('text-center', colorClass)}
                    >
                      {metric.format(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
