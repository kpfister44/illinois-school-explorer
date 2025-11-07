// ABOUTME: Unit tests for TanStack Query hooks
// ABOUTME: Tests query key generation for caching

import { describe, it, expect } from 'vitest';
import { searchQueryKey, schoolDetailQueryKey, compareQueryKey } from './queries';

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
