// ABOUTME: Tests for the school list's filter form
// ABOUTME: Verifies the fields start from the filters in use and that applying or clearing reports the new filters

import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SchoolFilterForm from './SchoolFilterForm';
import * as queries from '@/lib/api/queries';
import { DISTRICTS } from '@/test/schoolList';
import type { SchoolListFilters } from '@/lib/schoolList';

function renderForm(filters: SchoolListFilters = {}) {
  const onApply = vi.fn();
  render(<SchoolFilterForm filters={filters} onApply={onApply} />);
  return onApply;
}

const optionLabels = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent);

describe('SchoolFilterForm', () => {
  beforeEach(() => {
    vi.spyOn(queries, 'useDistricts').mockReturnValue({
      data: DISTRICTS,
    } as unknown as ReturnType<typeof queries.useDistricts>);
  });

  it('offers each county once, in order, and every district', () => {
    renderForm();

    expect(optionLabels(screen.getByLabelText('County'))).toEqual(['Any county', 'Cook', 'Madison']);
    expect(optionLabels(screen.getByLabelText('District'))).toEqual([
      'Any district',
      'Comm Cons SD 59 (Cook)',
      'Edwardsville CUSD 7 (Madison)',
      'Township HSD 214 (Cook)',
    ]);
  });

  it('offers the state designations from the highest level down', () => {
    renderForm();

    expect(optionLabels(screen.getByLabelText('State designation'))).toEqual([
      'Any designation',
      'Exemplary',
      'Approaching Exemplary',
      'Commendable',
      'Developing',
      'Comprehensive',
      'Dually Designated',
    ]);
  });

  it('starts from the filters in use', () => {
    renderForm({
      county: 'Cook',
      district: '05-016-2140-17',
      designation: 'Exemplary',
      enrollment_min: 300,
      low_income_max: 42.5,
    });

    expect(screen.getByLabelText('County')).toHaveValue('Cook');
    expect(screen.getByLabelText('District')).toHaveValue('05-016-2140-17');
    expect(screen.getByLabelText('State designation')).toHaveValue('Exemplary');
    expect(screen.getByLabelText('Fewest students')).toHaveValue(300);
    expect(screen.getByLabelText('Most students')).toHaveValue(null);
    expect(screen.getByLabelText('Highest low-income share')).toHaveValue(42.5);
  });

  it('narrows the districts to the chosen county and drops a district outside it', async () => {
    const user = userEvent.setup();
    renderForm({ district: '05-016-2140-17' });

    await user.selectOptions(screen.getByLabelText('County'), 'Madison');

    expect(optionLabels(screen.getByLabelText('District'))).toEqual([
      'Any district',
      'Edwardsville CUSD 7',
    ]);
    expect(screen.getByLabelText('District')).toHaveValue('');
  });

  it('reports the chosen filters, keeping the search, level, city and sort', async () => {
    const user = userEvent.setup();
    const onApply = renderForm({ q: 'grove', level: 'high', city: 'Elk Grove Village', sort: 'score' });

    await user.selectOptions(screen.getByLabelText('County'), 'Cook');
    await user.selectOptions(screen.getByLabelText('District'), 'Township HSD 214');
    await user.selectOptions(screen.getByLabelText('State designation'), 'Commendable');
    await user.type(screen.getByLabelText('Fewest students'), '300');
    await user.type(screen.getByLabelText('Most students'), '900');
    await user.type(screen.getByLabelText('Lowest low-income share'), '10');
    await user.type(screen.getByLabelText('Highest low-income share'), '42.5');
    await user.click(screen.getByRole('button', { name: 'Show schools' }));

    expect(onApply).toHaveBeenCalledWith({
      q: 'grove',
      level: 'high',
      city: 'Elk Grove Village',
      sort: 'score',
      county: 'Cook',
      district: '05-016-2140-17',
      designation: 'Commendable',
      enrollment_min: 300,
      enrollment_max: 900,
      low_income_min: 10,
      low_income_max: 42.5,
    });
  });

  it('reports only what is set', async () => {
    const user = userEvent.setup();
    const onApply = renderForm({ county: 'Cook', enrollment_min: 300 });

    await user.selectOptions(screen.getByLabelText('County'), 'Any county');
    await user.click(screen.getByRole('button', { name: 'Show schools' }));

    expect(onApply).toHaveBeenCalledWith({ enrollment_min: 300 });
  });

  it('clears its own filters and keeps the search, level, city and sort', async () => {
    const user = userEvent.setup();
    const onApply = renderForm({ q: 'grove', level: 'high', county: 'Cook', low_income_max: 20 });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onApply).toHaveBeenCalledWith({ q: 'grove', level: 'high' });
  });
});
