// ABOUTME: TanStack Query hooks for backend API
// ABOUTME: Provides hooks for search, school lists, school detail, districts, comparison, stats and benchmarks

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiParams, type SchoolListFilters } from '@/lib/schoolList';
import type { TopScoresView } from '@/lib/topScores';
import { apiClient } from './client';
import type {
  SearchResponse,
  SchoolDetail,
  CompareResponse,
  Assessment,
  BenchmarkedMetric,
  BenchmarkLevel,
  CityListResponse,
  DistrictDetail,
  DistrictListResponse,
  SchoolLevel,
  SchoolListResponse,
  SimilarSchoolsResponse,
  StateBenchmark,
  StatsResponse,
  TopScoresResponse,
} from './types';

export const searchSchools = async (query: string, limit: number = 10): Promise<SearchResponse> => {
  const { data } = await apiClient.get<SearchResponse>('/api/search', {
    params: { q: query, limit },
  });
  return data;
};

export async function getSchoolDetail(rcdts: string): Promise<SchoolDetail> {
  const { data } = await apiClient.get<SchoolDetail>(`/api/schools/${rcdts}`);
  return data;
}

// Query key factories for consistent caching
export const searchQueryKey = (query: string, limit: number) => ['search', query, limit];
export const schoolDetailQueryKey = (rcdts: string) => ['school', rcdts];
export const compareQueryKey = (rcdtsList: string[]) => ['compare', rcdtsList.join(',')];
export const statsQueryKey = () => ['stats'];
export const stateBenchmarkQueryKey = (metric: BenchmarkedMetric, level: BenchmarkLevel) => [
  'state-benchmark',
  metric,
  level,
];
export const similarSchoolsQueryKey = (rcdts: string, assessment: Assessment) => [
  'similar-schools',
  rcdts,
  assessment,
];
export const topScoresQueryKey = (view: TopScoresView) => ['top-scores', view];

export const schoolListQueryKey = (filters: SchoolListFilters) => ['schools', filters];
export const districtQueryKey = (id: string) => ['district', id];
export const districtsQueryKey = () => ['districts'];
export const citiesQueryKey = () => ['cities'];

export const SCHOOL_LIST_PAGE_SIZE = 25;

export async function getSchools(
  filters: SchoolListFilters,
  offset: number
): Promise<SchoolListResponse> {
  const { data } = await apiClient.get<SchoolListResponse>('/api/schools', {
    params: { ...apiParams(filters), limit: SCHOOL_LIST_PAGE_SIZE, offset },
  });
  return data;
}

export async function getTopScores(params: {
  assessment: Assessment;
  level: SchoolLevel;
  limit?: number;
  county?: string;
  district?: string;
  school?: string;
}): Promise<TopScoresResponse> {
  const { data } = await apiClient.get<TopScoresResponse>('/api/top-scores', {
    params: { limit: 100, ...params },
  });
  return data;
}

// Search schools by name or city
export const useSearch = (query: string, limit: number = 10, enabled?: boolean) => {
  return useQuery({
    queryKey: searchQueryKey(query, limit),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchResponse>('/api/search', {
        params: { q: query, limit },
      });
      return data;
    },
    enabled: enabled !== undefined ? enabled : query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get school details by RCDTS
export const useSchoolDetail = (rcdts: string) => {
  return useQuery({
    queryKey: schoolDetailQueryKey(rcdts),
    queryFn: async () => {
      const { data } = await apiClient.get<SchoolDetail>(`/api/schools/${rcdts}`);
      return data;
    },
    enabled: !!rcdts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Compare multiple schools
export const useCompare = (rcdtsList: string[]) => {
  return useQuery({
    queryKey: compareQueryKey(rcdtsList),
    queryFn: async () => {
      const { data } = await apiClient.get<CompareResponse>('/api/schools/compare', {
        params: { rcdts: rcdtsList.join(',') },
      });
      return data;
    },
    enabled: rcdtsList.length >= 2 && rcdtsList.length <= 5,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Count the schools, districts and cities in the database
export const useStats = () => {
  return useQuery({
    queryKey: statsQueryKey(),
    queryFn: async () => {
      const { data } = await apiClient.get<StatsResponse>('/api/stats');
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// A metric's state average by year and the band where most schools of a level fall
export const useStateBenchmark = (metric: BenchmarkedMetric, level: BenchmarkLevel | undefined) => {
  return useQuery({
    queryKey: stateBenchmarkQueryKey(metric, level ?? 'other'),
    queryFn: async () => {
      const { data } = await apiClient.get<StateBenchmark>('/api/benchmarks/state', {
        params: { metric, level },
      });
      return data;
    },
    enabled: level !== undefined,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// The 25 schools most like a school in income, English learners and size
export const useSimilarSchools = (rcdts: string, assessment: Assessment, enabled: boolean) => {
  return useQuery({
    queryKey: similarSchoolsQueryKey(rcdts, assessment),
    queryFn: async () => {
      const { data } = await apiClient.get<SimilarSchoolsResponse>(
        `/api/schools/${rcdts}/similar`,
        { params: { assessment } }
      );
      return data;
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// A filtered list of schools, loaded a page at a time
export const useSchoolList = (filters: SchoolListFilters) => {
  return useInfiniteQuery({
    queryKey: schoolListQueryKey(filters),
    queryFn: ({ pageParam }) => getSchools(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.results.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// A district's summary and its schools by level
export const useDistrict = (id: string) => {
  return useQuery({
    queryKey: districtQueryKey(id),
    queryFn: async () => {
      const { data } = await apiClient.get<DistrictDetail>(`/api/districts/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Every district with its county and number of schools
export const useDistricts = () => {
  return useQuery({
    queryKey: districtsQueryKey(),
    queryFn: async () => {
      const { data } = await apiClient.get<DistrictListResponse>('/api/districts');
      return data.districts;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Every city and town with its number of schools
export const useCities = () => {
  return useQuery({
    queryKey: citiesQueryKey(),
    queryFn: async () => {
      const { data } = await apiClient.get<CityListResponse>('/api/cities');
      return data.cities;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
