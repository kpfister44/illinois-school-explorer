// ABOUTME: A school's row in a results list, linking to the school
// ABOUTME: Shows where it is, grades, enrollment, state designation and the one test score for its level

import { Link } from 'react-router-dom';
import type { SchoolListItem } from '@/lib/api/types';
import { ASSESSMENT_SCORES } from '@/lib/benchmarks';
import { formatGrades, formatMetric } from '@/lib/format';

interface SchoolListRowProps {
  school: SchoolListItem;
}

export default function SchoolListRow({ school }: SchoolListRowProps) {
  const score = ASSESSMENT_SCORES[school.assessment];
  const facts = [
    school.city,
    school.district,
    school.grades_served && formatGrades(school.grades_served),
    school.enrollment !== null && `${formatMetric(school.enrollment, 'count')} students`,
  ].filter(Boolean);

  return (
    <li className="border-b border-border">
      <Link
        to={`/school/${school.rcdts}`}
        className="flex min-h-11 items-center justify-between gap-4 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{school.display_name}</span>
          <span className="block text-sm text-muted-foreground">{facts.join(' · ')}</span>
          {school.designation && (
            <span className="block text-sm text-muted-foreground">{school.designation}</span>
          )}
        </span>
        <span className="flex-none text-right">
          {school.score === null ? (
            <span className="block text-sm text-muted-foreground">No score</span>
          ) : (
            <>
              <span className="block text-lg font-bold tabular-nums">
                {formatMetric(school.score, score.kind)}
              </span>
              <span className="block text-xs text-muted-foreground">{score.caption}</span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}
