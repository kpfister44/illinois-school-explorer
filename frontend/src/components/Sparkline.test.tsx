// ABOUTME: Tests for the Sparkline component
// ABOUTME: Verifies line segments, gaps for missing years and the highlighted final year

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Sparkline from './Sparkline';
import { yearSeries } from '@/lib/history';

describe('Sparkline', () => {
  it('draws one unbroken line when every year has a value', () => {
    const series = yearSeries({ yr_2024: 10, yr_2025: 12, yr_2026: 14 }).slice(-3);

    const { container } = render(<Sparkline series={series} />);

    expect(container.querySelectorAll('polyline')).toHaveLength(1);
  });

  it('breaks the line at missing years', () => {
    const series = yearSeries({ yr_2010: 5, yr_2011: 6, yr_2020: 9, yr_2021: 10, yr_2026: 12 });

    const { container } = render(<Sparkline series={series} />);

    expect(container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('highlights the final year when it has a value', () => {
    const series = yearSeries({ yr_2010: 5, yr_2026: 9 });

    const { container } = render(<Sparkline series={series} />);

    const endpoint = container.querySelector('circle.fill-highlighter');
    const lastX = Number(endpoint?.getAttribute('cx'));
    const everyX = [...container.querySelectorAll('circle')].map((circle) => Number(circle.getAttribute('cx')));
    expect(endpoint).not.toBeNull();
    expect(lastX).toBe(Math.max(...everyX));
  });

  it('highlights nothing when the final year has no value', () => {
    const series = yearSeries({ yr_2010: 5, yr_2011: 6, yr_2020: 9 });

    const { container } = render(<Sparkline series={series} />);

    expect(container.querySelector('circle.fill-highlighter')).toBeNull();
  });

  it('places higher values nearer the top', () => {
    const series = yearSeries({ yr_2025: 10, yr_2026: 20 }).slice(-2);

    const { container } = render(<Sparkline series={series} />);

    const [first, second] = container
      .querySelector('polyline')!
      .getAttribute('points')!
      .split(' ')
      .map((point) => Number(point.split(',')[1]));
    expect(second).toBeLessThan(first);
  });

  it('is hidden from assistive technology', () => {
    const { container } = render(<Sparkline series={yearSeries({ yr_2026: 1 })} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
