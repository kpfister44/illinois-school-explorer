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

export interface StatsResponse {
  schools: number;
  districts: number;
  cities: number;
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
  ten_year: number | null;
  fifteen_year: number | null;
}

export interface TrendMetrics {
  enrollment?: TrendWindow;
  act?: TrendWindow;
  iar?: TrendWindow;
  iar_ela?: TrendWindow;
  iar_math?: TrendWindow;
  el?: TrendWindow;
  low_income?: TrendWindow;
  white?: TrendWindow;
  black?: TrendWindow;
  hispanic?: TrendWindow;
  asian?: TrendWindow;
  pacific_islander?: TrendWindow;
  native_american?: TrendWindow;
  two_or_more?: TrendWindow;
  mena?: TrendWindow;
}

export interface HistoricalYearlyData {
  yr_2026?: number | null;
  yr_2025?: number | null;
  yr_2024?: number | null;
  yr_2023?: number | null;
  yr_2022?: number | null;
  yr_2021?: number | null;
  yr_2020?: number | null;
  yr_2019?: number | null;
  yr_2018?: number | null;
  yr_2017?: number | null;
  yr_2016?: number | null;
  yr_2015?: number | null;
  yr_2014?: number | null;
  yr_2013?: number | null;
  yr_2012?: number | null;
  yr_2011?: number | null;
  yr_2010?: number | null;
}

export interface HistoricalMetrics {
  enrollment?: HistoricalYearlyData;
  act?: HistoricalYearlyData;
  act_ela?: HistoricalYearlyData;
  act_math?: HistoricalYearlyData;
  act_science?: HistoricalYearlyData;
  iar?: HistoricalYearlyData;
  iar_ela?: HistoricalYearlyData;
  iar_math?: HistoricalYearlyData;
  el?: HistoricalYearlyData;
  low_income?: HistoricalYearlyData;
  white?: HistoricalYearlyData;
  black?: HistoricalYearlyData;
  hispanic?: HistoricalYearlyData;
  asian?: HistoricalYearlyData;
  pacific_islander?: HistoricalYearlyData;
  native_american?: HistoricalYearlyData;
  two_or_more?: HistoricalYearlyData;
  mena?: HistoricalYearlyData;
}

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores | null;
  iar_ela_proficiency_pct: number | null;
  iar_math_proficiency_pct: number | null;
  iar_overall_proficiency_pct: number | null;
  demographics: Demographics;
  diversity: Diversity;
  trends?: TrendMetrics;
  historical?: HistoricalMetrics;
}

export type Designation =
  | 'Exemplary'
  | 'Approaching Exemplary'
  | 'Commendable'
  | 'Developing'
  | 'Comprehensive'
  | 'Dually Designated';

export type Assessment = 'act' | 'iar';
export type SchoolLevel = 'high' | 'middle' | 'elementary';
export type BenchmarkedMetric = Assessment | 'el' | 'low_income';
export type BenchmarkLevel = SchoolLevel | 'other';

export interface MetricBenchmark {
  level: BenchmarkLevel;
  state_average: number;
  state_schools: number;
  district_average: number | null;
  district_schools: number;
  percentile: number | null;
  similar_average: number | null;
}

export type SchoolBenchmarks = Record<BenchmarkedMetric, MetricBenchmark | null>;

export interface SchoolDetail extends School {
  display_name: string;
  county: string | null;
  grades_served: string | null;
  designation: Designation | null;
  metrics: SchoolMetrics;
  benchmarks?: SchoolBenchmarks | null;
}

export interface SimilarSchool {
  rcdts: string;
  school_name: string;
  display_name: string;
  city: string;
  district: string | null;
  enrollment: number;
  low_income_percentage: number;
  el_percentage: number | null;
  score: number;
}

export interface SimilarSchoolsResponse {
  assessment: Assessment;
  level: BenchmarkLevel;
  average: number | null;
  schools: SimilarSchool[];
}

export interface StateYearAverage {
  year: number;
  average: number;
  schools: number;
}

export interface StateBenchmark {
  metric: BenchmarkedMetric;
  level: BenchmarkLevel;
  schools: number;
  band_low: number | null;
  band_high: number | null;
  years: StateYearAverage[];
}

export interface CompareResponse {
  schools: SchoolDetail[];
}

export interface TopScoreEntry {
  rank: number;
  rcdts: string;
  school_name: string;
  display_name: string;
  city: string;
  county: string | null;
  district: string | null;
  district_id: string;
  school_type: string | null;
  level: SchoolLevel;
  enrollment: number | null;
  low_income_percentage: number | null;
  designation: Designation | null;
  score: number;
  act_ela_avg?: number | null;
  act_math_avg?: number | null;
}

export interface TopScoresResponse {
  results: TopScoreEntry[];
  total: number;
  school: TopScoreEntry | null;
}

export interface SchoolListItem {
  rcdts: string;
  school_name: string;
  display_name: string;
  city: string;
  county: string | null;
  district: string | null;
  district_id: string;
  level: BenchmarkLevel;
  grades_served: string | null;
  enrollment: number | null;
  low_income_percentage: number | null;
  designation: Designation | null;
  assessment: Assessment;
  score: number | null;
}

export interface SchoolListResponse {
  results: SchoolListItem[];
  total: number;
}

export interface DistrictLevel {
  level: BenchmarkLevel;
  assessment: Assessment;
  state_average: number | null;
  district_average: number | null;
  schools: SchoolListItem[];
}

export interface DistrictDetail {
  id: string;
  name: string | null;
  county: string | null;
  school_count: number;
  enrollment: number;
  levels: DistrictLevel[];
}

export interface DistrictSummary {
  id: string;
  name: string | null;
  county: string | null;
  school_count: number;
}

export interface DistrictListResponse {
  districts: DistrictSummary[];
}

export interface CitySummary {
  name: string;
  school_count: number;
}

export interface CityListResponse {
  cities: CitySummary[];
}
