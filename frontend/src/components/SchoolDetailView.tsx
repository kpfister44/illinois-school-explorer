// ABOUTME: SchoolDetailView component for detailed school display
// ABOUTME: One scroll: facts, state designation, test scores with their yardsticks, history, students and enrollment

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import BackButton from '@/components/BackButton';
import CompositionBar from '@/components/CompositionBar';
import DesignationScale from '@/components/DesignationScale';
import DotPlot, { type DotPlotRow } from '@/components/DotPlot';
import Facts from '@/components/Facts';
import HistoryChart from '@/components/HistoryChart';
import HistorySheet from '@/components/HistorySheet';
import HistorySparkline from '@/components/HistorySparkline';
import Section from '@/components/Section';
import SectionLinks from '@/components/SectionLinks';
import SimilarSchoolsSheet from '@/components/SimilarSchoolsSheet';
import { useStateBenchmark } from '@/lib/api/queries';
import {
  ASSESSMENT_SCALES,
  describeLevel,
  districtStanding,
  stateSeries,
} from '@/lib/benchmarks';
import { formatGrades, formatMetric, type MetricKind } from '@/lib/format';
import {
  describeChange,
  firstReported,
  latestReported,
  percentChange,
  yearSeries,
  type YearValue,
} from '@/lib/history';
import { districtId, listPath } from '@/lib/schoolList';
import { CURRENT_YEAR, formatTrendValue } from '@/lib/trendUtils';
import type {
  Assessment,
  HistoricalYearlyData,
  MetricBenchmark,
  SchoolDetail,
  SchoolMetrics,
} from '@/lib/api/types';

interface SchoolDetailViewProps {
  school: SchoolDetail;
}

const PREVIOUS_YEAR = CURRENT_YEAR - 1;
const NOT_REPORTED = 'Not reported';

const SECTIONS = [
  { id: 'scores', label: 'Scores' },
  { id: 'over-time', label: 'Over time' },
  { id: 'students', label: 'Students' },
  { id: 'enrollment', label: 'Enrollment' },
];

const IAR_SUBJECTS = [
  { label: 'Overall', history: 'iar', current: 'iar_overall_proficiency_pct' },
  { label: 'English language arts', history: 'iar_ela', current: 'iar_ela_proficiency_pct' },
  { label: 'Math', history: 'iar_math', current: 'iar_math_proficiency_pct' },
] as const;

function formatOrNotReported(value: number | null | undefined, kind: MetricKind): string {
  return value == null ? NOT_REPORTED : formatMetric(value, kind);
}

function Headline({ value, caption }: { value: string; caption: string }) {
  return (
    <p>
      <span className="block text-5xl font-bold leading-none tracking-tight">{value}</span>{' '}
      <span className="mt-1 block text-sm font-medium text-muted-foreground">{caption}</span>
    </p>
  );
}

function Measure({
  label,
  value,
  detail,
  series,
  kind,
}: {
  label: string;
  value: string;
  detail?: string;
  series: YearValue[];
  kind: MetricKind;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
      <HistorySparkline label={label} series={series} kind={kind} />
    </div>
  );
}

function StudentShare({
  label,
  value,
  history,
  benchmark,
}: {
  label: string;
  value: number | null;
  history: HistoricalYearlyData | undefined;
  benchmark: MetricBenchmark | null | undefined;
}) {
  const stateFigure = benchmark
    ? `${describeLevel(benchmark.level)}: ${formatMetric(benchmark.state_average, 'percentage')}`
    : undefined;

  return (
    <Measure
      label={label}
      value={formatOrNotReported(value, 'percentage')}
      detail={value === null ? 'ISBE withholds small counts to protect privacy.' : stateFigure}
      series={yearSeries(history)}
      kind="percentage"
    />
  );
}

const ASSESSMENT_DISPLAY: Record<Assessment, { name: string; kind: MetricKind }> = {
  act: { name: 'Average ACT', kind: 'score' },
  iar: { name: 'IAR proficiency', kind: 'percentage' },
};

function Yardsticks({
  rcdts,
  assessment,
  value,
  benchmark,
}: {
  rcdts: string;
  assessment: Assessment;
  value: number;
  benchmark: MetricBenchmark;
}) {
  const { data: state } = useStateBenchmark(assessment, benchmark.level);
  const { name, kind } = ASSESSMENT_DISPLAY[assessment];
  const comparedWith = describeLevel(benchmark.level);
  const hasSimilarSchools = benchmark.similar_average !== null;

  const rows: DotPlotRow[] = [
    { label: 'This school', value, highlighted: true },
    { label: 'Illinois', value: benchmark.state_average },
  ];
  if (benchmark.district_average !== null) {
    rows.push({ label: 'District', value: benchmark.district_average });
  }
  if (benchmark.similar_average !== null) {
    rows.push({ label: 'Similar schools', value: benchmark.similar_average });
  }

  const band =
    state && state.band_low !== null && state.band_high !== null
      ? { low: state.band_low, high: state.band_high }
      : undefined;

  return (
    <div className="space-y-3">
      {benchmark.percentile !== null && (
        <p>
          Higher than <strong>{benchmark.percentile}%</strong> of {comparedWith}
          {benchmark.district_average !== null &&
            `, and ${districtStanding(value, benchmark.district_average)} the average for its district`}
          .
        </p>
      )}
      <DotPlot
        label={`${name} compared`}
        rows={rows}
        kind={kind}
        scale={ASSESSMENT_SCALES[assessment]}
        band={band}
      />
      {(band || hasSimilarSchools) && (
        <p className="text-sm text-muted-foreground">
          {band &&
            `Shaded band: where most ${comparedWith} fall, ${formatMetric(band.low, kind)} to ${formatMetric(band.high, kind)}. `}
          {hasSimilarSchools &&
            'Similar schools: the 25 most alike in family income, English learners and size.'}
        </p>
      )}
      {hasSimilarSchools && (
        <SimilarSchoolsSheet rcdts={rcdts} assessment={assessment} level={benchmark.level}>
          <Button variant="outline" className="w-full sm:w-auto">
            See similar schools
          </Button>
        </SimilarSchoolsSheet>
      )}
    </div>
  );
}

