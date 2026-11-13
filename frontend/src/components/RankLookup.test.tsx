// ABOUTME: Tests for the field that finds a school's place in the Top scores ranking
// ABOUTME: Verifies matching schools are offered, unranked ones are marked, and a choice is reported

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import * as queries from '@/lib/api/queries';
import { CLEARMONT_ELEMENTARY, ELK_GROVE_HIGH, SCHOOL_WITHOUT_FIGURES } from '@/test/schoolList';
import RankLookup from './RankLookup';

const OTHER_LEVEL = { ...ELK_GROVE_HIGH, rcdts: '99', display_name: 'Elk Grove Academy', level: 'other' as const };

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  vi.spyOn(queries, 'getSchools').mockResolvedValue({
    results: [ELK_GROVE_HIGH, CLEARMONT_ELEMENTARY, OTHER_LEVEL, SCHOOL_WITHOUT_FIGURES],
    total: 4,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderLookup() {
  const onSelect = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RankLookup onSelect={onSelect} />
    </QueryClientProvider>
  );
  return onSelect;
}

test('searches the school list for what is typed', async () => {
  renderLookup();

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'elk grove');

  expect(await screen.findByRole('option', { name: /Elk Grove High School/ })).toBeVisible();
  expect(queries.getSchools).toHaveBeenCalledWith({ q: 'elk grove' }, 0);
});

test('reports the chosen school', async () => {
  const onSelect = renderLookup();

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'elk grove');
  await userEvent.click(await screen.findByRole('option', { name: /Clearmont Elementary School/ }));

  expect(onSelect).toHaveBeenCalledWith(CLEARMONT_ELEMENTARY);
});

test('marks schools that are not ranked and does not offer them', async () => {
  const onSelect = renderLookup();

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'elk grove');
  const otherLevel = await screen.findByRole('option', { name: /Elk Grove Academy/ });
  const withoutScore = screen.getByRole('option', { name: new RegExp(SCHOOL_WITHOUT_FIGURES.display_name) });

  expect(otherLevel).toHaveTextContent('Not ranked');
  expect(otherLevel).toHaveAttribute('aria-disabled', 'true');
  expect(withoutScore).toHaveTextContent('Not ranked');
  await userEvent.click(otherLevel);
  expect(onSelect).not.toHaveBeenCalled();
});

test('waits for two letters before searching', async () => {
  renderLookup();

  await userEvent.type(screen.getByLabelText("Find a school's rank"), 'e');

  expect(queries.getSchools).not.toHaveBeenCalled();
});
