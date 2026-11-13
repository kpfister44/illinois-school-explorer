// ABOUTME: A pill-shaped link for choosing between a few views of a list
// ABOUTME: Marks the choice in use with a filled background and aria-current

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ChipLinkProps {
  to: string;
  current?: boolean;
  children: ReactNode;
}

export default function ChipLink({ to, current = false, children }: ChipLinkProps) {
  return (
    <Link
      to={to}
      aria-current={current ? 'true' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        current
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card hover:bg-accent'
      )}
    >
      {children}
    </Link>
  );
}
