// ABOUTME: The Top scores ranking: a list on phones, a table on desktop, 20 schools at a time
// ABOUTME: Each school shows its enrollment, low-income share and designation beside its score

import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TopScoreRow from '@/components/TopScoreRow';
import type { Assessment, TopScoreEntry } from '@/lib/api/types';
import { ASSESSMENT_SCORES } from '@/lib/benchmarks';
import { formatMetric } from '@/lib/format';
import { actBreakdown } from '@/lib/topScores';
import { cn } from '@/lib/utils';

const INITIAL_PAGE_SIZE = 20;
const NOT_REPORTED = <span className="text-muted-foreground">Not reported</span>;

interface TopScoresTableProps {
  entries: TopScoreEntry[];
  assessment: Assessment;
  highlighted?: string;
}

export default function TopScoresTable({ entries, assessment, highlighted }: TopScoresTableProps) {
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
      <ul className="md:hidden">
        {visibleEntries.map((entry) => (
          <TopScoreRow
            key={entry.rcdts}
            entry={entry}
            assessment={assessment}
            highlighted={entry.rcdts === highlighted}
          />
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>School</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Low income</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleEntries.map((entry) => {
              const scoreDisplay = formatMetric(entry.score, ASSESSMENT_SCORES[assessment].kind);
              const subjects = assessment === 'act' ? actBreakdown(entry) : undefined;
              const place = [entry.city, entry.district].filter(Boolean).join(' · ');

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
                  aria-label={`View details for ${entry.display_name}`}
                >
                  <TableCell className="text-lg font-bold">{entry.rank}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold',
                        entry.rcdts === highlighted &&
                          'bg-highlighter px-1 text-highlighter-foreground'
                      )}
                    >
                      {entry.display_name}
                    </span>
                    <p className="text-sm text-muted-foreground">{place}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.enrollment === null ? NOT_REPORTED : formatMetric(entry.enrollment, 'count')}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.low_income_percentage === null
                      ? NOT_REPORTED
                      : formatMetric(entry.low_income_percentage, 'percentage')}
                  </TableCell>
                  <TableCell>{entry.designation ?? 'Not designated'}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-lg font-semibold">{scoreDisplay}</span>
                    {subjects && (
                      <p className="whitespace-nowrap text-xs text-muted-foreground">{subjects}</p>
                    )}
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
