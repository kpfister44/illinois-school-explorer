// ABOUTME: The comparison list as it travels through the Compare page's URL
// ABOUTME: Writes the selected schools into the path and reads them back, so a copied URL reproduces a comparison

export const COMPARE_PATH = '/compare';
export const MOST_COMPARED = 5;

const PARAM = 'schools';

export function comparePath(rcdtsList: string[]): string {
  if (rcdtsList.length === 0) {
    return COMPARE_PATH;
  }
  return `${COMPARE_PATH}?${PARAM}=${rcdtsList.map(encodeURIComponent).join(',')}`;
}

// Null when the URL names no list, as opposed to an empty one
export function readCompareList(params: URLSearchParams): string[] | null {
  const value = params.get(PARAM);
  if (value === null) {
    return null;
  }

  const codes = value
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  return [...new Set(codes)].slice(0, MOST_COMPARED);
}
