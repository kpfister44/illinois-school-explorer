// ABOUTME: The school list's filters and sort, as they travel through the URL and to the API
// ABOUTME: Reads and writes the results page's query string and names the sorts on offer

import type { BenchmarkLevel } from '@/lib/api/types';

export type ListSort = 'name' | 'score' | 'enrollment';

export interface SchoolListFilters {
  q?: string;
  level?: BenchmarkLevel;
  county?: string;
  district?: string;
  city?: string;
  designation?: string;
  enrollment_min?: number;
  enrollment_max?: number;
  low_income_min?: number;
  low_income_max?: number;
  sort?: ListSort;
}

const TEXT_FILTERS = ['q', 'county', 'district', 'city', 'designation'] as const;
const NUMBER_FILTERS = [
  'enrollment_min',
  'enrollment_max',
  'low_income_min',
  'low_income_max',
] as const;
// The filters set in the filter form. The search, level, city and sort are set elsewhere.
export const FORM_FILTERS = ['county', 'district', 'designation', ...NUMBER_FILTERS] as const;

const LEVELS: BenchmarkLevel[] = ['elementary', 'middle', 'high', 'other'];
const SORTS: ListSort[] = ['name', 'score', 'enrollment'];
const SORT_ORDERS: Record<ListSort, 'asc' | 'desc'> = {
  name: 'asc',
  score: 'desc',
  enrollment: 'desc',
};

const URL_ORDER: (keyof SchoolListFilters)[] = [
  'q',
  'level',
  'county',
  'district',
  'city',
  'designation',
  ...NUMBER_FILTERS,
  'sort',
];

export const LIST_PATH = '/search';

// Levels take different tests, so scores only sort within one level
function usableSort(sort: ListSort | undefined, level: BenchmarkLevel | undefined) {
  return sort === 'score' && level === undefined ? undefined : sort;
}

export function readFilters(params: URLSearchParams): SchoolListFilters {
  const filters: SchoolListFilters = {};

  for (const name of TEXT_FILTERS) {
    const value = params.get(name)?.trim();
    if (value) {
      filters[name] = value;
    }
  }
  for (const name of NUMBER_FILTERS) {
    const value = params.get(name)?.trim();
    if (value && Number.isFinite(Number(value))) {
      filters[name] = Number(value);
    }
  }

  const level = params.get('level') as BenchmarkLevel | null;
  if (level && LEVELS.includes(level)) {
    filters.level = level;
  }
  const sort = params.get('sort') as ListSort | null;
  if (sort && SORTS.includes(sort) && usableSort(sort, filters.level)) {
    filters.sort = sort;
  }

  return filters;
}

export function listPath(filters: SchoolListFilters): string {
  const params = new URLSearchParams();
  const written = { ...filters, sort: usableSort(filters.sort, filters.level) };

  for (const name of URL_ORDER) {
    const value = written[name];
    if (value !== undefined && value !== '') {
      params.set(name, String(value));
    }
  }

  const query = params.toString();
  return query ? `${LIST_PATH}?${query}` : LIST_PATH;
}

export function apiParams(filters: SchoolListFilters) {
  return filters.sort ? { ...filters, order: SORT_ORDERS[filters.sort] } : { ...filters };
}

export interface SortChoice {
  value: ListSort | 'match';
  label: string;
  filters: SchoolListFilters;
  current: boolean;
}

export function sortChoices(filters: SchoolListFilters): SortChoice[] {
  const isSearch = filters.q !== undefined;
  const offered: { value: ListSort | 'match'; label: string }[] = [
    ...(isSearch ? [{ value: 'match' as const, label: 'Best match' }] : []),
    { value: 'name', label: 'Name' },
    ...(filters.level ? [{ value: 'score' as const, label: 'Highest score' }] : []),
    { value: 'enrollment', label: 'Most students' },
  ];
  const inUse = filters.sort ?? (isSearch ? 'match' : 'name');

  return offered.map(({ value, label }) => ({
    value,
    label,
    filters: { ...filters, sort: value === 'match' || (value === 'name' && !isSearch) ? undefined : value },
    current: value === inUse,
  }));
}

export function districtId(rcdts: string): string {
  return rcdts.slice(0, 14);
}
