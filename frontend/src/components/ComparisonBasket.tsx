// ABOUTME: Bottom bar showing selected schools for comparison
// ABOUTME: Displays badges and Compare button when schools are selected

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComparison } from '@/contexts/ComparisonContext';
import type { School } from '@/lib/api/types';

interface ComparisonBasketProps {
  schools: School[];
}

export default function ComparisonBasket({ schools }: ComparisonBasketProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();

  if (comparisonList.length === 0) {
    return null;
  }

  const schoolMap = new Map(schools.map((school) => [school.rcdts, school]));
  const orderedSchools = comparisonList
    .map((rcdts) => schoolMap.get(rcdts))
    .filter((school): school is School => Boolean(school));
  const canCompare = comparisonList.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold">Compare Schools</span>
              <Badge variant="secondary">{comparisonList.length} schools selected</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {orderedSchools.map((school) => {
                const isPlaceholder = school.id < 0;
                const displayName = isPlaceholder
                  ? `${school.school_name} (${school.rcdts})`
                  : school.school_name;

                return (
                  <Badge key={school.rcdts} variant="outline" className="pr-1">
                    <span
                      className={`max-w-[200px] truncate ${isPlaceholder ? 'text-muted-foreground' : ''}`}
                    >
                      {displayName}
                    </span>
                  <button
                    type="button"
                    onClick={() => removeFromComparison(school.rcdts)}
                    className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    aria-label={`Remove ${displayName}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearComparison}>
              Clear All
            </Button>
            <Button asChild disabled={!canCompare}>
              <Link
                to="/compare"
                role="button"
                aria-disabled={!canCompare}
                tabIndex={canCompare ? undefined : -1}
                onClick={(event) => {
                  if (!canCompare) {
                    event.preventDefault();
                  }
                }}
              >
                Compare
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
