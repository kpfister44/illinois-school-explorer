// ABOUTME: Leaderboard table for Top Scores page
// ABOUTME: Renders ranked school rows with pagination for mobile optimization

import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Assessment, TopScoreEntry } from '@/lib/api/types';

const INITIAL_PAGE_SIZE = 20;

interface TopScoresTableProps {
  entries: TopScoreEntry[];
  assessment: Assessment;
}

export default function TopScoresTable({ entries, assessment }: TopScoresTableProps) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  if (!entries.length) {
    return <p className="py-8 text-center text-muted-foreground">No ranked schools available.</p>;
  }

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;
  const remaining = entries.length - visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + INITIAL_PAGE_SIZE, entries.length));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>School</TableHead>
              <TableHead className="hidden md:table-cell">District</TableHead>
              <TableHead className="hidden lg:table-cell">Enrollment</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleEntries.map((entry) => {
              const scoreDisplay = formatScore(entry.score, assessment);
              const actBreakdown = assessment === 'act' ? formatActBreakdown(entry) : undefined;

              const handleNavigate = () => navigate(`/school/${entry.rcdts}`);
              const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleNavigate();
                }
              };

              return (
                <TableRow
                  key={entry.rcdts}
                  role="button"
                  tabIndex={0}
                  onClick={handleNavigate}
                  onKeyDown={handleKeyDown}
                  className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={`View details for ${entry.school_name}`}
                >
                  <TableCell>
                    <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>{entry.rank}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{entry.school_name}</div>
                    <p className="text-sm text-muted-foreground">{entry.city}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{entry.district ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {entry.enrollment ? entry.enrollment.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className="text-lg font-semibold"
                      title={actBreakdown ?? undefined}
                      aria-label={actBreakdown ?? scoreDisplay}
                    >
                      {scoreDisplay}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {visibleCount} of {entries.length} schools
          </p>
          <Button onClick={loadMore} variant="outline" size="lg">
            Load More ({remaining} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

function formatScore(score: number, assessment: Assessment) {
  const value = score.toFixed(1);
  return assessment === 'iar' ? `${value}%` : value;
}

function formatActBreakdown(entry: TopScoreEntry) {
  if (entry.act_ela_avg == null && entry.act_math_avg == null) {
    return 'ACT overall average (ELA and Math)';
  }
  const ela = entry.act_ela_avg != null ? entry.act_ela_avg.toFixed(1) : '—';
  const math = entry.act_math_avg != null ? entry.act_math_avg.toFixed(1) : '—';
  return `ACT subject averages · ELA ${ela}, Math ${math}`;
}
