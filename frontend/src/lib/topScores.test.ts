// ABOUTME: Tests for the Top scores view as it travels through the URL
// ABOUTME: Covers reading and writing the level, region and looked-up school

import { describe, expect, it } from 'vitest';
import { RANKED_LEVELS, readTopScoresView, topScoresPath } from './topScores';

describe('readTopScoresView', () => {
  it('opens on high schools with no region or school', () => {
    expect(readTopScoresView(new URLSearchParams())).toEqual({ level: 'high' });
  });

  it('reads the level, region and school', () => {
    const params = new URLSearchParams(
      'level=middle&county=Dupage&district=19-022-2030-26&school=19-022-2030-26-0001'
    );

    expect(readTopScoresView(params)).toEqual({
      level: 'middle',
      county: 'Dupage',
      district: '19-022-2030-26',
      school: '19-022-2030-26-0001',
    });
  });

  it('ignores a level that is not ranked and blank values', () => {
    expect(readTopScoresView(new URLSearchParams('level=other&county=%20'))).toEqual({
      level: 'high',
    });
  });
});

describe('topScoresPath', () => {
  it('leaves the high school ranking at the bare path', () => {
    expect(topScoresPath({ level: 'high' })).toBe('/top-scores');
  });

  it('writes the level, region and school in a fixed order', () => {
    expect(
      topScoresPath({ school: '1', district: '2', county: 'Lake', level: 'elementary' })
    ).toBe('/top-scores?level=elementary&county=Lake&district=2&school=1');
  });

  it('reads back what it writes', () => {
    const view = { level: 'middle' as const, county: 'Cook', school: '15-016-2990-25-1234' };
    const path = topScoresPath(view);

    expect(readTopScoresView(new URLSearchParams(path.split('?')[1]))).toEqual(view);
  });
});

describe('RANKED_LEVELS', () => {
  it('ranks high schools on the ACT and other levels on the IAR', () => {
    expect(RANKED_LEVELS.map(({ level, assessment }) => `${level}:${assessment}`)).toEqual([
      'high:act',
      'middle:iar',
      'elementary:iar',
    ]);
  });
});
