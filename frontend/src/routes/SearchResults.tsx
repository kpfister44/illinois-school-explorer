// ABOUTME: SearchResults page component
// ABOUTME: Displays search results with SearchBar and SchoolCard list

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import SchoolCard from '@/components/SchoolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { searchSchools } from '@/lib/api/queries';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchSchools(query, 50),
    enabled: query.length >= 2,
  });

  const renderErrorMessage = () => {
    if (!isError) {
      return null;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    return (
      <div className="text-center text-destructive">
        <p>Error loading search results: {message}</p>
      </div>
    );
  };

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <SearchBar />
      </div>

      <div className="max-w-4xl mx-auto">
        {query.length < 2 && (
          <p className="text-center text-muted-foreground">
            Enter at least 2 characters to search
          </p>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        )}

        {renderErrorMessage()}

        {data && data.results.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No schools found</p>
            <p className="text-sm">Try searching by school name or city</p>
          </div>
        )}

        {data && data.results.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Found {data.total} {data.total === 1 ? 'school' : 'schools'}
            </p>
            <div className="space-y-4">
              {data.results.map((school) => (
                <SchoolCard key={school.rcdts} school={school} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
