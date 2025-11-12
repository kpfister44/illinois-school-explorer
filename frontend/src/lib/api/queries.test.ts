// ABOUTME: Unit tests for TanStack Query hooks
// ABOUTME: Tests query key generation for caching

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './client';
import { searchQueryKey, schoolDetailQueryKey, compareQueryKey, getTopScores } from './queries';

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
});
