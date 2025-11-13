// ABOUTME: TypeScript types for backend API responses
// ABOUTME: Matches Pydantic models from FastAPI backend

export interface School {
  id: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  school_type: string | null;
}

export interface SearchResponse {
  results: School[];
  total: number;
}

export interface ACTScores {
  ela_avg: number | null;
  math_avg: number | null;
  science_avg: number | null;
  overall_avg: number | null;
}

export interface Demographics {
  el_percentage: number | null;
  low_income_percentage: number | null;
}

export interface Diversity {
  white: number | null;
  black: number | null;
  hispanic: number | null;
  asian: number | null;
  pacific_islander: number | null;
  native_american: number | null;
  two_or_more: number | null;
  mena: number | null;
}

export interface TrendWindow {
  one_year: number | null;
  three_year: number | null;
  five_year: number | null;
}

export interface TrendMetrics {
  enrollment?: TrendWindow;
  act_ela?: TrendWindow;
  act_math?: TrendWindow;
  act_science?: TrendWindow;
  act_overall?: TrendWindow;
  el_percentage?: TrendWindow;
  low_income_percentage?: TrendWindow;
  white?: TrendWindow;
  black?: TrendWindow;
  hispanic?: TrendWindow;
  asian?: TrendWindow;
  pacific_islander?: TrendWindow;
  native_american?: TrendWindow;
  two_or_more?: TrendWindow;
  mena?: TrendWindow;
}

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores;
  demographics: Demographics;
  diversity: Diversity;
  trends?: TrendMetrics;
}

export interface SchoolDetail extends School {
  county: string | null;
  grades_served: string | null;
  metrics: SchoolMetrics;
}

export interface CompareResponse {
  schools: SchoolDetail[];
}

export type Assessment = 'act' | 'iar';
export type SchoolLevel = 'high' | 'middle' | 'elementary';

export interface TopScoreEntry {
  rank: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  school_type: string | null;
  level: SchoolLevel;
  enrollment: number | null;
  score: number;
  act_ela_avg?: number | null;
  act_math_avg?: number | null;
}

export interface TopScoresResponse {
  results: TopScoreEntry[];
}
