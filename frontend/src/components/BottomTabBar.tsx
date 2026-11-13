// ABOUTME: Phone navigation fixed to the bottom of the screen
// ABOUTME: Tabs for Search, Browse, Compare (with the selected-school count) and Top scores

import { Link, useLocation } from 'react-router-dom';
import CompareCount from '@/components/CompareCount';
import { BROWSE, COMPARE, SEARCH, TOP_SCORES } from '@/lib/destinations';
import { cn } from '@/lib/utils';

const TABS = [SEARCH, BROWSE, COMPARE, TOP_SCORES];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const isCurrent = tab.isCurrent(pathname);
          const Icon = tab.icon;

          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}{' '}
                {tab === COMPARE && <CompareCount className="absolute left-1/2 top-1 ml-1.5" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
