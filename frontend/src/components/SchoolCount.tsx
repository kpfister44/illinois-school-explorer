// ABOUTME: Component that displays total count of schools in database
// ABOUTME: Reads the count from the stats endpoint, with loading and error states

import { useStats } from '@/lib/api/queries';

export default function SchoolCount() {
  const { data, isLoading, isError } = useStats();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading school count...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load school count</p>;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {data?.schools.toLocaleString()} schools available
    </p>
  );
}
