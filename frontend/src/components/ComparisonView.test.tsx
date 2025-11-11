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

    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    expect(screen.getByText('Rolling Meadows High School')).toBeInTheDocument();
  });

  it('displays enrollment data for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('1,775')).toBeInTheDocument();
    expect(screen.getByText('1,850')).toBeInTheDocument();
  });

  it('displays ACT scores for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('17.7')).toBeInTheDocument();
    expect(screen.getByText('18.5')).toBeInTheDocument();
  });

  it('displays demographics percentages', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('29.0%')).toBeInTheDocument();
    expect(screen.getByText('15.0%')).toBeInTheDocument();
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

    expect(screen.getByText('Enrollment')).toBeInTheDocument();
    expect(screen.getByText('ACT ELA Average')).toBeInTheDocument();
    expect(screen.getByText('ACT Math Average')).toBeInTheDocument();
    expect(screen.getByText('English Learner %')).toBeInTheDocument();
    expect(screen.getByText('Low Income %')).toBeInTheDocument();
  });
});
