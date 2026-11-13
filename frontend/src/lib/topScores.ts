// ABOUTME: The Top scores view as it travels through the URL: level, region and a looked-up school
// ABOUTME: Names the levels ranked and each one's test, and words a ranked school's enrollment, income and ACT subjects

import type { Assessment, TopScoreEntry } from '@/lib/api/types';
import { formatMetric } from '@/lib/format';

export type RankedLevel = 'high' | 'middle' | 'elementary';

export interface TopScoresView {
  level: RankedLevel;
  county?: string;
  district?: string;
  school?: string;
}

export const RANKED_LEVELS: { level: RankedLevel; assessment: Assessment; label: string }[] = [
  { level: 'high', assessment: 'act', label: 'High School ACT' },
  { level: 'middle', assessment: 'iar', label: 'Middle School IAR' },
  { level: 'elementary', assessment: 'iar', label: 'Elementary IAR' },
];

export const TOP_SCORES_PATH = '/top-scores';

const DEFAULT_LEVEL: RankedLevel = 'high';
const TEXT_PARTS = ['county', 'district', 'school'] as const;

export function isRankedLevel(level: string): level is RankedLevel {
  return RANKED_LEVELS.some((ranked) => ranked.level === level);
}

export function rankedAssessment(level: RankedLevel): Assessment {
  return RANKED_LEVELS.find((ranked) => ranked.level === level)!.assessment;
}

export function readTopScoresView(params: URLSearchParams): TopScoresView {
  const level = params.get('level');
  const view: TopScoresView = { level: level && isRankedLevel(level) ? level : DEFAULT_LEVEL };

  for (const part of TEXT_PARTS) {
    const value = params.get(part)?.trim();
    if (value) {
      view[part] = value;
    }
  }
  return view;
}

export function topScoresPath(view: TopScoresView): string {
  const params = new URLSearchParams();
  if (view.level !== DEFAULT_LEVEL) {
    params.set('level', view.level);
  }
  for (const part of TEXT_PARTS) {
    const value = view[part];
    if (value) {
      params.set(part, value);
    }
  }

  const query = params.toString();
  return query ? `${TOP_SCORES_PATH}?${query}` : TOP_SCORES_PATH;
}

export function enrollmentText(enrollment: number | null): string {
  return enrollment === null
    ? 'Enrollment not reported'
    : `${formatMetric(enrollment, 'count')} students`;
}

export function lowIncomeText(share: number | null): string {
  return share === null ? 'Low income not reported' : `${formatMetric(share, 'percentage')} low income`;
}

export function actBreakdown(entry: TopScoreEntry): string | undefined {
  if (entry.act_ela_avg == null || entry.act_math_avg == null) {
    return undefined;
  }
  return `ELA ${entry.act_ela_avg.toFixed(1)} · Math ${entry.act_math_avg.toFixed(1)}`;
}
