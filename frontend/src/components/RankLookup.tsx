// ABOUTME: A field that finds any school's place in the Top scores ranking, including beyond the top 100
// ABOUTME: Offers the schools that match what is typed; schools without a ranked score are shown but not offered

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import type { SchoolListItem } from '@/lib/api/types';
import { getSchools } from '@/lib/api/queries';
import { formatGrades } from '@/lib/format';
import { isRankedLevel } from '@/lib/topScores';
import { cn } from '@/lib/utils';

interface RankLookupProps {
  onSelect: (school: SchoolListItem) => void;
}

const SHORTEST_QUERY = 2;
const MOST_OFFERED = 8;
const LABEL = "Find a school's rank";

function isRanked(school: SchoolListItem): boolean {
  return isRankedLevel(school.level) && school.score !== null;
}

export default function RankLookup({ onSelect }: RankLookupProps) {
  const [query, setQuery] = useState('');
  const [hasFocus, setHasFocus] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 300);
  const shouldSearch = debouncedQuery.length >= SHORTEST_QUERY;

  const { data } = useQuery({
    queryKey: ['rank-lookup', debouncedQuery],
    queryFn: () => getSchools({ q: debouncedQuery }, 0),
    enabled: shouldSearch,
  });
  const schools = shouldSearch ? (data?.results ?? []).slice(0, MOST_OFFERED) : [];
  const showResults = hasFocus && query.trim().length >= SHORTEST_QUERY && data !== undefined;

  const handleSelect = (school: SchoolListItem) => {
    onSelect(school);
    setQuery('');
  };

  return (
    <div>
      {/* The input carries this text as its label; cmdk sets the input's own id */}
      <p aria-hidden="true" className="mb-1 text-sm font-medium">
        {LABEL}
      </p>
      <Command
        shouldFilter={false}
        className="relative overflow-visible rounded-md border [&_[cmdk-input-wrapper]]:border-b-0"
      >
        <CommandInput
          aria-label={LABEL}
          placeholder="School name"
          value={query}
          onValueChange={setQuery}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
        />
        <CommandList
          // Keeps focus in the field so a click on a school lands before the list closes
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            'absolute inset-x-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-md',
            !showResults && 'hidden'
          )}
        >
          {showResults && schools.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">No schools found.</p>
          )}
          {showResults && schools.length > 0 && (
            <CommandGroup>
              {schools.map((school) => {
                const ranked = isRanked(school);
                const place = [school.city, school.grades_served && formatGrades(school.grades_served)]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <CommandItem
                    key={school.rcdts}
                    value={school.rcdts}
                    disabled={!ranked}
                    onSelect={() => handleSelect(school)}
                    className="justify-between"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{school.display_name}</span>
                      <span className="text-sm text-muted-foreground">{place}</span>
                    </span>
                    {!ranked && <span className="text-sm text-muted-foreground">Not ranked</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
