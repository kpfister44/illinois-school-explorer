// ABOUTME: A school's row in the Top scores ranking, linking to the school
// ABOUTME: Shows its rank, town, enrollment, low-income share, designation and score

import { Link } from 'react-router-dom';
import type { Assessment, TopScoreEntry } from '@/lib/api/types';
import { ASSESSMENT_SCORES } from '@/lib/benchmarks';
import { formatMetric } from '@/lib/format';
import { actBreakdown, enrollmentText, lowIncomeText } from '@/lib/topScores';
import { cn } from '@/lib/utils';

interface TopScoreRowProps {
  entry: TopScoreEntry;
  assessment: Assessment;
  highlighted?: boolean;
}

export default function TopScoreRow({ entry, assessment, highlighted = false }: TopScoreRowProps) {
  const subjects = assessment === 'act' ? actBreakdown(entry) : undefined;
  const facts = [entry.city, enrollmentText(entry.enrollment), lowIncomeText(entry.low_income_percentage)];

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={`/school/${entry.rcdts}`}
        className="flex min-h-11 items-start gap-3 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="w-8 flex-none pt-0.5 text-lg font-bold tabular-nums">
          <span className="sr-only">Rank </span>
          {entry.rank}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'font-semibold',
              highlighted && 'bg-highlighter px-1 text-highlighter-foreground'
            )}
          >
            {entry.display_name}
          </span>
          <span className="block text-sm text-muted-foreground">{facts.join(' · ')}</span>
          {entry.designation && (
            <span className="block text-sm text-muted-foreground">{entry.designation}</span>
          )}
        </span>
        <span className="flex-none text-right">
          <span className="block text-lg font-bold tabular-nums">
            {formatMetric(entry.score, ASSESSMENT_SCORES[assessment].kind)}
          </span>
          {subjects && (
            <span className="block whitespace-nowrap text-xs text-muted-foreground">{subjects}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
