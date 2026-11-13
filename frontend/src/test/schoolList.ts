// ABOUTME: Sample school list rows and places for tests
// ABOUTME: Real figures for schools in Elk Grove Village and Township HSD 214

import type { CitySummary, DistrictSummary, SchoolListItem } from '@/lib/api/types';

export const ELK_GROVE_HIGH: SchoolListItem = {
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  display_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  county: 'Cook',
  district: 'Township HSD 214',
  district_id: '05-016-2140-17',
  level: 'high',
  grades_served: '9 - 12',
  enrollment: 1721,
  low_income_percentage: 35.2,
  designation: 'Approaching Exemplary',
  assessment: 'act',
  score: 18.1,
};

export const CLEARMONT_ELEMENTARY: SchoolListItem = {
  rcdts: '05-016-0590-04-2003',
  school_name: 'Clearmont Elem School',
  display_name: 'Clearmont Elementary School',
  city: 'Elk Grove Village',
  county: 'Cook',
  district: 'Comm Cons SD 59',
  district_id: '05-016-0590-04',
  level: 'elementary',
  grades_served: 'K - 5',
  enrollment: 388,
  low_income_percentage: 30.4,
  designation: 'Commendable',
  assessment: 'iar',
  score: 56.6,
};

export const SCHOOL_WITHOUT_FIGURES: SchoolListItem = {
  rcdts: '33-048-2760-26-2002',
  school_name: 'Avon Elem School',
  display_name: 'Avon Elementary School',
  city: 'Avon',
  county: 'Fulton',
  district: null,
  district_id: '33-048-2760-26',
  level: 'elementary',
  grades_served: null,
  enrollment: null,
  low_income_percentage: null,
  designation: null,
  assessment: 'iar',
  score: null,
};

export function listItem(overrides: Partial<SchoolListItem>): SchoolListItem {
  return { ...ELK_GROVE_HIGH, ...overrides };
}

export const DISTRICTS: DistrictSummary[] = [
  { id: '05-016-0590-04', name: 'Comm Cons SD 59', county: 'Cook', school_count: 14 },
  { id: '41-057-0070-26', name: 'Edwardsville CUSD 7', county: 'Madison', school_count: 13 },
  { id: '05-016-2140-17', name: 'Township HSD 214', county: 'Cook', school_count: 6 },
];

export const CITIES: CitySummary[] = [
  { name: 'Edwardsville', school_count: 9 },
  { name: 'Elk Grove Village', school_count: 10 },
  { name: 'Avon', school_count: 1 },
];
