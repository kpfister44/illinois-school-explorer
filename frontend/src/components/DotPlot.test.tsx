// ABOUTME: Tests for the DotPlot component
// ABOUTME: Verifies rows, dot positions on a shared scale, the highlighted row and the band

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DotPlot from './DotPlot';

const ROWS = [
  { label: 'This school', value: 18.1, highlighted: true },
  { label: 'Illinois', value: 17.6 },
  { label: 'District', value: 20.5 },
];

function renderPlot(props: Partial<React.ComponentProps<typeof DotPlot>> = {}) {
  return render(
    <DotPlot label="Average ACT compared" rows={ROWS} kind="score" scale={[10, 30]} {...props} />
  );
}

describe('DotPlot', () => {
  it('lists each row with its formatted value', () => {
    renderPlot();

    const rows = within(screen.getByRole('list', { name: 'Average ACT compared' })).getAllByRole(
      'listitem'
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('This school');
    expect(rows[0]).toHaveTextContent('18.1');
    expect(rows[1]).toHaveTextContent('Illinois');
    expect(rows[1]).toHaveTextContent('17.6');
  });

  it('places each dot along the shared scale', () => {
    const { container } = renderPlot();

    const dots = [...container.querySelectorAll('circle')].map((dot) => dot.getAttribute('cx'));
    expect(dots).toEqual(['40.5%', '38.0%', '52.5%']);
  });

  it('highlights only the marked row', () => {
    const { container } = renderPlot();

    expect(container.querySelectorAll('circle.fill-highlighter')).toHaveLength(1);
    expect(container.querySelectorAll('circle.fill-benchmark')).toHaveLength(2);
    expect(screen.getByText('This school')).toHaveClass('bg-highlighter');
    expect(screen.getByText('Illinois')).not.toHaveClass('bg-highlighter');
  });

  it('shades the band on every row', () => {
    const { container } = renderPlot({ band: { low: 14, high: 21 } });

    const bands = container.querySelectorAll('rect');
    expect(bands).toHaveLength(3);
    expect(bands[0]).toHaveAttribute('x', '20.0%');
    expect(bands[0]).toHaveAttribute('width', '35.0%');
  });

  it('draws no band when none is given', () => {
    const { container } = renderPlot();

    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });

  it('keeps a value beyond the scale at its end', () => {
    const { container } = renderPlot({
      rows: [
        { label: 'Low', value: 4 },
        { label: 'High', value: 35 },
      ],
    });

    const dots = [...container.querySelectorAll('circle')].map((dot) => dot.getAttribute('cx'));
    expect(dots).toEqual(['0.0%', '100.0%']);
  });

  it('links a row to its page when given one', () => {
    render(
      <MemoryRouter>
        <DotPlot
          label="ACT average by school"
          rows={[
            { label: 'John Hersey High School', value: 23.9, to: '/school/05-016-2140-17-0005' },
            { label: 'District average', value: 20.5 },
          ]}
          kind="score"
          scale={[10, 30]}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'John Hersey High School' })).toHaveAttribute(
      'href',
      '/school/05-016-2140-17-0005'
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('District average')).toBeInTheDocument();
  });
});
