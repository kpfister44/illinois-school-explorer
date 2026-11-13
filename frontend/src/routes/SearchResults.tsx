// ABOUTME: SearchResults page component
// ABOUTME: Lists schools for the search, level, filters and sort held in the URL, a page at a time

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ChipLink from '@/components/ChipLink';
import SchoolFilterForm from '@/components/SchoolFilterForm';
import SchoolListRow from '@/components/SchoolListRow';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolList } from '@/lib/api/queries';
import type { BenchmarkLevel } from '@/lib/api/types';
import { formatMetric } from '@/lib/format';
import {
  FORM_FILTERS,
  listPath,
  readFilters,
  sortChoices,
  type SchoolListFilters,
} from '@/lib/schoolList';
import { useToast } from '@/hooks/use-toast';

const LEVEL_CHIPS: { label: string; level?: BenchmarkLevel }[] = [
  { label: 'All levels' },
  { label: 'Elementary', level: 'elementary' },
  { label: 'Middle', level: 'middle' },
  { label: 'High', level: 'high' },
];

function headline(filters: SchoolListFilters): string {
  if (filters.city) {
    return `Schools in ${filters.city}`;
  }
  if (filters.q) {
    return `Results for “${filters.q}”`;
  }
  return 'Illinois schools';
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = readFilters(searchParams);
  const filtersKey = listPath(filters);

  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSchoolList(filters);
  const schools = data?.pages.flatMap((page) => page.results) ?? [];
  const total = data?.pages[0]?.total;
  const filterCount = FORM_FILTERS.filter((name) => filters[name] !== undefined).length;
  const sorts = sortChoices(filters);

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Unable to search schools',
      });
    }
  }, [isError, error, toast]);

  const applyFilters = (applied: SchoolListFilters) => {
    setSheetOpen(false);
    navigate(listPath(applied));
  };

  return (
    <div className="space-y-6 py-4">
      <div className="max-w-3xl">
        <SearchBar key={filters.q ?? ''} defaultQuery={filters.q} />
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-medium leading-tight">{headline(filters)}</h1>
        {filters.city && (
          <Link
            to={listPath({ ...filters, city: undefined })}
            className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4"
          >
            All of Illinois
          </Link>
        )}
      </header>

      <nav aria-label="School level">
        <ul role="list" className="flex flex-wrap gap-2">
          {LEVEL_CHIPS.map((chip) => (
            <li key={chip.label}>
              <ChipLink
                to={listPath({ ...filters, level: chip.level })}
                current={filters.level === chip.level}
              >
                {chip.label}
              </ChipLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="gap-10 md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden md:block">
          <SchoolFilterForm key={filtersKey} filters={filters} onApply={applyFilters} />
        </aside>

        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total !== undefined &&
                `${formatMetric(total, 'count')} ${total === 1 ? 'school' : 'schools'}`}
            </p>
            <div className="flex items-end gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    {filterCount > 0 ? `Filters (${filterCount})` : 'Filters'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
                  <div className="mx-auto max-w-xl space-y-4">
                    <SheetHeader className="pr-10 text-left">
                      <SheetTitle className="font-display text-2xl font-medium">Filters</SheetTitle>
                      <SheetDescription>Narrow the list of schools.</SheetDescription>
                    </SheetHeader>
                    <SchoolFilterForm filters={filters} onApply={applyFilters} />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <label htmlFor="list-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="list-sort"
                  value={sorts.find((choice) => choice.current)?.value}
                  onChange={(event) => {
                    const chosen = sorts.find((choice) => choice.value === event.target.value);
                    if (chosen) {
                      navigate(listPath(chosen.filters));
                    }
                  }}
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {sorts.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-muted-foreground">The schools could not be loaded.</p>
          )}

          {total === 0 && (
            <div className="py-6 text-muted-foreground">
              <p className="mb-1 text-lg font-medium">No schools found</p>
              <p className="text-sm">Try another name, city or district, or remove a filter.</p>
            </div>
          )}

          {schools.length > 0 && (
            <ul role="list" aria-label="Schools" className="border-t-2 border-foreground">
              {schools.map((school) => (
                <SchoolListRow key={school.rcdts} school={school} />
              ))}
            </ul>
          )}

          {hasNextPage && (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full sm:w-auto"
            >
              {isFetchingNextPage ? 'Loading…' : 'Show more schools'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
