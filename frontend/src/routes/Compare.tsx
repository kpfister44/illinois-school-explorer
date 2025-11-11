// ABOUTME: School comparison page component
// ABOUTME: Displays side-by-side comparison of multiple schools

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import { useCompare } from '@/lib/api/queries';
import { useToast } from '@/hooks/use-toast';
import ComparisonView from '@/components/ComparisonView';

export default function Compare() {
  const { comparisonList } = useComparison();
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useCompare(comparisonList);

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load Comparison',
        description:
          error instanceof Error ? error.message : 'Unable to load school comparison',
      });
    }
  }, [isError, error, toast]);

  if (comparisonList.length === 0) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Schools Selected</AlertTitle>
          <AlertDescription>
            Search for schools and add them to your comparison list to get started.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Search Schools</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (comparisonList.length === 1) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Enough Schools</AlertTitle>
          <AlertDescription>
            Select at least 2 schools to compare. You currently have 1 school selected.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Search Schools</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (comparisonList.length > 5) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Too Many Schools</AlertTitle>
          <AlertDescription>Select up to 5 schools for comparison.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 space-y-6">
        <h2 className="text-2xl font-bold">Compare Schools</h2>
        <p className="text-muted-foreground">Loading comparison...</p>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load comparison. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.schools.length === 0) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No schools found for comparison.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Compare Schools</h2>
        <p className="text-muted-foreground">
          Comparing {data.schools.length} school{data.schools.length > 1 ? 's' : ''}
        </p>
      </div>
      <ComparisonView schools={data.schools} />
    </div>
  );
}
