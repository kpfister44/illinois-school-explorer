// ABOUTME: Tests for the District page
// ABOUTME: Verifies the summary, each level's dot plot and averages, unscored schools and Compare all

import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ComparisonProvider, useComparison } from '@/contexts/ComparisonContext';
import District from './District';
import { listItem } from '@/test/schoolList';
import type { DistrictDetail } from '@/lib/api/types';

const UNIT_DISTRICT = '41-057-0070-26';

const elementary = (code: string, name: string, score: number | null) =>
  listItem({
    rcdts: `${UNIT_DISTRICT}-${code}`,
    display_name: name,
    level: 'elementary',
    assessment: 'iar',
    score,
  });

const DISTRICT: DistrictDetail = {
  id: UNIT_DISTRICT,
  name: 'Edwardsville CUSD 7',
  county: 'Madison',
  school_count: 13,
  enrollment: 7204,
  levels: [
    {
      level: 'elementary',
      assessment: 'iar',
      state_average: 49.63,
      district_average: 58.2,
      schools: [
        elementary('2001', 'Cassens Elementary School', 71.4),
        elementary('2002', 'Goshen Elementary School', 60.02),
        elementary('2003', 'Nelson Elementary School', 43.2),
        elementary('2004', 'Midway Elementary School', null),
        elementary('2005', 'Hamel Elementary School', null),
        elementary('2006', 'Leclaire Elementary School', null),
      ],
    },
    {
      level: 'middle',
      assessment: 'iar',
      state_average: 44.1,
      district_average: null,
      schools: [
        listItem({ rcdts: `${UNIT_DISTRICT}-1001`, display_name: 'Liberty Middle School', level: 'middle', assessment: 'iar', score: 52.5 }),
        listItem({ rcdts: `${UNIT_DISTRICT}-1002`, display_name: 'Lincoln Middle School', level: 'middle', assessment: 'iar', score: 50.1 }),
      ],
    },
    {
      level: 'high',
      assessment: 'act',
      state_average: 17.55,
      district_average: null,
      schools: [
        listItem({ rcdts: `${UNIT_DISTRICT}-0001`, display_name: 'Edwardsville High School', score: 21.3 }),
      ],
    },
  ],
};

const server = setupServer(
  http.get(`http://localhost:8000/api/districts/${UNIT_DISTRICT}`, () => HttpResponse.json(DISTRICT)),
  http.get('http://localhost:8000/api/districts/99-999-9999-99', () =>
    HttpResponse.json({ detail: 'District not found' }, { status: 404 })
  ),
  http.get('http://localhost:8000/api/benchmarks/state', ({ request }) => {
    const params = new URL(request.url).searchParams;
    return HttpResponse.json({
      metric: params.get('metric'),
      level: params.get('level'),
      schools: 2143,
      band_low: params.get('metric') === 'act' ? 14.2 : 21.5,
      band_high: params.get('metric') === 'act' ? 20.7 : 76.3,
      years: [],
    });
  })
);

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  localStorage.clear();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  server.resetHandlers();
  consoleErrorSpy.mockRestore();
});
afterAll(() => server.close());

function ComparePage() {
  return <p>Comparing {useComparison().comparisonList.join(' ')}</p>;
}

function renderAt(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <MemoryRouter initialEntries={[`/district/${id}`]}>
          <Routes>
            <Route path="/district/:districtId" element={<District />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </MemoryRouter>
      </ComparisonProvider>
    </QueryClientProvider>
  );
}

const level = (name: string) => within(screen.getByRole('region', { name }));

describe('District', () => {
  it('opens with the district, its county, school count and students', async () => {
    renderAt(UNIT_DISTRICT);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Edwardsville CUSD 7' })
    ).toBeInTheDocument();
    expect(screen.getByText('Madison County · 13 schools · 7,204 students')).toBeInTheDocument();
  });

  it('gives each level its own section, from elementary up', async () => {
    renderAt(UNIT_DISTRICT);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Elementary schools',
      'Middle schools',
      'High schools',
    ]);
    expect(level('Elementary schools').getByText('IAR proficiency by school · 2026')).toBeInTheDocument();
    expect(level('High schools').getByText('ACT average by school · 2026')).toBeInTheDocument();
  });

  it('plots each school with a score and links it to its page', async () => {
    renderAt(UNIT_DISTRICT);
    await screen.findByRole('heading', { level: 1 });

    const plot = within(level('Elementary schools').getByRole('list', { name: 'IAR proficiency by school' }));
    const rows = plot.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Cassens Elementary School71.4%',
      'Goshen Elementary School60.0%',
      'Nelson Elementary School43.2%',
    ]);
    expect(plot.getByRole('link', { name: 'Cassens Elementary School' })).toHaveAttribute(
      'href',
      `/school/${UNIT_DISTRICT}-2001`
    );
  });

  it('states the district and Illinois averages, and only the Illinois one for a small group', async () => {
    renderAt(UNIT_DISTRICT);
    await screen.findByRole('heading', { level: 1 });

    expect(
      level('Elementary schools').getByText(
        'District average 58.2% · Illinois elementary schools average 49.6%.'
      )
    ).toBeInTheDocument();
    expect(
      level('High schools').getByText('Illinois high schools average 17.6.')
    ).toBeInTheDocument();
  });

  it('explains the shaded band once the state figures arrive', async () => {
    renderAt(UNIT_DISTRICT);

    expect(
      await screen.findByText(
        'Shaded band: where most Illinois elementary schools fall, 21.5% to 76.3%.'
      )
    ).toBeInTheDocument();
  });

  it('lists schools without a published score beneath the plot', async () => {
    renderAt(UNIT_DISTRICT);
    await screen.findByRole('heading', { level: 1 });

    const unscored = within(
      level('Elementary schools').getByRole('list', { name: 'Schools with no 2026 score published' })
    );
    expect(unscored.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Midway Elementary School',
      'Hamel Elementary School',
      'Leclaire Elementary School',
    ]);
    expect(
      level('Middle schools').queryByRole('list', { name: 'Schools with no 2026 score published' })
    ).not.toBeInTheDocument();
  });

  it('offers to compare a level with two to five schools', async () => {
    const user = userEvent.setup();
    localStorage.setItem('school-comparison', JSON.stringify(['another-school']));
    renderAt(UNIT_DISTRICT);
    await screen.findByRole('heading', { level: 1 });

    expect(level('Elementary schools').queryByRole('button', { name: /Compare/ })).not.toBeInTheDocument();
    expect(level('High schools').queryByRole('button', { name: /Compare/ })).not.toBeInTheDocument();
    await user.click(level('Middle schools').getByRole('button', { name: 'Compare both' }));

    expect(
      screen.getByText(`Comparing ${UNIT_DISTRICT}-1001 ${UNIT_DISTRICT}-1002`)
    ).toBeInTheDocument();
  });

  it('links to the district as a list that can be filtered', async () => {
    renderAt(UNIT_DISTRICT);

    expect(await screen.findByRole('link', { name: 'See these schools as a list' })).toHaveAttribute(
      'href',
      `/search?district=${UNIT_DISTRICT}`
    );
  });

  it('says when there is no such district', async () => {
    renderAt('99-999-9999-99');

    expect(await screen.findByText('District not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse districts' })).toHaveAttribute(
      'href',
      '/browse?by=district'
    );
  });
});
