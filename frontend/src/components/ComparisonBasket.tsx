// ABOUTME: Bottom bar showing selected schools for comparison
// ABOUTME: Mobile: Collapsible FAB with sheet; Desktop: Fixed bottom bar

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useComparison } from '@/contexts/ComparisonContext';
import type { School } from '@/lib/api/types';

interface ComparisonBasketProps {
  schools: School[];
}

export default function ComparisonBasket({ schools }: ComparisonBasketProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [isOpen, setIsOpen] = useState(false);

  if (comparisonList.length === 0) {
    return null;
  }

  const schoolMap = new Map(schools.map((school) => [school.rcdts, school]));
  const orderedSchools = comparisonList
    .map((rcdts) => schoolMap.get(rcdts))
    .filter((school): school is School => Boolean(school));
  const canCompare = comparisonList.length >= 2;

  const SchoolBadgesList = () => (
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
  );

  const ActionButtons = () => (
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
            } else {
              setIsOpen(false);
            }
          }}
        >
          Compare
        </Link>
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile: Floating Action Button with Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
              aria-label={`Compare ${comparisonList.length} schools`}
            >
              <div className="relative">
                <Scale className="h-6 w-6" />
                <Badge
                  variant="destructive"
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {comparisonList.length}
                </Badge>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Compare Schools</SheetTitle>
              <SheetDescription>
                {comparisonList.length} school{comparisonList.length !== 1 ? 's' : ''} selected
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <SchoolBadgesList />
              <ActionButtons />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Bottom Bar */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">Compare Schools</span>
                <Badge variant="secondary">{comparisonList.length} schools selected</Badge>
              </div>
              <SchoolBadgesList />
            </div>
            <ActionButtons />
          </div>
        </div>
      </div>
    </>
  );
}
