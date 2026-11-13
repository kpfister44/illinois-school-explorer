// ABOUTME: Comparison of two to five schools, each school in one colour throughout
// ABOUTME: A key of the schools, then designation first; phones get a dot plot per metric, desktop a table with a dot track per row

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import DotPlot from '@/components/DotPlot';
import DotTrack from '@/components/DotTrack';
import Section from '@/components/Section';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SchoolDetail } from '@/lib/api/types';
import { ASSESSMENT_SCALES } from '@/lib/benchmarks';
import { formatGrades, formatMetric, type MetricKind } from '@/lib/format';
import { seriesBackground } from '@/lib/series';
import { cn } from '@/lib/utils';

interface ComparisonViewProps {
  schools: SchoolDetail[];
  onRemove: (rcdts: string) => void;
}

interface Metric {
  label: string;
  kind: MetricKind;
  value: (school: SchoolDetail) => number | null | undefined;
  isTestResult?: boolean;
}

interface MetricGroup {
  id: string;
  title: string;
  metrics: Metric[];
}

const NOT_REPORTED = 'Not reported';
const PERCENT_SCALE: [number, number] = [0, 100];
// Enrollment scales run to the largest school, rounded up to a step of this size
const ENROLLMENT_STEP = 500;

const GROUPS: MetricGroup[] = [
  {
    id: 'compare-scores',
    title: 'Test scores',
    metrics: [
      { label: 'ACT average', kind: 'score', value: (s) => s.metrics.act?.overall_avg, isTestResult: true },
      { label: 'ACT English language arts', kind: 'score', value: (s) => s.metrics.act?.ela_avg, isTestResult: true },
      { label: 'ACT math', kind: 'score', value: (s) => s.metrics.act?.math_avg, isTestResult: true },
      { label: 'ACT science', kind: 'score', value: (s) => s.metrics.act?.science_avg, isTestResult: true },
      { label: 'IAR proficiency, overall', kind: 'percentage', value: (s) => s.metrics.iar_overall_proficiency_pct, isTestResult: true },
      { label: 'IAR proficiency, English language arts', kind: 'percentage', value: (s) => s.metrics.iar_ela_proficiency_pct, isTestResult: true },
      { label: 'IAR proficiency, math', kind: 'percentage', value: (s) => s.metrics.iar_math_proficiency_pct, isTestResult: true },
    ],
  },
  {
    id: 'compare-students',
    title: 'Students',
    metrics: [
      { label: 'Enrollment', kind: 'count', value: (s) => s.metrics.enrollment },
      { label: 'Low income', kind: 'percentage', value: (s) => s.metrics.demographics.low_income_percentage },
      { label: 'English learners', kind: 'percentage', value: (s) => s.metrics.demographics.el_percentage },
      { label: 'White', kind: 'percentage', value: (s) => s.metrics.diversity.white },
      { label: 'Black', kind: 'percentage', value: (s) => s.metrics.diversity.black },
      { label: 'Hispanic', kind: 'percentage', value: (s) => s.metrics.diversity.hispanic },
      { label: 'Asian', kind: 'percentage', value: (s) => s.metrics.diversity.asian },
      { label: 'Pacific Islander', kind: 'percentage', value: (s) => s.metrics.diversity.pacific_islander },
      { label: 'Native American', kind: 'percentage', value: (s) => s.metrics.diversity.native_american },
      { label: 'Two or more races', kind: 'percentage', value: (s) => s.metrics.diversity.two_or_more },
      { label: 'Middle Eastern or North African', kind: 'percentage', value: (s) => s.metrics.diversity.mena },
    ],
  },
];

function valueOf(metric: Metric, school: SchoolDetail): number | null {
  return metric.value(school) ?? null;
}

function scaleFor(metric: Metric, schools: SchoolDetail[]): [number, number] {
  if (metric.kind === 'count') {
    const largest = Math.max(...schools.map((school) => valueOf(metric, school) ?? 0));
    return [0, Math.max(Math.ceil(largest / ENROLLMENT_STEP), 1) * ENROLLMENT_STEP];
  }
  return metric.kind === 'score' ? ASSESSMENT_SCALES.act : PERCENT_SCALE;
}

function designationOf(school: SchoolDetail): string {
  return school.designation ?? 'Not designated';
}

