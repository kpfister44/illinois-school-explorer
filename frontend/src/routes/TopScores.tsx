// ABOUTME: Top Scores leaderboard route
// ABOUTME: Shows hero, filters, ranking explanation, and the leaderboard

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/BackButton';
import TopScoresFilters from '@/components/TopScoresFilters';
import type { TopScoresFilterOption } from '@/components/TopScoresFilters';
import TopScoresTable from '@/components/TopScoresTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopScores, topScoresQueryKey } from '@/lib/api/queries';

const FILTERS: TopScoresFilterOption[] = [
  { id: 'act-high', assessment: 'act', level: 'high', label: 'High School ACT' },
  { id: 'iar-middle', assessment: 'iar', level: 'middle', label: 'Middle School IAR' },
  { id: 'iar-elementary', assessment: 'iar', level: 'elementary', label: 'Elementary IAR' },
];

export default function TopScores() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(FILTERS[0].id);
  const active = FILTERS.find((option) => option.id === activeId) ?? FILTERS[0];

  const handleChange = (id: string) => {
    const next = FILTERS.find((option) => option.id === id);
    if (next) {
      setActiveId(next.id);
    }
  };

  const prefetchOption = (option: TopScoresFilterOption) => {
    queryClient.prefetchQuery({
      queryKey: topScoresQueryKey(option.assessment, option.level, 100),
      queryFn: () =>
        getTopScores({ assessment: option.assessment, level: option.level, limit: 100 }),
      staleTime: 5 * 60 * 1000,
    });
  };

  const query = useQuery({
    queryKey: topScoresQueryKey(active.assessment, active.level, 100),
    queryFn: () => getTopScores({ assessment: active.assessment, level: active.level, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const entries = query.data?.results ?? [];

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

    return <TopScoresTable entries={entries} assessment={active.assessment} />;
  };

  return (
    <section className="space-y-8">
      <BackButton />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Leaderboard</p>
        <h1 className="text-4xl font-bold">Top Illinois Schools</h1>
        <p className="text-lg text-muted-foreground">
          The 100 highest-scoring schools at each level, ranked by average ACT score for high
          schools and IAR proficiency for middle and elementary schools.
        </p>
      </header>
      <TopScoresFilters
        value={active.id}
        options={FILTERS}
        onChange={handleChange}
        onHoverOption={prefetchOption}
      />
      <div className="space-y-3">
        <Alert>
          <AlertTitle>How rankings are calculated</AlertTitle>
          <AlertDescription>
            High schools are ranked by ACT score, out of 36: the average of the grade 11 English
            language arts and math scores. Middle and elementary schools are ranked by IAR
            proficiency: the average of the English language arts and math proficiency rates.
            Scores appear as ISBE published them, and each school is ranked against every
            Illinois school of the same level.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Legend:</span> Dark badges represent the top three
          schools in each assessment-level slice. Enrollment values use the latest ISBE
          reporting year.
        </p>
      </div>
      {renderLeaderboard()}
    </section>
  );
}
