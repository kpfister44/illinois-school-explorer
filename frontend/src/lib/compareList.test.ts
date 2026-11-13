// ABOUTME: Tests for the comparison list's URL
// ABOUTME: Covers writing a list into the Compare path and reading it back, with bad input dropped

import { describe, expect, it } from 'vitest';
import { comparePath, readCompareList } from './compareList';

const ELK_GROVE = '05-016-2140-17-0002';
const ROLLING_MEADOWS = '05-016-2140-17-0007';

describe('comparePath', () => {
  it('lists the schools in order, separated by commas', () => {
    expect(comparePath([ELK_GROVE, ROLLING_MEADOWS])).toBe(
      `/compare?schools=${ELK_GROVE},${ROLLING_MEADOWS}`
    );
  });

  it('writes out an empty list, which is not the same as naming none', () => {
    expect(comparePath([])).toBe('/compare?schools=');
    expect(readCompareList(new URLSearchParams('schools='))).toEqual([]);
  });
});

describe('readCompareList', () => {
  it('reads the list written by comparePath', () => {
    const path = comparePath([ROLLING_MEADOWS, ELK_GROVE]);
    const params = new URLSearchParams(path.split('?')[1]);

    expect(readCompareList(params)).toEqual([ROLLING_MEADOWS, ELK_GROVE]);
  });

  it('is null when the URL names no list', () => {
    expect(readCompareList(new URLSearchParams())).toBeNull();
  });

  it('drops blanks and repeats', () => {
    const params = new URLSearchParams(`schools=${ELK_GROVE},, ${ELK_GROVE} ,${ROLLING_MEADOWS}`);

    expect(readCompareList(params)).toEqual([ELK_GROVE, ROLLING_MEADOWS]);
  });

  it('keeps at most five schools', () => {
    const codes = ['a', 'b', 'c', 'd', 'e', 'f'];

    expect(readCompareList(new URLSearchParams(`schools=${codes.join(',')}`))).toEqual(
      codes.slice(0, 5)
    );
  });
});
