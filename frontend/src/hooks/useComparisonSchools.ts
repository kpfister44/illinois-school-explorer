// ABOUTME: Hook to fetch school data for comparison list
// ABOUTME: Returns School objects for all RCDTS codes in comparison

import { useQueries } from '@tanstack/react-query';
import { useComparison } from '@/contexts/ComparisonContext';
import { getSchoolDetail, schoolDetailQueryKey } from '@/lib/api/queries';
import type { School } from '@/lib/api/types';

function buildPlaceholder(rcdts: string, label: string, id: number): School {
  return {
    id,
    rcdts,
    school_name: label,
    city: '',
    district: null,
    school_type: null,
  };
}

export function useComparisonSchools(): School[] {
  const { comparisonList } = useComparison();

  const schoolQueries = useQueries({
    queries: comparisonList.map((rcdts) => ({
      queryKey: schoolDetailQueryKey(rcdts),
      queryFn: () => getSchoolDetail(rcdts),
      staleTime: 10 * 60 * 1000,
    })),
  });

  return comparisonList.map((rcdts, index) => {
    const query = schoolQueries[index];

    if (query?.data) {
      const detail = query.data;
      return {
        id: detail.id,
        rcdts: detail.rcdts,
        school_name: detail.school_name,
        city: detail.city,
        district: detail.district,
        school_type: detail.school_type,
      };
    }

    if (query?.isError) {
      return buildPlaceholder(rcdts, 'School unavailable', -2);
    }

    return buildPlaceholder(rcdts, 'Loading...', -1);
  });
}
