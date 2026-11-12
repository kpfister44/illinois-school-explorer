// ABOUTME: Bottom sheet listing the schools most like a school in income, English learners and size
// ABOUTME: Requests the list when opened, from whatever control is passed as its child

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSimilarSchools } from '@/lib/api/queries';
import type { Assessment, BenchmarkLevel } from '@/lib/api/types';
import { describeLevel } from '@/lib/benchmarks';
import { formatMetric, type MetricKind } from '@/lib/format';

interface SimilarSchoolsSheetProps {
  rcdts: string;
  assessment: Assessment;
  level: BenchmarkLevel;
  children: ReactNode;
}

const SCORES: Record<Assessment, { kind: MetricKind; name: string; caption: string }> = {
  act: { kind: 'score', name: 'ACT', caption: 'ACT average' },
  iar: { kind: 'percentage', name: 'IAR proficiency', caption: 'IAR proficient' },
};

export default function SimilarSchoolsSheet({
  rcdts,
  assessment,
  level,
  children,
}: SimilarSchoolsSheetProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useSimilarSchools(rcdts, assessment, open);
  const score = SCORES[assessment];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <div className="mx-auto max-w-xl space-y-4">
          <SheetHeader className="pr-10 text-left">
            <SheetTitle className="font-display text-2xl font-medium">Similar schools</SheetTitle>
            <SheetDescription>
              The 25 {describeLevel(level)} most like this one in family income, English learners
              and size, nearest first.
            </SheetDescription>
          </SheetHeader>

          {isLoading && <p className="text-sm text-muted-foreground">Loading similar schools…</p>}
          {isError && (
            <p className="text-sm text-muted-foreground">The similar schools could not be loaded.</p>
          )}
          {data && data.schools.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This school cannot be matched because ISBE did not publish its low-income share or
              enrollment.
            </p>
          )}
          {data && data.average !== null && (
            <p>{`Their average ${score.name} is ${formatMetric(data.average, score.kind)}.`}</p>
          )}

          {data && data.schools.length > 0 && (
            <ul role="list" className="border-t-2 border-foreground">
              {data.schools.map((school) => (
                <li key={school.rcdts} className="border-b border-border">
                  <Link
                    to={`/school/${school.rcdts}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{school.display_name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {school.city} · {formatMetric(school.enrollment, 'count')} students ·{' '}
                        {formatMetric(school.low_income_percentage, 'percentage')} low income
                      </span>
                    </span>
                    <span className="flex-none text-right">
                      <span className="block text-lg font-bold tabular-nums">
                        {formatMetric(school.score, score.kind)}
                      </span>
                      <span className="block text-xs text-muted-foreground">{score.caption}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
