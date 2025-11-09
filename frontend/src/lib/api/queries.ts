// ABOUTME: TanStack Query hooks for backend API
// ABOUTME: Provides useSearch, useSchoolDetail, and useCompare hooks

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { SearchResponse, SchoolDetail, CompareResponse } from './types';

export const searchSchools = async (query: string, limit: number = 10): Promise<SearchResponse> => {
  const { data } = await apiClient.get<SearchResponse>('/api/search', {
    params: { q: query, limit },
  });
  return data;
};

// Query key factories for consistent caching
export const searchQueryKey = (query: string, limit: number) => ['search', query, limit];
export const schoolDetailQueryKey = (rcdts: string) => ['school', rcdts];
export const compareQueryKey = (rcdtsList: string[]) => ['compare', rcdtsList.join(',')];

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
