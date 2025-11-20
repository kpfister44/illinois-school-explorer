// ABOUTME: Tests for HistoricalDataTable toggle behavior
// ABOUTME: Ensures recent and legacy years render with show more/less

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoricalDataTable from './HistoricalDataTable';
import type { HistoricalYearlyData } from '@/lib/api/types';

const sampleData: HistoricalYearlyData = {
  yr_2025: 17.9,
  yr_2024: 17.8,
  yr_2023: 17.7,
  yr_2022: 17.9,
  yr_2021: 18.6,
  yr_2020: null,
  yr_2019: 19.6,
  yr_2018: 20.9,
  yr_2017: 21.4,
  yr_2016: 21.3,
  yr_2015: 22.3,
  yr_2014: 22.3,
  yr_2013: 22.0,
  yr_2012: 21.7,
  yr_2011: 21.4,
  yr_2010: 21.0,
};

describe('HistoricalDataTable', () => {
  it('shows 2017-2025 by default with show more control', () => {
    render(<HistoricalDataTable data={sampleData} metricType="score" metricLabel="ACT Overall" />);

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.queryByText('2016')).not.toBeInTheDocument();
    expect(screen.queryByText('2010')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /^show more$/i })).toBeInTheDocument();
  });

  it('reveals legacy years and toggles button text when expanded', async () => {
    const user = userEvent.setup();
    render(<HistoricalDataTable data={sampleData} metricType="score" metricLabel="ACT Overall" />);

    await user.click(screen.getByRole('button', { name: /^show more$/i }));

    expect(screen.getByText('2016')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^show less$/i })).toBeInTheDocument();
  });
});
