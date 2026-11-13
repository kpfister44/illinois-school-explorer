// ABOUTME: Tests for the school list's filters and sort as they travel through the URL and to the API
// ABOUTME: Verifies reading, writing, the API parameters and which sorts are on offer

import { describe, it, expect } from 'vitest';
import {
  apiParams,
  districtId,
  listPath,
  readFilters,
  sortChoices,
  type SchoolListFilters,
} from './schoolList';

const read = (query: string) => readFilters(new URLSearchParams(query));

describe('readFilters', () => {
  it('reads every filter from the URL', () => {
    expect(
      read(
        'q=grove&level=high&county=Cook&district=05-016-2140-17&city=Elk+Grove+Village' +
          '&designation=Exemplary&enrollment_min=300&enrollment_max=900' +
          '&low_income_min=10&low_income_max=42.5&sort=enrollment'
      )
    ).toEqual({
      q: 'grove',
      level: 'high',
      county: 'Cook',
      district: '05-016-2140-17',
      city: 'Elk Grove Village',
      designation: 'Exemplary',
      enrollment_min: 300,
      enrollment_max: 900,
      low_income_min: 10,
      low_income_max: 42.5,
      sort: 'enrollment',
    });
  });

  it('reads an empty URL as no filters', () => {
    expect(read('')).toEqual({});
  });

  it('ignores blank values, unknown levels and sorts, and figures that are not numbers', () => {
    expect(read('q=+&level=college&sort=rank&enrollment_min=many&low_income_max=')).toEqual({});
  });

  it('ignores a sort by score when no level is chosen, since levels take different tests', () => {
    expect(read('sort=score')).toEqual({});
    expect(read('sort=score&level=middle')).toEqual({ level: 'middle', sort: 'score' });
  });
});

describe('listPath', () => {
  it('writes only the filters that are set', () => {
    expect(listPath({ level: 'high', city: 'Elk Grove Village' })).toBe(
      '/search?level=high&city=Elk+Grove+Village'
    );
    expect(listPath({})).toBe('/search');
  });

  it('round-trips through the URL', () => {
    const filters: SchoolListFilters = {
      q: 'grove',
      level: 'elementary',
      county: 'Cook',
      enrollment_max: 500,
      low_income_min: 12.5,
      sort: 'score',
    };

    expect(read(listPath(filters).split('?')[1])).toEqual(filters);
  });

  it('drops a sort by score when the level is removed', () => {
    expect(listPath({ sort: 'score' })).toBe('/search');
  });
});

describe('apiParams', () => {
  it('lists the highest scores and the largest schools first', () => {
    expect(apiParams({ level: 'high', sort: 'score' })).toEqual({
      level: 'high',
      sort: 'score',
      order: 'desc',
    });
    expect(apiParams({ sort: 'enrollment' })).toEqual({ sort: 'enrollment', order: 'desc' });
  });

  it('lists names from A to Z', () => {
    expect(apiParams({ q: 'elk', sort: 'name' })).toEqual({ q: 'elk', sort: 'name', order: 'asc' });
  });

  it('leaves the order to the API when no sort is chosen', () => {
    expect(apiParams({ county: 'Cook' })).toEqual({ county: 'Cook' });
  });
});

describe('sortChoices', () => {
  it('offers best match only for a search and score only for one level', () => {
    const labels = (filters: SchoolListFilters) => sortChoices(filters).map((choice) => choice.label);

    expect(labels({})).toEqual(['Name', 'Most students']);
    expect(labels({ q: 'elk' })).toEqual(['Best match', 'Name', 'Most students']);
    expect(labels({ level: 'high' })).toEqual(['Name', 'Highest score', 'Most students']);
  });

  it('marks the sort in use, which is best match for a search and name otherwise', () => {
    const current = (filters: SchoolListFilters) =>
      sortChoices(filters).find((choice) => choice.current)?.label;

    expect(current({})).toBe('Name');
    expect(current({ q: 'elk' })).toBe('Best match');
    expect(current({ q: 'elk', sort: 'name' })).toBe('Name');
    expect(current({ level: 'high', sort: 'score' })).toBe('Highest score');
  });
});

describe('districtId', () => {
  it('is the district part of an RCDTS code', () => {
    expect(districtId('05-016-2140-17-0002')).toBe('05-016-2140-17');
  });
});
