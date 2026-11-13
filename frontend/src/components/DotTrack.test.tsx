// ABOUTME: Tests for the DotTrack component
// ABOUTME: Verifies several dots on one track, their colours and the band

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DotTrack from './DotTrack';

describe('DotTrack', () => {
  it('places every dot on the one scale in its own colour', () => {
    const { container } = render(
      <DotTrack
        dots={[
          { value: 15, series: 1 },
          { value: 20, series: 2 },
          { value: 25, series: 3 },
        ]}
        scale={[10, 30]}
      />
    );

    const dots = [...container.querySelectorAll('circle')];
    expect(dots.map((dot) => dot.getAttribute('cx'))).toEqual(['25.0%', '50.0%', '75.0%']);
    expect(dots.map((dot) => dot.getAttribute('class'))).toEqual([
      expect.stringContaining('fill-series-1'),
      expect.stringContaining('fill-series-2'),
      expect.stringContaining('fill-series-3'),
    ]);
  });

  it('draws a dot with no series as a benchmark', () => {
    const { container } = render(<DotTrack dots={[{ value: 20 }]} scale={[10, 30]} />);

    expect(container.querySelector('circle')).toHaveClass('fill-benchmark');
  });

  it('shades the band when given one', () => {
    const { container } = render(
      <DotTrack dots={[]} scale={[0, 100]} band={{ low: 20, high: 60 }} />
    );

    expect(container.querySelector('rect')).toHaveAttribute('x', '20.0%');
    expect(container.querySelector('rect')).toHaveAttribute('width', '40.0%');
  });

  it('is hidden from screen readers, which read the figures beside it', () => {
    const { container } = render(<DotTrack dots={[{ value: 20 }]} scale={[10, 30]} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
