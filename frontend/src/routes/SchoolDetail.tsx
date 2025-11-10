// ABOUTME: School detail page component
// ABOUTME: Fetches and displays full information for a school

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import SchoolDetailView from '@/components/SchoolDetailView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getSchoolDetail } from '@/lib/api/queries';
import { useToast } from '@/hooks/use-toast';

export default function SchoolDetail() {
  const { rcdts } = useParams<{ rcdts: string }>();
  const { toast } = useToast();

  const { data: school, isLoading, isError, error } = useQuery({
    queryKey: ['school', rcdts],
    queryFn: () => getSchoolDetail(rcdts!),
    enabled: !!rcdts,
  });

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load School',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to load school details',
      });
    }
  }, [isError, error, toast]);

  if (isLoading) {
    return (
      <div className="py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-64" />
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
            {error instanceof Error ? error.message : 'Failed to load school details'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>School not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <SchoolDetailView school={school} />
    </div>
  );
}
