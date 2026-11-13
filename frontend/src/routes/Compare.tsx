// ABOUTME: School comparison page component
// ABOUTME: Compares the schools named in its URL, which the remembered comparison list follows

import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import { useCompare } from '@/lib/api/queries';
import { comparePath, readCompareList } from '@/lib/compareList';
import { useToast } from '@/hooks/use-toast';
import ComparisonView from '@/components/ComparisonView';
import SelectedSchoolList from '@/components/SelectedSchoolList';
import { useComparisonSchools } from '@/hooks/useComparisonSchools';

interface ComparisonProps {
  rcdtsList: string[];
  onRemove: (rcdts: string) => void;
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((rcdts, index) => rcdts === b[index]);
}

function SearchSchoolsButton() {
  return (
    <div className="mt-4">
      <Button asChild>
        <Link to="/">Search Schools</Link>
      </Button>
    </div>
  );
}

function Comparison({ rcdtsList, onRemove }: ComparisonProps) {
  const { toast } = useToast();
  const lone = useComparisonSchools();

  const { data, isLoading, isError, error } = useCompare(rcdtsList);

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

  if (rcdtsList.length === 0) {
    return (
      <div className="max-w-4xl">
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Schools Selected</AlertTitle>
          <AlertDescription>
            Search for schools and add them to your comparison list to get started.
          </AlertDescription>
        </Alert>
        <SearchSchoolsButton />
      </div>
    );
  }

  if (rcdtsList.length === 1) {
    return (
      <div className="max-w-4xl space-y-4">
        <SelectedSchoolList schools={lone} onRemove={onRemove} />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Enough Schools</AlertTitle>
          <AlertDescription>
            Select at least 2 schools to compare. You currently have 1 school selected.
          </AlertDescription>
        </Alert>
        <SearchSchoolsButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading comparison...</p>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl">
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
      <div className="max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No schools found for comparison.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ComparisonView schools={data.schools} onRemove={onRemove} />;
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { comparisonList, replaceComparison } = useComparison();

  const fromUrl = readCompareList(searchParams);
  const rcdtsList = fromUrl ?? comparisonList;

  // The URL leads: a list in it becomes the remembered list, and a URL with none shows the remembered one
  useEffect(() => {
    if (fromUrl === null) {
      if (comparisonList.length > 0) {
        navigate(comparePath(comparisonList), { replace: true });
      }
    } else if (!sameList(fromUrl, comparisonList)) {
      replaceComparison(fromUrl);
    }
  }, [fromUrl, comparisonList, navigate, replaceComparison]);

  const showList = (list: string[]) => navigate(comparePath(list));
  const remove = (rcdts: string) => showList(rcdtsList.filter((code) => code !== rcdts));

  return (
    <div className="space-y-6 py-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium leading-tight lg:text-4xl">Compare schools</h1>
          {rcdtsList.length > 0 && (
            <p className="text-muted-foreground">
              {rcdtsList.length} {rcdtsList.length === 1 ? 'school' : 'schools'} selected
            </p>
          )}
        </div>
        {rcdtsList.length > 0 && (
          <Button variant="outline" onClick={() => showList([])}>
            Clear All
          </Button>
        )}
      </header>
      <Comparison rcdtsList={rcdtsList} onRemove={remove} />
    </div>
  );
}
