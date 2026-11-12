// ABOUTME: Tests for the HistoryChart component
// ABOUTME: Verifies the spoken summary and the message shown when no year has a value

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HistoryChart from './HistoryChart';
import { yearSeries } from '@/lib/history';

describe('HistoryChart', () => {
  it('summarises the first and latest reported years', () => {
    const series = yearSeries({ yr_2010: 22.5, yr_2019: 19.6, yr_2026: 18.1 });

    render(<HistoryChart label="Average ACT" series={series} kind="score" />);

    expect(
      screen.getByRole('img', { name: 'Average ACT from 2010 to 2026: 22.5 in 2010, 18.1 in 2026.' })
    ).toBeInTheDocument();
  });

  it('summarises a single reported year', () => {
    const series = yearSeries({ yr_2026: 412 });

    render(<HistoryChart label="Enrollment" series={series} kind="count" />);

    expect(screen.getByRole('img', { name: 'Enrollment: 412 in 2026.' })).toBeInTheDocument();
  });

  it('adds the benchmark to the summary and names both lines', () => {
    const series = yearSeries({ yr_2010: 22.5, yr_2026: 18.1 });
    const benchmark = {
      label: 'Illinois high school average',
      series: yearSeries({ yr_2010: 20.1, yr_2026: 17.55 }),
    };

    render(<HistoryChart label="Average ACT" series={series} kind="score" benchmark={benchmark} />);

    expect(
      screen.getByRole('img', {
        name: 'Average ACT from 2010 to 2026: 22.5 in 2010, 18.1 in 2026. Illinois high school average: 17.6 in 2026.',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('This school')).toBeInTheDocument();
    expect(screen.getByText('Illinois high school average')).toBeInTheDocument();
  });

  it('leaves out a benchmark that has no values', () => {
    const series = yearSeries({ yr_2010: 22.5, yr_2026: 18.1 });
    const benchmark = { label: 'Illinois high school average', series: yearSeries({}) };

    render(<HistoryChart label="Average ACT" series={series} kind="score" benchmark={benchmark} />);

    expect(
      screen.getByRole('img', { name: 'Average ACT from 2010 to 2026: 22.5 in 2010, 18.1 in 2026.' })
    ).toBeInTheDocument();
    expect(screen.queryByText('This school')).not.toBeInTheDocument();
  });

  it('says so when no year has a value', () => {
    render(<HistoryChart label="Average ACT" series={yearSeries({})} kind="score" />);

    expect(screen.getByText('No history published.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
