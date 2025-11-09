// ABOUTME: Skeleton component for loading placeholders
// ABOUTME: Renders animated blocks for pending content

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-testid="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
