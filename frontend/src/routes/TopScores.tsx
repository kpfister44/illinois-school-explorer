// ABOUTME: Top Scores leaderboard route
// ABOUTME: Shows hero, filters, and leaderboard placeholder

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Leaderboard</p>
        <h1 className="text-4xl font-bold">Top Illinois Schools</h1>
        <p className="text-lg text-muted-foreground">
          Ranked by ACT (grade 11) and IAR % Meets/Exceeds per normalized level.
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
            ACT scores use grade 11 overall averages while IAR scores use percent Meets or
            Exceeds. Each category is normalized to a 100-point scale and ranked statewide.
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