function Swatch({ series }: { series: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-3 w-3 flex-none rounded-full', seriesBackground(series))}
    />
  );
}

function SchoolKey({ schools, onRemove }: ComparisonViewProps) {
  return (
    <ul role="list" aria-label="Schools compared" className="space-y-1">
      {schools.map((school, index) => {
        const details = [
          school.city,
          school.grades_served && `Grades ${formatGrades(school.grades_served)}`,
        ].filter(Boolean);

        return (
          <li key={school.rcdts} className="flex items-center gap-3">
            <Swatch series={index + 1} />
            <div className="min-w-0 flex-1">
              <Link
                to={`/school/${school.rcdts}`}
                className="flex min-h-11 items-center font-medium text-link underline underline-offset-4"
              >
                {school.display_name}
              </Link>
              <p className="-mt-2 text-sm text-muted-foreground">{details.join(' · ')}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(school.rcdts)}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remove ${school.display_name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PlotsByMetric({ schools, groups }: { schools: SchoolDetail[]; groups: MetricGroup[] }) {
  return (
    <div className="space-y-8 lg:hidden">
      <Section id="compare-designation" title="State designation">
        <ul role="list" aria-label="State designation" className="space-y-1 text-sm">
          {schools.map((school, index) => (
            <li key={school.rcdts} className="flex items-center gap-2">
              <Swatch series={index + 1} />
              <span className="min-w-0 flex-1">{school.display_name}</span>
              <span className="font-semibold">{designationOf(school)}</span>
            </li>
          ))}
        </ul>
      </Section>

      {groups.map((group) => (
        <Section key={group.id} id={group.id} title={group.title}>
          {group.metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className="text-sm font-medium">{metric.label}</p>
              <DotPlot
                label={metric.label}
                rows={schools.map((school, index) => ({
                  label: school.display_name,
                  value: valueOf(metric, school),
                  series: index + 1,
                }))}
                kind={metric.kind}
                scale={scaleFor(metric, schools)}
                wideLabels
              />
            </div>
          ))}
        </Section>
      ))}
    </div>
  );
}

function ComparisonTable({ schools, groups }: { schools: SchoolDetail[]; groups: MetricGroup[] }) {
  const metrics = groups.flatMap((group) => group.metrics);

  return (
    <div className="hidden overflow-x-auto lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-52">
              <span className="sr-only">Measure</span>
            </TableHead>
            {schools.map((school, index) => (
              <TableHead key={school.rcdts} className="min-w-28 text-right align-bottom">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <Swatch series={index + 1} />
                  {school.display_name}
                </span>
              </TableHead>
            ))}
            <TableHead className="min-w-52 align-bottom">On one scale</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">State designation</TableCell>
            {schools.map((school) => (
              <TableCell key={school.rcdts} className="text-right">
                {designationOf(school)}
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
          {metrics.map((metric) => {
            const values = schools.map((school) => valueOf(metric, school));
            const reported = values.filter((value): value is number => value !== null);
            const highest = metric.isTestResult && reported.length >= 2 ? Math.max(...reported) : null;

            return (
              <TableRow key={metric.label}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                {values.map((value, index) => (
                  <TableCell key={schools[index].rcdts} className="text-right tabular-nums">
                    {value === null ? (
                      <span className="text-xs text-muted-foreground">{NOT_REPORTED}</span>
                    ) : (
                      <span className={cn(value === highest && 'font-bold')}>
                        {formatMetric(value, metric.kind)}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <DotTrack
                    dots={values.flatMap((value, index) =>
                      value === null ? [] : [{ value, series: index + 1 }]
                    )}
                    scale={scaleFor(metric, schools)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ComparisonView({ schools, onRemove }: ComparisonViewProps) {
  // Only metrics that at least one school reports
  const groups = GROUPS.map((group) => ({
    ...group,
    metrics: group.metrics.filter((metric) =>
      schools.some((school) => valueOf(metric, school) !== null)
    ),
  })).filter((group) => group.metrics.length > 0);

  return (
    <div className="space-y-8">
      <SchoolKey schools={schools} onRemove={onRemove} />
      <PlotsByMetric schools={schools} groups={groups} />
      <ComparisonTable schools={schools} groups={groups} />
    </div>
  );
}
