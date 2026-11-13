// ABOUTME: A sample Top scores entry for tests
// ABOUTME: Real 2026 figures for Elk Grove High School, with a made-up rank

import type { TopScoreEntry } from '@/lib/api/types';

export const TOP_SCORE_ENTRY: TopScoreEntry = {
  rank: 7,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  display_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  county: 'Cook',
  district: 'Township HSD 214',
  district_id: '05-016-2140-17',
  school_type: 'High School',
  level: 'high',
  enrollment: 1721,
  low_income_percentage: 35.2,
  designation: 'Approaching Exemplary',
  score: 18.1,
  act_ela_avg: 17.6,
  act_math_avg: 18.6,
};
