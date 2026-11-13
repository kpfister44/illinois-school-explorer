// ABOUTME: Tests for the county and district fields
// ABOUTME: Verifies the choices offered and the region reported when either field changes

import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegionFields from './RegionFields';
import * as queries from '@/lib/api/queries';
import { DISTRICTS } from '@/test/schoolList';

const optionLabels = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent);

function renderFields(county = '', district = '') {
  const onChange = vi.fn();
  render(<RegionFields county={county} district={district} onChange={onChange} />);
  return onChange;
}

describe('RegionFields', () => {
  beforeEach(() => {
    vi.spyOn(queries, 'useDistricts').mockReturnValue({
      data: DISTRICTS,
    } as unknown as ReturnType<typeof queries.useDistricts>);
  });

  it('offers each county once and the districts of the chosen county', () => {
    renderFields('Cook');

    expect(optionLabels(screen.getByLabelText('County'))).toEqual(['Any county', 'Cook', 'Madison']);
    expect(optionLabels(screen.getByLabelText('District'))).toEqual([
      'Any district',
      'Comm Cons SD 59',
      'Township HSD 214',
    ]);
  });

  it('shows the region in use', () => {
    renderFields('Cook', '05-016-2140-17');

    expect(screen.getByLabelText('County')).toHaveValue('Cook');
    expect(screen.getByLabelText('District')).toHaveValue('05-016-2140-17');
  });

  it('drops a district outside a newly chosen county', async () => {
    const onChange = renderFields('Cook', '05-016-2140-17');

    await userEvent.selectOptions(screen.getByLabelText('County'), 'Madison');

    expect(onChange).toHaveBeenCalledWith({ county: 'Madison', district: '' });
  });

  it('keeps the district when the county is cleared', async () => {
    const onChange = renderFields('Cook', '05-016-2140-17');

    await userEvent.selectOptions(screen.getByLabelText('County'), '');

    expect(onChange).toHaveBeenCalledWith({ county: '', district: '05-016-2140-17' });
  });

  it('reports a chosen district with the county in use', async () => {
    const onChange = renderFields('Cook');

    await userEvent.selectOptions(screen.getByLabelText('District'), '05-016-0590-04');

    expect(onChange).toHaveBeenCalledWith({ county: 'Cook', district: '05-016-0590-04' });
  });
});
