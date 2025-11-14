// ABOUTME: Tests for TrendDisplay component
// ABOUTME: Verifies expand/collapse behavior and data handling

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendDisplay from './TrendDisplay';
import type { TrendWindow } from '@/lib/api/types';

describe('TrendDisplay', () => {
  const mockTrendData: TrendWindow = {
    one_year: 50,
    three_year: 125,
    five_year: 200,
  };

  it('renders show trends button by default', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByRole('button', { name: /show trends/i })).toBeInTheDocument();
  });

  it('does not render trend table initially', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });

  it('shows trend table when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByText('1 Year')).toBeInTheDocument();
    expect(screen.getByText('3 Year')).toBeInTheDocument();
    expect(screen.getByText('5 Year')).toBeInTheDocument();
  });

  it('changes button text to hide trends when expanded', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /hide trends/i })).toBeInTheDocument();
  });

  it('hides trend table when hide button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const showButton = screen.getByRole('button', { name: /show trends/i });
    await user.click(showButton);

    const hideButton = screen.getByRole('button', { name: /hide trends/i });
    await user.click(hideButton);

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });

  it('renders disabled button when trend data is null', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={null}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    expect(button).toBeDisabled();
  });

  it('renders disabled button when trend data is undefined', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={undefined}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    expect(button).toBeDisabled();
  });

  it('does not expand when clicking disabled button', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={null}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });
});
