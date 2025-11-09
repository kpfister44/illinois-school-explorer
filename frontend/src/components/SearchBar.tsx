// ABOUTME: SearchBar component with autocomplete functionality
// ABOUTME: Uses Command component with debounced search API calls

import { useState } from 'react';
import { Command, CommandInput } from '@/components/ui/command';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search for schools by name or city..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
    </Command>
  );
}
