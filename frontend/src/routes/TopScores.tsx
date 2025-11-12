// ABOUTME: Top Scores leaderboard route
// ABOUTME: Shows hero, filters, and leaderboard placeholder

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTopScores, topScoresQueryKey } from '@/lib/api/queries';

const FILTERS = [
  { id: 'act-high', assessment: 'act', level: 'high', label: 'High School ACT' },
  { id: 'iar-middle', assessment: 'iar', level: 'middle', label: 'Middle School IAR' },
  { id: 'iar-elementary', assessment: 'iar', level: 'elementary', label: 'Elementary IAR' },
] as const;

export default function TopScores() {
  const [active, setActive] = useState<(typeof FILTERS)[number]>(FILTERS[0]);
  const query = useQuery({
    queryKey: topScoresQueryKey(active.assessment, active.level, 100),
    queryFn: () => getTopScores({ assessment: active.assessment, level: active.level, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Leaderboard</p>
        <h1 className="text-4xl font-bold">Top Illinois Schools</h1>
        <p className="text-lg text-muted-foreground">
          Ranked by ACT (grade 11) and IAR % Meets/Exceeds per normalized level.
        </p>
      </header>
      <Tabs
        value={active.id}
        onValueChange={(id) => {
          const next = FILTERS.find((tab) => tab.id === id);
          if (next) {
            setActive(next);
          }
        }}
      >
        <TabsList className="flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        {query.isLoading ? 'Loading leaderboard...' : 'Leaderboard will appear here.'}
      </div>
    </section>
  );
}
