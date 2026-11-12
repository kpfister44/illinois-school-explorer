// ABOUTME: Tests for the DesignationScale component
// ABOUTME: Verifies the five-step scale, schools off the scale, and the Illinois Report Card link

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DesignationScale from './DesignationScale';

const RCDTS = '05-016-2140-17-0002';

describe('DesignationScale', () => {
  it('names the level and where it sits among the five', () => {
    render(<DesignationScale designation="Approaching Exemplary" rcdts={RCDTS} />);

    expect(screen.getByText('Approaching Exemplary')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Second highest of five levels' })).toBeInTheDocument();
    expect(screen.getByText(/Second highest of five levels\. ISBE describes it as strong performance\./)).toBeInTheDocument();
  });

  it('highlights only the step for the level', () => {
    render(<DesignationScale designation="Approaching Exemplary" rcdts={RCDTS} />);

    const steps = [...screen.getByRole('img').children];
    expect(steps).toHaveLength(5);
    expect(steps.map((step) => step.classList.contains('bg-highlighter'))).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it.each([
    ['Exemplary', 'Highest of five levels', 4],
    ['Commendable', 'Middle of five levels', 2],
    ['Developing', 'Second lowest of five levels', 1],
    ['Comprehensive', 'Lowest of five levels', 0],
  ] as const)('places %s on the scale', (designation, position, stepIndex) => {
    render(<DesignationScale designation={designation} rcdts={RCDTS} />);

    const steps = [...screen.getByRole('img', { name: position }).children];
    expect(steps[stepIndex]).toHaveClass('bg-highlighter');
  });

  it('labels the ends of the scale', () => {
    render(<DesignationScale designation="Commendable" rcdts={RCDTS} />);

    expect(screen.getByText('Comprehensive')).toBeInTheDocument();
    expect(screen.getByText('Exemplary')).toBeInTheDocument();
  });

  it('shows a dually designated school off the scale', () => {
    render(<DesignationScale designation="Dually Designated" rcdts={RCDTS} />);

    expect(screen.getByText('Dually Designated')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/one designation for each/)).toBeInTheDocument();
  });

  it('says when a school has no designation', () => {
    render(<DesignationScale designation={null} rcdts={RCDTS} />);

    expect(screen.getByText('Not designated')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('says the system is new in 2026', () => {
    render(<DesignationScale designation="Commendable" rcdts={RCDTS} />);

    expect(screen.getByText(/new in 2026/)).toBeInTheDocument();
  });

  it("links to the school's profile on Illinois Report Card", () => {
    render(<DesignationScale designation="Commendable" rcdts={RCDTS} />);

    expect(screen.getByRole('link', { name: /Illinois Report Card/ })).toHaveAttribute(
      'href',
      'https://www.illinoisreportcard.com/school.aspx?schoolid=050162140170002&source=accountability&source2=essadesignation'
    );
  });
});
