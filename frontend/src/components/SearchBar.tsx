// ABOUTME: SearchBar component with autocomplete functionality
// ABOUTME: Uses Command component with debounced search API calls

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { searchSchools } from '@/lib/api/queries';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const shouldSearch = debouncedQuery.length >= 2;

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchSchools(debouncedQuery, 10),
    enabled: shouldSearch,
  });

  const handleSelectSchool = (rcdts: string) => {
    navigate(`/school/${rcdts}`);
    setSearchQuery('');
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search for schools by name or city..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {shouldSearch && !isLoading && data && data.results.length === 0 && (
          <CommandEmpty>No schools found.</CommandEmpty>
        )}
        {shouldSearch && data && data.results.length > 0 && (
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
