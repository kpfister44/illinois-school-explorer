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

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores;
  demographics: Demographics;
  diversity: Diversity;
}

export interface SchoolDetail extends School {
  county: string | null;
  grades_served: string | null;
  metrics: SchoolMetrics;
}

export interface CompareResponse {
  schools: SchoolDetail[];
}
