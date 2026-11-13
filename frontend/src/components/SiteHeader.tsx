// ABOUTME: Site header with the title on every screen size
// ABOUTME: On desktop it also holds the search field and the navigation row

import { Link, useLocation } from 'react-router-dom';
import CompareCount from '@/components/CompareCount';
import SearchBar from '@/components/SearchBar';
import { BROWSE, COMPARE, TOP_SCORES } from '@/lib/destinations';
import { LIST_PATH } from '@/lib/schoolList';
import { cn } from '@/lib/utils';

const NAV_LINKS = [BROWSE, COMPARE, TOP_SCORES];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const pageHasOwnSearchField = pathname === '/' || pathname === LIST_PATH;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 md:min-h-16 lg:px-8">
        <Link
          to="/"
          className="flex min-h-11 items-center whitespace-nowrap font-display text-lg font-semibold md:text-xl"
        >
          Illinois School Explorer
        </Link>
        {!pageHasOwnSearchField && (
          <div className="hidden max-w-md flex-1 md:block">
            <SearchBar />
          </div>
        )}
        <nav aria-label="Primary" className="ml-auto hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const isCurrent = link.isCurrent(pathname);

            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium hover:bg-accent',
                  isCurrent ? 'text-foreground underline underline-offset-8' : 'text-muted-foreground'
                )}
              >
                {link.label}{' '}
                {link === COMPARE && <CompareCount />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
