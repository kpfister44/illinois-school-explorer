// ABOUTME: District page component
// ABOUTME: Shows a district's summary and, for each school level, every school's headline score on one scale

import { isAxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DotPlot from '@/components/DotPlot';
import Section from '@/components/Section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useComparison } from '@/contexts/ComparisonContext';
import { useDistrict, useStateBenchmark } from '@/lib/api/queries';
import type { BenchmarkLevel, DistrictLevel } from '@/lib/api/types';
import { ASSESSMENT_SCALES, ASSESSMENT_SCORES, describeLevel } from '@/lib/benchmarks';
import { formatMetric } from '@/lib/format';
import { listPath } from '@/lib/schoolList';
import { CURRENT_YEAR } from '@/lib/trendUtils';

const LEVEL_TITLES: Record<BenchmarkLevel, string> = {
  elementary: 'Elementary schools',
  middle: 'Middle schools',
  high: 'High schools',
  other: 'Other schools',
};

const PLOT_NAMES = {
  act: 'ACT average by school',
  iar: 'IAR proficiency by school',
} as const;

const FEWEST_COMPARED = 2;
const MOST_COMPARED = 5;
const LINK_CLASS = 'font-medium text-link underline underline-offset-4';

function LevelSection({ level }: { level: DistrictLevel }) {
  const navigate = useNavigate();
  const { replaceComparison } = useComparison();
  const { data: state } = useStateBenchmark(level.assessment, level.level);
  const { kind } = ASSESSMENT_SCORES[level.assessment];
  const plotName = PLOT_NAMES[level.assessment];
  const comparedWith = describeLevel(level.level);

  const scored = level.schools.filter((school) => school.score !== null);
  const unscored = level.schools.filter((school) => school.score === null);
  const canCompare =
    level.schools.length >= FEWEST_COMPARED && level.schools.length <= MOST_COMPARED;
  const band =
    state && state.band_low !== null && state.band_high !== null
      ? { low: state.band_low, high: state.band_high }
      : undefined;
  const averages = [
    level.district_average !== null &&
      `District average ${formatMetric(level.district_average, kind)}`,
    level.state_average !== null &&
      `${comparedWith} average ${formatMetric(level.state_average, kind)}`,
  ].filter(Boolean);

  const compareAll = () => {
    replaceComparison(level.schools.map((school) => school.rcdts));
    navigate('/compare');
  };

  return (
    <Section id={`level-${level.level}`} title={LEVEL_TITLES[level.level]}>
      {scored.length > 0 && (
        <>
          <p className="text-sm font-medium">
            {plotName} · {CURRENT_YEAR}
          </p>
          <DotPlot
            label={plotName}
            rows={scored.map((school) => ({
              label: school.display_name,
              value: school.score!,
              to: `/school/${school.rcdts}`,
            }))}
            kind={kind}
            scale={ASSESSMENT_SCALES[level.assessment]}
            band={band}
            wideLabels
          />
          {averages.length > 0 && <p className="text-sm">{averages.join(' · ')}.</p>}
          {band && (
            <p className="text-sm text-muted-foreground">
              Shaded band: where most {comparedWith} fall, {formatMetric(band.low, kind)} to{' '}
              {formatMetric(band.high, kind)}.
            </p>
          )}
        </>
      )}

      {unscored.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">No {CURRENT_YEAR} score published:</p>
          <ul role="list" aria-label={`Schools with no ${CURRENT_YEAR} score published`}>
            {unscored.map((school) => (
              <li key={school.rcdts}>
                <Link
                  to={`/school/${school.rcdts}`}
                  className={`inline-flex min-h-11 items-center text-sm ${LINK_CLASS}`}
                >
                  {school.display_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canCompare && (
        <Button variant="outline" onClick={compareAll} className="w-full sm:w-auto">
          {level.schools.length === FEWEST_COMPARED
            ? 'Compare both'
            : `Compare all ${level.schools.length}`}
        </Button>
      )}
    </Section>
  );
}

export default function District() {
  const { districtId = '' } = useParams<{ districtId: string }>();
  const { data: district, isLoading, error } = useDistrict(districtId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!district) {
    const notFound = isAxiosError(error) && error.response?.status === 404;

    return (
      <div className="mx-auto max-w-3xl space-y-2 py-8">
        <h1 className="text-3xl font-medium">
          {notFound ? 'District not found' : 'The district could not be loaded'}
        </h1>
        <Link to="/browse?by=district" className={`inline-flex min-h-11 items-center ${LINK_CLASS}`}>
          Browse districts
        </Link>
      </div>
    );
  }

  const summary = [
    district.county && `${district.county} County`,
    `${formatMetric(district.school_count, 'count')} ${district.school_count === 1 ? 'school' : 'schools'}`,
    `${formatMetric(district.enrollment, 'count')} students`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <BackButton />
      <header className="space-y-1">
        <h1 className="text-3xl font-medium leading-tight lg:text-4xl">{district.name}</h1>
        <p className="text-muted-foreground">{summary.join(' · ')}</p>
      </header>

      {district.levels.map((level) => (
        <LevelSection key={level.level} level={level} />
      ))}

      <Link
        to={listPath({ district: district.id })}
        className={`inline-flex min-h-11 items-center text-sm ${LINK_CLASS}`}
      >
        See these schools as a list
      </Link>
    </div>
  );
}
