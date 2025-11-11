// ABOUTME: Hook to fetch school data for comparison list
// ABOUTME: Returns School objects for all RCDTS codes in comparison

import { useQueries } from '@tanstack/react-query';
import { useComparison } from '@/contexts/ComparisonContext';
import { getSchoolDetail, schoolDetailQueryKey } from '@/lib/api/queries';
import type { School } from '@/lib/api/types';

export function useComparisonSchools(): School[] {
  const { comparisonList } = useComparison();

  const schoolQueries = useQueries({
    queries: comparisonList.map((rcdts) => ({
      queryKey: schoolDetailQueryKey(rcdts),
      queryFn: () => getSchoolDetail(rcdts),
      staleTime: 10 * 60 * 1000,
    })),
  });

  return schoolQueries
    .map((query) => {
      if (!query.data) {
        return null;
      }

      const detail = query.data;
      const school: School = {
        id: detail.id,
        rcdts: detail.rcdts,
        school_name: detail.school_name,
        city: detail.city,
        district: detail.district,
        school_type: detail.school_type,
      };

      return school;
    })
    .filter((school): school is School => Boolean(school));
}
