// ABOUTME: Top Scores leaderboard route
// ABOUTME: Ranks one level's schools statewide or in a county or district, finds any school's rank, all held in the URL

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/BackButton';
import RankLookup from '@/components/RankLookup';
import RegionFields from '@/components/RegionFields';
import TopScoreRow from '@/components/TopScoreRow';
import TopScoresFilters from '@/components/TopScoresFilters';
import type { TopScoresFilterOption } from '@/components/TopScoresFilters';
import TopScoresTable from '@/components/TopScoresTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopScores, topScoresQueryKey, useDistricts } from '@/lib/api/queries';
import type { SchoolListItem } from '@/lib/api/types';
import {
  RANKED_LEVELS,
  isRankedLevel,
  rankedAssessment,
  readTopScoresView,
  topScoresPath,
  type RankedLevel,
  type TopScoresView,
} from '@/lib/topScores';

const FILTERS: TopScoresFilterOption[] = RANKED_LEVELS.map((ranked) => ({
  id: ranked.level,
  ...ranked,
}));

const LEVEL_SCHOOLS: Record<RankedLevel, string> = {
  high: 'high schools',
  middle: 'middle schools',
  elementary: 'elementary schools',
};

const STALE_TIME = 5 * 60 * 1000;

function rankingQuery(view: TopScoresView) {
  return {
    queryKey: topScoresQueryKey(view),
    queryFn: () =>
      getTopScores({ assessment: rankedAssessment(view.level), limit: 100, ...view }),
    staleTime: STALE_TIME,
  };
}

function sameText(value: string | null, wanted: string | undefined) {
  return value !== null && wanted !== undefined && value.trim().toLowerCase() === wanted.trim().toLowerCase();
}

export default function TopScores() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = readTopScoresView(searchParams);
  const { data: districts = [] } = useDistricts();

  const region = view.district
    ? (districts.find((item) => item.id === view.district)?.name ?? 'this district')
    : view.county
      ? `${view.county} County`
      : 'Illinois';

  const show = (next: TopScoresView) => navigate(topScoresPath(next));

  const handleLevelChange = (level: string) => {
    if (isRankedLevel(level)) {
      show({ level, county: view.county, district: view.district });
    }
  };

  const prefetchOption = (option: TopScoresFilterOption) => {
    queryClient.prefetchQuery(
      rankingQuery({ level: option.level as RankedLevel, county: view.county, district: view.district })
    );
  };

  const handleLookup = (school: SchoolListItem) => {
    if (!isRankedLevel(school.level)) {
      return;
    }
    const inCounty = !view.county || sameText(school.county, view.county);
    const inDistrict = !view.district || school.district_id === view.district;
    const keepRegion = inCounty && inDistrict;
    show({
      level: school.level,
      county: keepRegion ? view.county : undefined,
      district: keepRegion ? view.district : undefined,
      school: school.rcdts,
    });
  };

  const query = useQuery(rankingQuery(view));
  const entries = query.data?.results ?? [];
  const lookedUp = query.data?.school ?? null;
  const assessment = rankedAssessment(view.level);
  const clearLookup = topScoresPath({ ...view, school: undefined });

  const renderLookedUp = () => {
    if (!view.school || !query.data) {
      return null;
    }
    if (!lookedUp) {
      return (
        <p className="text-sm text-muted-foreground">
          The school you looked up is not ranked among {LEVEL_SCHOOLS[view.level]} in {region}.{' '}
          <Link to={clearLookup} className="underline">
            Clear
          </Link>
        </p>
      );
    }
    return (
      <section aria-label={lookedUp.display_name} className="rounded-lg border bg-card px-4 pt-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">
            Rank {lookedUp.rank} of {query.data.total} {LEVEL_SCHOOLS[view.level]} in {region}
          </p>
          <Link
            to={clearLookup}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm underline"
          >
            Clear
          </Link>
        </div>
        <ul>
          <TopScoreRow entry={lookedUp} assessment={assessment} highlighted />
        </ul>
      </section>
    );
  };

  const renderLeaderboard = () => {
    if (query.isError) {
      const message =
        query.error instanceof Error ? query.error.message : 'Please try again soon.';
      return (
        <Alert variant="destructive">
          <AlertTitle>Unable to load leaderboard</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      );
    }

    if (query.isLoading) {
      return (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {query.data?.total ?? 0} {LEVEL_SCHOOLS[view.level]} ranked in {region}
        </p>
        <TopScoresTable entries={entries} assessment={assessment} highlighted={view.school} />
      </div>
    );
  };

  return (
    <section className="space-y-8">
      <BackButton />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Leaderboard</p>
        <h1 className="text-4xl font-medium">Top Illinois Schools</h1>
        <p className="text-lg text-muted-foreground">
          The 100 highest-scoring schools at each level, ranked by average ACT score for high
          schools and IAR proficiency for middle and elementary schools. Narrow the ranking to a
          county or district, or find any school's rank.
        </p>
      </header>
      <TopScoresFilters
        value={view.level}
        options={FILTERS}
        onChange={handleLevelChange}
        onHoverOption={prefetchOption}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <RegionFields
          county={view.county ?? ''}
          district={view.district ?? ''}
          onChange={(chosen) =>
            show({
              level: view.level,
              county: chosen.county || undefined,
              district: chosen.district || undefined,
            })
          }
        />
        <RankLookup onSelect={handleLookup} />
      </div>
      {renderLookedUp()}
      <Alert>
        <AlertTitle>How rankings are calculated</AlertTitle>
        <AlertDescription>
          High schools are ranked by ACT score, out of 36: the average of the grade 11 English
          language arts and math scores. Middle and elementary schools are ranked by IAR
          proficiency: the average of the English language arts and math proficiency rates.
          Scores appear as ISBE published them. Schools with the same score share a rank. Each
          school is ranked against every Illinois school of the same level; choosing a county or
          district ranks only its schools, starting from 1. Scores follow family income closely,
          so each school's low-income share is shown beside its score.
        </AlertDescription>
      </Alert>
      {renderLeaderboard()}
    </section>
  );
}
