// ABOUTME: Count of schools selected for comparison, shown beside the Compare destination
// ABOUTME: Renders nothing when no school is selected

import { useComparison } from '@/contexts/ComparisonContext';
import { cn } from '@/lib/utils';

interface CompareCountProps {
  className?: string;
}

export default function CompareCount({ className }: CompareCountProps) {
  const { comparisonList } = useComparison();

  if (comparisonList.length === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-primary-foreground',
        className
      )}
    >
      <span aria-hidden="true">{comparisonList.length}</span>
      <span className="sr-only">
        {comparisonList.length} {comparisonList.length === 1 ? 'school' : 'schools'} selected
      </span>
    </span>
  );
}
