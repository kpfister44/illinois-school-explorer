// ABOUTME: Tests for the CompositionBar component
// ABOUTME: Verifies every group with data is listed, ordered by size, with a remainder when shares fall short of 100%

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CompositionBar from './CompositionBar';

const GROUPS = [
  { label: 'White', value: 35.6 },
  { label: 'Black', value: 2.0 },
  { label: 'Hispanic', value: 47.9 },
  { label: 'Asian', value: 9.8 },
  { label: 'Pacific Islander', value: null },
  { label: 'Native American', value: null },
  { label: 'Two or more races', value: 3.8 },
  { label: 'Middle Eastern or North African', value: 0.8 },
];

describe('CompositionBar', () => {
  it('lists every group with data, largest first', () => {
    render(<CompositionBar label="Race and ethnicity" groups={GROUPS} />);

    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual([
      'Hispanic47.9%',
      'White35.6%',
      'Asian9.8%',
      'Two or more races3.8%',
      'Black2.0%',
      'Middle Eastern or North African0.8%',
    ]);
  });

  it('leaves out groups without data', () => {
    render(<CompositionBar label="Race and ethnicity" groups={GROUPS} />);

    expect(screen.queryByText('Pacific Islander')).not.toBeInTheDocument();
  });

  it('describes the bar for assistive technology', () => {
    render(<CompositionBar label="Race and ethnicity" groups={GROUPS} />);

    expect(
      screen.getByRole('img', { name: /^Race and ethnicity: Hispanic 47.9%, White 35.6%/ })
    ).toBeInTheDocument();
  });

  it('sizes each segment by its share', () => {
    render(<CompositionBar label="Race and ethnicity" groups={GROUPS} />);

    const segments = [...screen.getByRole('img').children] as HTMLElement[];
    expect(segments.map((segment) => segment.style.flexGrow)).toEqual([
      '47.9',
      '35.6',
      '9.8',
      '3.8',
      '2',
      '0.8',
    ]);
  });

  it('shows the share that is not reported when groups fall short of 100%', () => {
    render(
      <CompositionBar
        label="Race and ethnicity"
        groups={[
          { label: 'White', value: 90 },
          { label: 'Hispanic', value: 4 },
          { label: 'Black', value: null },
        ]}
      />
    );

    const remainder = screen.getByText('Not reported').closest('li')!;
    expect(within(remainder).getByText('6.0%')).toBeInTheDocument();
    expect(screen.getByRole('img').children).toHaveLength(3);
  });

  it('ignores a rounding shortfall', () => {
    render(
      <CompositionBar
        label="Race and ethnicity"
        groups={[
          { label: 'White', value: 60.3 },
          { label: 'Hispanic', value: 39.5 },
        ]}
      />
    );

    expect(screen.queryByText('Not reported')).not.toBeInTheDocument();
  });

  it('says so when no group has data', () => {
    render(<CompositionBar label="Race and ethnicity" groups={[{ label: 'White', value: null }]} />);

    expect(screen.getByText('Not reported')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
