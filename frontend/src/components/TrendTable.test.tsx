// ABOUTME: Tests for TrendTable component
// ABOUTME: Verifies trend data display and formatting

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrendTable from './TrendTable';
import type { TrendWindow } from '@/lib/api/types';

describe('TrendTable', () => {
  const mockTrendData: TrendWindow = {
    one_year: 50,
    three_year: 125,
    five_year: 200,
  };

  it('renders all three time windows', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('1 Year')).toBeInTheDocument();
    expect(screen.getByText('3 Year')).toBeInTheDocument();
    expect(screen.getByText('5 Year')).toBeInTheDocument();
  });

  it('displays formatted trend values with units', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('+50 students')).toBeInTheDocument();
    expect(screen.getByText('+125 students')).toBeInTheDocument();
    expect(screen.getByText('+200 students')).toBeInTheDocument();
  });

  it('displays percentage changes when above threshold', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText(/\+2\.9%/)).toBeInTheDocument();
  });

  it('displays N/A for null trend windows', () => {
    const partialData: TrendWindow = {
      one_year: 50,
      three_year: null,
      five_year: null,
    };

    render(
      <TrendTable
        currentValue={1775}
        trendData={partialData}
        metricType="count"
        unit="students"
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements).toHaveLength(4);
  });

  it('displays arrows based on trend direction', () => {
    const mixedData: TrendWindow = {
      one_year: 50,
      three_year: -25,
      five_year: 0,
    };

    render(
      <TrendTable
        currentValue={100}
        trendData={mixedData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText(/↑.*\+50/)).toBeInTheDocument();
    expect(screen.getByText(/↓.*-25/)).toBeInTheDocument();
    expect(screen.getByText(/→.*0/)).toBeInTheDocument();
  });

  it('suppresses percentage when below threshold', () => {
    render(
      <TrendTable
        currentValue={30}
        trendData={{ one_year: 5, three_year: null, five_year: null }}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('+5 students')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
