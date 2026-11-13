// ABOUTME: Desktop bar fixed to the bottom of the screen showing schools selected for comparison
// ABOUTME: Hidden on the Compare page; phones reach the comparison through the Compare tab instead

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SelectedSchoolList from '@/components/SelectedSchoolList';
import { useComparison } from '@/contexts/ComparisonContext';
import { COMPARE_PATH, comparePath } from '@/lib/compareList';
import type { School } from '@/lib/api/types';

interface ComparisonBasketProps {
  schools: School[];
}

export default function ComparisonBasket({ schools }: ComparisonBasketProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const { pathname } = useLocation();

  // The Compare page manages its own list
  if (comparisonList.length === 0 || pathname === COMPARE_PATH) {
    return null;
  }

  const canCompare = comparisonList.length >= 2;

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold">Compare Schools</span>
              <Badge variant="secondary">{comparisonList.length} schools selected</Badge>
            </div>
            <SelectedSchoolList
              schools={schools.filter((school) => comparisonList.includes(school.rcdts))}
              onRemove={removeFromComparison}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearComparison}>
              Clear All
            </Button>
            <Button asChild disabled={!canCompare}>
              <Link
                to={comparePath(comparisonList)}
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
