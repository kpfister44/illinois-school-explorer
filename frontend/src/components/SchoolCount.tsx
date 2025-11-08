// ABOUTME: Component that displays total count of schools in database
// ABOUTME: Demonstrates API client usage with loading and error states

import { useSearch } from '@/lib/api/queries';

export default function SchoolCount() {
  const { data, isLoading, isError } = useSearch('a', 1);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading school count...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load school count</p>;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {data?.total.toLocaleString()} schools available
    </p>
  );
}
