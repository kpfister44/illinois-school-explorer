// ABOUTME: Tests for a school's row in a results list
// ABOUTME: Verifies the link, the facts line, the headline score with its caption and missing figures

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SchoolListRow from './SchoolListRow';
import { CLEARMONT_ELEMENTARY, ELK_GROVE_HIGH, SCHOOL_WITHOUT_FIGURES } from '@/test/schoolList';
import type { SchoolListItem } from '@/lib/api/types';

function renderRow(school: SchoolListItem) {
  render(
    <MemoryRouter>
      <ul>
        <SchoolListRow school={school} />
      </ul>
    </MemoryRouter>
  );
  return screen.getByRole('link');
}

describe('SchoolListRow', () => {
  it('links the whole row to the school', () => {
    const row = renderRow(ELK_GROVE_HIGH);

    expect(row).toHaveAttribute('href', '/school/05-016-2140-17-0002');
    expect(row).toHaveTextContent('Elk Grove High School');
  });

  it('shows city, district, grades and enrollment', () => {
    renderRow(ELK_GROVE_HIGH);

    expect(
      screen.getByText('Elk Grove Village · Township HSD 214 · 9–12 · 1,721 students')
    ).toBeInTheDocument();
  });

  it('shows the ACT average for a high school', () => {
    const row = renderRow(ELK_GROVE_HIGH);

    expect(row).toHaveTextContent('18.1');
    expect(row).toHaveTextContent('ACT average');
  });

  it('shows IAR proficiency and the display name for an elementary school', () => {
    const row = renderRow(CLEARMONT_ELEMENTARY);

    expect(row).toHaveTextContent('Clearmont Elementary School');
    expect(row).toHaveTextContent('56.6%');
    expect(row).toHaveTextContent('IAR proficient');
  });

  it('shows the state designation', () => {
    renderRow(ELK_GROVE_HIGH);

    expect(screen.getByText('Approaching Exemplary')).toBeInTheDocument();
  });

  it('leaves out facts that are not published and says when there is no score', () => {
    const row = renderRow(SCHOOL_WITHOUT_FIGURES);

    expect(screen.getByText('Avon')).toBeInTheDocument();
    expect(row).toHaveTextContent('No score');
    expect(row).not.toHaveTextContent('students');
    expect(row).not.toHaveTextContent('IAR proficient');
  });
});
