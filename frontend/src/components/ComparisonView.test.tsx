// ABOUTME: Tests for ComparisonView component
// ABOUTME: Verifies side-by-side comparison table display

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import ComparisonView from './ComparisonView';
import type { SchoolDetail } from '@/lib/api/types';

const mockSchools: SchoolDetail[] = [
  {
    id: 1,
    rcdts: '05-016-2140-17-0002',
    school_name: 'Elk Grove High School',
    city: 'Elk Grove Village',
    district: 'Township HSD 214',
    county: 'Cook',
    school_type: 'High School',
    grades_served: '9-12',
    metrics: {
      enrollment: 1775,
      act: {
        ela_avg: 17.7,
        math_avg: 18.2,
        science_avg: 18.9,
        overall_avg: 17.95,
      },
      demographics: {
        el_percentage: 29.0,
        low_income_percentage: 38.4,
      },
      diversity: {
        white: 36.8,
        black: 1.9,
        hispanic: 48.3,
        asian: 8.7,
        pacific_islander: null,
        native_american: null,
        two_or_more: 3.0,
        mena: null,
      },
    },
  },
  {
    id: 2,
    rcdts: '05-016-2140-17-0003',
    school_name: 'Rolling Meadows High School',
    city: 'Rolling Meadows',
    district: 'Township HSD 214',
    county: 'Cook',
    school_type: 'High School',
    grades_served: '9-12',
    metrics: {
      enrollment: 1850,
      act: {
        ela_avg: 18.5,
        math_avg: 19.1,
        science_avg: 19.3,
        overall_avg: 18.8,
      },
      demographics: {
        el_percentage: 15.0,
        low_income_percentage: 25.0,
      },
      diversity: {
        white: 45.0,
        black: 3.0,
        hispanic: 35.0,
        asian: 12.0,
        pacific_islander: null,
        native_american: null,
        two_or_more: 4.0,
        mena: null,
      },
    },
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(<ComparisonProvider>{ui}</ComparisonProvider>);
}

describe('ComparisonView', () => {
  it('renders school names as column headers', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Both mobile and desktop views render the school names
    expect(screen.getAllByText('Elk Grove High School').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rolling Meadows High School').length).toBeGreaterThan(0);
  });

  it('displays enrollment data for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Both mobile and desktop views render the data
    expect(screen.getAllByText('1,775').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1,850').length).toBeGreaterThan(0);
  });

  it('displays ACT scores for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Both mobile and desktop views render the scores
    expect(screen.getAllByText('17.7').length).toBeGreaterThan(0);
    expect(screen.getAllByText('18.5').length).toBeGreaterThan(0);
  });

  it('displays demographics percentages', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Both mobile and desktop views render the percentages
    expect(screen.getAllByText('29.0%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('15.0%').length).toBeGreaterThan(0);
  });

  it('handles null values gracefully', () => {
    const schoolsWithNulls: SchoolDetail[] = [
      {
        ...mockSchools[0],
        metrics: {
          ...mockSchools[0].metrics,
          act: {
            ela_avg: null,
            math_avg: null,
            science_avg: null,
            overall_avg: null,
          },
        },
      },
    ];

    renderWithProviders(<ComparisonView schools={schoolsWithNulls} />);

    const table = screen.getByRole('table');
    expect(within(table).getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('applies color coding to highlight best values', () => {
    const { container } = renderWithProviders(<ComparisonView schools={mockSchools} />);

    const highlightedCells = container.querySelectorAll('[class*="bg-green"]');
    expect(highlightedCells.length).toBeGreaterThan(0);
  });

  it('renders metric labels in first column', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Both mobile and desktop views render metric labels
    expect(screen.getAllByText('Enrollment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ACT ELA Average').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ACT Math Average').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English Learner %').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Low Income %').length).toBeGreaterThan(0);
  });
});