function TestScores({ school }: { school: SchoolDetail }) {
  const { metrics, benchmarks } = school;
  const actAverage = metrics.act?.overall_avg ?? null;
  const iarProficiency = metrics.iar_overall_proficiency_pct;

  if (actAverage === null && iarProficiency === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No {CURRENT_YEAR} test scores are published for this school. ISBE withholds results for
        small groups, and some grades are not tested.
      </p>
    );
  }

  return (
    <>
      {actAverage !== null && (
        <div className="space-y-2">
          <Headline value={formatMetric(actAverage, 'score')} caption="average ACT, out of 36" />
          {benchmarks?.act && (
            <Yardsticks
              rcdts={school.rcdts}
              assessment="act"
              value={actAverage}
              benchmark={benchmarks.act}
            />
          )}
          <p className="text-sm text-muted-foreground">
            The average of the English and math scores in grade 11.
          </p>
        </div>
      )}
      {iarProficiency !== null && (
        <div className="space-y-2">
          <Headline
            value={formatMetric(iarProficiency, 'percentage')}
            caption="of students proficient on the IAR"
          />
          {benchmarks?.iar && (
            <Yardsticks
              rcdts={school.rcdts}
              assessment="iar"
              value={iarProficiency}
              benchmark={benchmarks.iar}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Illinois Assessment of Readiness, English language arts and math averaged.
          </p>
        </div>
      )}
      <Link
        to="/how-this-works"
        className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4"
      >
        How this works
      </Link>
    </>
  );
}

function ActOverTime({ metrics }: { metrics: SchoolMetrics }) {
  const series = yearSeries(metrics.historical?.act);
  const { data: state } = useStateBenchmark('act', 'high');
  const subjects = [
    { label: 'English', value: metrics.act?.ela_avg },
    { label: 'Math', value: metrics.act?.math_avg },
    { label: 'Science', value: metrics.act?.science_avg },
  ];

  return (
    <div className="space-y-3">
      <HistoryChart
        label="Average ACT"
        series={series}
        kind="score"
        satYears
        benchmark={{ label: 'Illinois high school average', series: stateSeries(state) }}
      />
      <p className="text-sm text-muted-foreground">
        From 2019 to 2024 Illinois gave the SAT, converted here to the ACT scale. A break in the
        line is a year with no published score.
      </p>
      <HistorySheet title="Average ACT" series={series} kind="score" satYears chart={false}>
        <Button variant="outline" className="w-full sm:w-auto">
          See every year
        </Button>
      </HistorySheet>
      {subjects.some((subject) => subject.value != null) && (
        <Facts
          label="ACT subject scores"
          facts={subjects.map((subject) => ({
            label: subject.label,
            value: formatOrNotReported(subject.value, 'score'),
          }))}
        />
      )}
    </div>
  );
}

function IarOverTime({ metrics }: { metrics: SchoolMetrics }) {
  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-foreground text-muted-foreground">
            <th scope="col" className="py-2 text-left font-medium">
              <span className="sr-only">Subject</span>
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {PREVIOUS_YEAR}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {CURRENT_YEAR}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {IAR_SUBJECTS.map((subject) => {
            const previous = metrics.historical?.[subject.history]?.[`yr_${PREVIOUS_YEAR}`];
            const current = metrics[subject.current];
            const change = metrics.trends?.[subject.history]?.one_year;

            return (
              <tr key={subject.label} className="border-b border-border">
                <th scope="row" className="py-2 pr-2 text-left font-medium">
                  {subject.label}
                </th>
                {[previous, current].map((value, index) => (
                  <td key={index} className="py-2 pl-3 text-right">
                    {value == null ? (
                      <span className="text-muted-foreground">No data</span>
                    ) : (
                      formatMetric(value, 'percentage')
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap py-2 pl-3 text-right">
                  {change == null ? (
                    <span className="text-muted-foreground">No data</span>
                  ) : (
                    <span className="font-semibold">{formatTrendValue(change, 'pts')}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-muted-foreground">
        Share of students proficient. IAR scoring changed in {PREVIOUS_YEAR}, so earlier years
        cannot be compared.
      </p>
    </div>
  );
}

function OverTime({ metrics }: { metrics: SchoolMetrics }) {
  const hasAct =
    metrics.act?.overall_avg != null || latestReported(yearSeries(metrics.historical?.act)) !== null;
  const hasIar = metrics.iar_overall_proficiency_pct !== null;

  if (!hasAct && !hasIar) {
    return (
      <p className="text-sm text-muted-foreground">
        No test score history is published for this school.
      </p>
    );
  }

  return (
    <>
      {hasAct && hasIar && <h3 className="font-semibold">ACT</h3>}
      {hasAct && <ActOverTime metrics={metrics} />}
      {hasAct && hasIar && <h3 className="font-semibold">IAR</h3>}
      {hasIar && <IarOverTime metrics={metrics} />}
    </>
  );
}

function Enrollment({ metrics }: { metrics: SchoolMetrics }) {
  const series = yearSeries(metrics.historical?.enrollment);
  const first = firstReported(series);
  const change =
    metrics.enrollment !== null && first && first.year < CURRENT_YEAR
      ? percentChange(first.value, metrics.enrollment)
      : null;

  return (
    <Measure
      label="Enrollment"
      value={formatOrNotReported(metrics.enrollment, 'count')}
      detail={change !== null && first ? describeChange(change, '%', first.year) : undefined}
      series={series}
      kind="count"
    />
  );
}

export default function SchoolDetailView({ school }: SchoolDetailViewProps) {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useComparison();
  const inComparison = isInComparison(school.rcdts);
  const { metrics } = school;
  const { diversity } = metrics;

  const handleComparisonToggle = () => {
    if (inComparison) {
      removeFromComparison(school.rcdts);
    } else {
      addToComparison(school.rcdts);
    }
  };

  const placeLinkClass = 'text-link underline underline-offset-4';
  const location = [
    <Link key="city" to={listPath({ city: school.city })} className={placeLinkClass}>
      {school.city}
    </Link>,
    school.district && (
      <Link key="district" to={`/district/${districtId(school.rcdts)}`} className={placeLinkClass}>
        {school.district}
      </Link>
    ),
    school.county && `${school.county} County`,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <BackButton />
      <SectionLinks sections={SECTIONS} />

      <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-12">
        <div className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-medium leading-tight lg:text-4xl">{school.display_name}</h1>
            <p data-testid="school-location" className="text-muted-foreground">
              {location.map((part, index) => (
                <Fragment key={index}>
                  {index > 0 && ' · '}
                  {part}
                </Fragment>
              ))}
            </p>
            {school.display_name !== school.school_name && (
              <p className="text-sm text-muted-foreground">Official name: {school.school_name}</p>
            )}
          </header>

          <Facts
            label="Key facts"
            facts={[
              {
                label: 'Grades',
                value: school.grades_served ? formatGrades(school.grades_served) : NOT_REPORTED,
              },
              { label: 'Students', value: formatOrNotReported(metrics.enrollment, 'count') },
              {
                label: 'Low income',
                value: formatOrNotReported(metrics.demographics.low_income_percentage, 'percentage'),
              },
            ]}
          />

          <DesignationScale designation={school.designation} rcdts={school.rcdts} />

          <Button
            onClick={handleComparisonToggle}
            variant={inComparison ? 'outline' : 'default'}
            disabled={!inComparison && !canAddMore}
            className="w-full sm:w-auto"
          >
            {inComparison ? (
              <>
                <Minus className="mr-2 h-4 w-4" />
                Remove from Compare
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to Compare
              </>
            )}
          </Button>

          <Section id="scores" title={`Test scores · ${CURRENT_YEAR}`}>
            <TestScores school={school} />
          </Section>
        </div>

        <Section id="over-time" title="Over time">
          <OverTime metrics={metrics} />
        </Section>
      </div>

      <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-12">
        <Section id="students" title="Students">
          <StudentShare
            label="English learners"
            value={metrics.demographics.el_percentage}
            history={metrics.historical?.el}
            benchmark={school.benchmarks?.el}
          />
          <StudentShare
            label="Low income"
            value={metrics.demographics.low_income_percentage}
            history={metrics.historical?.low_income}
            benchmark={school.benchmarks?.low_income}
          />
          <h3 className="pt-2 text-sm text-muted-foreground">Race and ethnicity</h3>
          <CompositionBar
            label="Race and ethnicity"
            groups={[
              { label: 'White', value: diversity.white },
              { label: 'Black', value: diversity.black },
              { label: 'Hispanic', value: diversity.hispanic },
              { label: 'Asian', value: diversity.asian },
              { label: 'Pacific Islander', value: diversity.pacific_islander },
              { label: 'Native American', value: diversity.native_american },
              { label: 'Two or more races', value: diversity.two_or_more },
              { label: 'Middle Eastern or North African', value: diversity.mena },
            ]}
          />
        </Section>

        <Section id="enrollment" title="Enrollment">
          <Enrollment metrics={metrics} />
        </Section>
      </div>
    </div>
  );
}
