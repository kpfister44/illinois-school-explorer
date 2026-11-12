// ABOUTME: TanStack Query hooks for backend API
// ABOUTME: Provides hooks for search, school detail, comparison, stats and benchmarks

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  SearchResponse,
  SchoolDetail,
  CompareResponse,
  Assessment,
  BenchmarkedMetric,
  BenchmarkLevel,
  SchoolLevel,
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
export const topScoresQueryKey = (assessment: Assessment, level: SchoolLevel, limit: number) => [
  'top-scores',
  assessment,
  level,
  limit,
];

export async function getTopScores(params: {
  assessment: Assessment;
  level: SchoolLevel;
  limit?: number;
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
