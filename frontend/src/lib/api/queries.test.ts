// ABOUTME: Unit tests for TanStack Query hooks
// ABOUTME: Tests query key generation for caching

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './client';
import {
  searchQueryKey,
  schoolDetailQueryKey,
  compareQueryKey,
  statsQueryKey,
  stateBenchmarkQueryKey,
  similarSchoolsQueryKey,
  getTopScores,
  topScoresQueryKey,
  getSchools,
  schoolListQueryKey,
  districtQueryKey,
  districtsQueryKey,
  citiesQueryKey,
} from './queries';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedGet.mockReset();
});

describe('Query Keys', () => {
  it('generates correct search query key', () => {
    const key = searchQueryKey('test query', 10);
    expect(key).toEqual(['search', 'test query', 10]);
  });

  it('generates correct school detail query key', () => {
    const key = schoolDetailQueryKey('05-016-2140-17-0002');
    expect(key).toEqual(['school', '05-016-2140-17-0002']);
  });

  it('generates correct compare query key', () => {
    const key = compareQueryKey(['rcdts1', 'rcdts2']);
    expect(key).toEqual(['compare', 'rcdts1,rcdts2']);
  });

  it('generates correct stats query key', () => {
    expect(statsQueryKey()).toEqual(['stats']);
  });

  it('generates correct state benchmark query key', () => {
    expect(stateBenchmarkQueryKey('act', 'high')).toEqual(['state-benchmark', 'act', 'high']);
  });

  it('generates correct similar schools query key', () => {
    expect(similarSchoolsQueryKey('05-016-2140-17-0002', 'act')).toEqual([
      'similar-schools',
      '05-016-2140-17-0002',
      'act',
    ]);
  });
});

describe('browse query keys', () => {
  it('keys a school list by its filters', () => {
    expect(schoolListQueryKey({ level: 'high', county: 'Cook' })).toEqual([
      'schools',
      { level: 'high', county: 'Cook' },
    ]);
  });

  it('keys a district by its id and the place lists by name', () => {
    expect(districtQueryKey('05-016-2140-17')).toEqual(['district', '05-016-2140-17']);
    expect(districtsQueryKey()).toEqual(['districts']);
    expect(citiesQueryKey()).toEqual(['cities']);
  });
});

describe('getSchools', () => {
  it('requests one page of the filtered list with its sort order', async () => {
    mockedGet.mockResolvedValue({ data: { results: [], total: 0 } });

    const payload = await getSchools({ level: 'high', city: 'Elk Grove Village', sort: 'score' }, 25);

    expect(mockedGet).toHaveBeenCalledWith('/api/schools', {
      params: {
        level: 'high',
        city: 'Elk Grove Village',
        sort: 'score',
        order: 'desc',
        limit: 25,
        offset: 25,
      },
    });
    expect(payload.total).toBe(0);
  });
});

describe('getTopScores', () => {
  it('requests leaderboard with params', async () => {
    mockedGet.mockResolvedValue({
      data: {
        results: [
          {
            rank: 1,
            rcdts: '11-111-1111-11-0001',
            school_name: 'Sample High',
            city: 'Normal',
            district: 'Unit 5',
            school_type: 'High School',
            level: 'high',
            enrollment: 1200,
            score: 24.3,
          },
        ],
      },
    });

    const payload = await getTopScores({ assessment: 'act', level: 'high', limit: 25 });

    expect(mockedGet).toHaveBeenCalledWith('/api/top-scores', {
      params: { assessment: 'act', level: 'high', limit: 25 },
    });
    expect(payload.results[0].rank).toBe(1);
  });

  it('narrows to a region and looks up a school', async () => {
    mockedGet.mockResolvedValue({ data: { results: [], total: 0, school: null } });

    await getTopScores({
      assessment: 'iar',
      level: 'middle',
      county: 'Lake',
      district: '34-049-0050-02',
      school: '34-049-0050-02-1001',
    });

    expect(mockedGet).toHaveBeenCalledWith('/api/top-scores', {
      params: {
        limit: 100,
        assessment: 'iar',
        level: 'middle',
        county: 'Lake',
        district: '34-049-0050-02',
        school: '34-049-0050-02-1001',
      },
    });
  });
});

describe('topScoresQueryKey', () => {
  it('keys on the whole view', () => {
    expect(topScoresQueryKey({ level: 'high', county: 'Cook' })).toEqual([
      'top-scores',
      { level: 'high', county: 'Cook' },
    ]);
  });

  it('tells apart regions and looked-up schools', () => {
    expect(topScoresQueryKey({ level: 'high', county: 'Cook' })).not.toEqual(
      topScoresQueryKey({ level: 'high', county: 'Lake' })
    );
    expect(topScoresQueryKey({ level: 'high' })).not.toEqual(
      topScoresQueryKey({ level: 'high', school: '1' })
    );
  });
});
