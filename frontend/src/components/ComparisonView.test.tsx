// ABOUTME: Tests for ComparisonView component
// ABOUTME: Verifies the school key, designation first, a dot plot per metric and the desktop table

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ComparisonView from './ComparisonView';
import type { SchoolDetail } from '@/lib/api/types';

function school(overrides: Partial<SchoolDetail> & Pick<SchoolDetail, 'rcdts' | 'display_name'>): SchoolDetail {
  return {
    id: 1,
    school_name: overrides.display_name,
    city: 'Elk Grove Village',
    district: 'Township HSD 214',
    county: 'Cook',
    school_type: 'High School',
    grades_served: '9-12',
    designation: 'Commendable',
    metrics: {
      enrollment: 1775,
      act: { ela_avg: 17.7, math_avg: 18.2, science_avg: 18.9, overall_avg: 17.9 },
      iar_ela_proficiency_pct: null,
      iar_math_proficiency_pct: null,
      iar_overall_proficiency_pct: null,
      demographics: { el_percentage: 29.0, low_income_percentage: 38.4 },
      diversity: {
        white: 36.8,
        black: 1.9,
        hispanic: 48.3,
        asian: 8.7,
        pacific_islander: null,
        native_american: null,
        two_or_more: 3.0,
        mena: null,
      },
    },
    ...overrides,
  };
}

const ELK_GROVE = school({ rcdts: '05-016-2140-17-0002', display_name: 'Elk Grove High School' });
const ROLLING_MEADOWS = school({
  rcdts: '05-016-2140-17-0007',
  display_name: 'Rolling Meadows High School',
  school_name: 'Rolling Meadows High Sch',
  city: 'Rolling Meadows',
  designation: 'Exemplary',
  metrics: {
    ...ELK_GROVE.metrics,
    enrollment: 1850,
    act: { ela_avg: 18.5, math_avg: 19.1, science_avg: 19.3, overall_avg: 18.8 },
    demographics: { el_percentage: 15.0, low_income_percentage: 25.0 },
  },
});

function renderView(schools: SchoolDetail[] = [ELK_GROVE, ROLLING_MEADOWS], onRemove = vi.fn()) {
  render(
    <MemoryRouter>
      <ComparisonView schools={schools} onRemove={onRemove} />
    </MemoryRouter>
  );
  return onRemove;
}

const plot = (name: string) => within(screen.getByRole('list', { name }));

describe('ComparisonView', () => {
  it('keys each school, by its display name, to its page and its colour', () => {
    renderView();

    const key = within(screen.getByRole('list', { name: 'Schools compared' }));
    const entries = key.getAllByRole('listitem');
    expect(entries).toHaveLength(2);
    expect(key.getByRole('link', { name: 'Rolling Meadows High School' })).toHaveAttribute(
      'href',
      '/school/05-016-2140-17-0007'
    );
    expect(entries[0]).toHaveTextContent('Elk Grove Village · Grades 9–12');
    expect(entries[0].querySelector('.bg-series-1')).not.toBeNull();
    expect(entries[1].querySelector('.bg-series-2')).not.toBeNull();
  });

  it('removes a school from its key entry', async () => {
    const onRemove = renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Elk Grove High School' }));

    expect(onRemove).toHaveBeenCalledWith('05-016-2140-17-0002');
  });

  it('opens with each school\'s state designation', () => {
    renderView([ELK_GROVE, school({ ...ROLLING_MEADOWS, designation: null })]);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings[0]).toBe('State designation');
    const designations = plot('State designation').getAllByRole('listitem');
    expect(designations[0]).toHaveTextContent('Elk Grove High School');
    expect(designations[0]).toHaveTextContent('Commendable');
    expect(designations[1]).toHaveTextContent('Not designated');
  });

  it('plots each metric with every school in its colour', () => {
    renderView();

    const rows = plot('ACT average').getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Elk Grove High School');
    expect(rows[0]).toHaveTextContent('17.9');
    expect(rows[1]).toHaveTextContent('18.8');
    expect(rows[0].querySelector('circle')).toHaveClass('fill-series-1');
    expect(rows[1].querySelector('circle')).toHaveClass('fill-series-2');

    expect(plot('Enrollment').getAllByRole('listitem')[1]).toHaveTextContent('1,850');
    expect(plot('English learners').getAllByRole('listitem')[0]).toHaveTextContent('29.0%');
  });

  it('leaves out a metric that no school reports', () => {
    renderView();

    expect(screen.queryByRole('list', { name: 'IAR proficiency, overall' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Pacific Islander' })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Two or more races' })).toBeInTheDocument();
  });

  it('keeps a school that does not report a metric in that metric\'s plot', () => {
    const elementary = school({
      rcdts: '05-016-0590-04-2003',
      display_name: 'Clearmont Elementary School',
      metrics: {
        ...ELK_GROVE.metrics,
        act: null,
        iar_overall_proficiency_pct: 61.2,
      },
    });
    renderView([ELK_GROVE, elementary]);

    expect(plot('ACT average').getAllByRole('listitem')[1]).toHaveTextContent('Not reported');
    expect(plot('IAR proficiency, overall').getAllByRole('listitem')[1]).toHaveTextContent('61.2%');
  });

  describe('table', () => {
    it('gives each school a column and opens with the designation row', () => {
      renderView();

      const table = within(screen.getByRole('table'));
      const headers = table.getAllByRole('columnheader').map((header) => header.textContent);
      expect(headers).toEqual(['Measure', 'Elk Grove High School', 'Rolling Meadows High School', 'On one scale']);
      const firstRow = table.getAllByRole('row')[1];
      expect(firstRow).toHaveTextContent('State designation');
      expect(firstRow).toHaveTextContent('Exemplary');
    });

    it('draws a dot per reporting school on each metric\'s track', () => {
      renderView();

      const enrollment = screen.getByRole('row', { name: /^Enrollment/ });
      const dots = enrollment.querySelectorAll('circle');
      expect(dots).toHaveLength(2);
      expect(dots[0]).toHaveClass('fill-series-1');
      expect(dots[1]).toHaveClass('fill-series-2');
    });

    it('says when a school does not report a metric', () => {
      renderView([ELK_GROVE, school({ ...ROLLING_MEADOWS, metrics: { ...ROLLING_MEADOWS.metrics, act: null } })]);

      const row = within(screen.getByRole('row', { name: /^ACT math/ }));
      expect(row.getByText('18.2')).toBeInTheDocument();
      expect(row.getByText('Not reported')).toBeInTheDocument();
    });

    it('marks the highest test result in each row', () => {
      renderView();

      const row = within(screen.getByRole('row', { name: /^ACT English language arts/ }));
      expect(row.getByText('18.5')).toHaveClass('font-bold');
      expect(row.getByText('17.7')).not.toHaveClass('font-bold');
    });

    it('gives enrollment and student figures no better or worse reading', () => {
      renderView();

      for (const label of ['Enrollment', 'Low income', 'English learners', 'White', 'Hispanic']) {
        const row = screen.getByRole('row', { name: new RegExp(`^${label}`) });
        expect(row.querySelector('.font-bold')).toBeNull();
      }
    });
  });
});
