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
    ten_year: 300,
    fifteen_year: 400,
  };

  it('renders all five time windows', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
      />
    );

    expect(screen.getByText('1 Year')).toBeInTheDocument();
    expect(screen.getByText('3 Year')).toBeInTheDocument();
    expect(screen.getByText('5 Year')).toBeInTheDocument();
    expect(screen.getByText('10 Year')).toBeInTheDocument();
    expect(screen.getByText('15 Year')).toBeInTheDocument();
  });

  it('displays formatted trend values with units', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
      />
    );

    expect(screen.getByText('+50 students')).toBeInTheDocument();
    expect(screen.getByText('+125 students')).toBeInTheDocument();
    expect(screen.getByText('+200 students')).toBeInTheDocument();
    expect(screen.getByText('+300 students')).toBeInTheDocument();
    expect(screen.getByText('+400 students')).toBeInTheDocument();
  });

  it('displays metric-specific trends subtitle', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
      />
    );

    expect(screen.getByText('Enrollment Trends')).toBeInTheDocument();
  });

  it('displays N/A for null trend windows', () => {
    const partialData: TrendWindow = {
      one_year: 50,
      three_year: null,
      five_year: null,
      ten_year: null,
      fifteen_year: null,
    };

    render(
      <TrendTable
        currentValue={1775}
        trendData={partialData}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
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
      ten_year: 100,
      fifteen_year: -50,
    };

    render(
      <TrendTable
        currentValue={100}
        trendData={mixedData}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
      />
    );

    const increaseCell = screen.getByText('+50 students').closest('td');
    const decreaseCell = screen.getByText('-25 students').closest('td');
    const flatCell = screen.getByText('0 students').closest('td');

    expect(increaseCell?.textContent).toContain('↑');
    expect(decreaseCell?.textContent).toContain('↓');
    expect(flatCell?.textContent).toContain('→');
  });

  it('renders change values without percent column', () => {
    render(
      <TrendTable
        currentValue={30}
        trendData={{ one_year: 5, three_year: null, five_year: null, ten_year: null, fifteen_year: null }}
        metricType="count"
        unit="students"
        metricLabel="Enrollment"
      />
    );

    expect(screen.getByText('+5 students')).toBeInTheDocument();
    // Percent column no longer exists
    expect(screen.queryByText(/\+\d+\.\d+%/)).not.toBeInTheDocument();
  });
});
