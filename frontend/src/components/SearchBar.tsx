// ABOUTME: SearchBar component with autocomplete functionality
// ABOUTME: Enter opens the results list; suggested schools open in a list over the page while the field has focus

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { searchSchools } from '@/lib/api/queries';
import { listPath } from '@/lib/schoolList';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultQuery?: string;
}

const SHORTEST_QUERY = 2;

export default function SearchBar({ defaultQuery = '' }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [hasFocus, setHasFocus] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const typedQuery = searchQuery.trim();
  const canSearch = typedQuery.length >= SHORTEST_QUERY;
  const shouldSuggest = debouncedQuery.length >= SHORTEST_QUERY;

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchSchools(debouncedQuery, 10),
    enabled: shouldSuggest,
  });

  const handleSelectSchool = (rcdts: string) => {
    navigate(`/school/${rcdts}`);
    setSearchQuery('');
  };

  const handleSeeAllResults = () => {
    navigate(listPath({ q: typedQuery }));
    setHasFocus(false);
  };

  const hasNoMatches = shouldSuggest && !isLoading && data && data.results.length === 0;
  const hasMatches = shouldSuggest && data && data.results.length > 0;
  const showResults = hasFocus && canSearch;

  return (
    <Command className="relative overflow-visible rounded-lg border shadow-md [&_[cmdk-input-wrapper]]:border-b-0">
      <CommandInput
        placeholder="School, city or district"
        value={searchQuery}
        onValueChange={setSearchQuery}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
      />
      <CommandList
        // Keeps focus in the field so a click on a result lands before the list closes
        onMouseDown={(event) => event.preventDefault()}
        className={cn(
          'absolute inset-x-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-md',
          !showResults && 'hidden'
        )}
      >
        {showResults && (
          <CommandGroup>
            {/* First in the list, so it is the item Enter chooses */}
            <CommandItem value={`${typedQuery} all results`} onSelect={handleSeeAllResults}>
              <span className="font-medium">See all results for “{typedQuery}”</span>
            </CommandItem>
          </CommandGroup>
        )}
        {showResults && hasNoMatches && (
          <p className="px-3 py-3 text-sm text-muted-foreground">No schools found.</p>
        )}
        {showResults && hasMatches && (
          <CommandGroup heading="Schools">
            {data.results.map((school) => (
              <CommandItem
                key={school.rcdts}
                value={`${school.school_name} ${school.city ?? ''} ${school.district ?? ''}`.trim()}
                onSelect={() => handleSelectSchool(school.rcdts)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{school.school_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {school.city}
                    {school.district && ` • ${school.district}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
