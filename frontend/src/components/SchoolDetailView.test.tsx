// ABOUTME: Tests for SchoolDetailView component
// ABOUTME: Verifies tabbed interface and metric display

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import SchoolDetailView from './SchoolDetailView';
import type { SchoolDetail } from '@/lib/api/types';

const mockSchoolDetail: SchoolDetail = {
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
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ComparisonProvider>{ui}</ComparisonProvider>);
}

describe('SchoolDetailView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays school name and basic info', () => {
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
    expect(screen.getByText(/Cook/)).toBeInTheDocument();
  });

  it('displays school type and grades badges', () => {
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('High School')).toBeInTheDocument();
    expect(screen.getByText('Grades 9-12')).toBeInTheDocument();
  });

  it('renders tabs for Overview, Academics, Demographics', () => {
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /academics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /demographics/i })).toBeInTheDocument();
  });

  it('displays enrollment in Overview tab by default', () => {
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText(/enrollment/i)).toBeInTheDocument();
    expect(screen.getByText('1,775')).toBeInTheDocument();
  });

  it('displays ACT scores when Academics tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    expect(screen.getByText(/ELA/i)).toBeInTheDocument();
    expect(screen.getByText('17.7')).toBeInTheDocument();
    expect(screen.getByText(/Math/i)).toBeInTheDocument();
    expect(screen.getByText('18.2')).toBeInTheDocument();
  });

  it('displays ACT score progress bars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays demographics when Demographics tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    expect(screen.getByText(/English Learners/i)).toBeInTheDocument();
    expect(screen.getByText('29.0%')).toBeInTheDocument();
    expect(screen.getByText(/Low Income/i)).toBeInTheDocument();
    expect(screen.getByText('38.4%')).toBeInTheDocument();
  });

  it('displays diversity progress bars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows "Add to Compare" button when school not in comparison', () => {
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByRole('button', { name: /add to compare/i })).toBeInTheDocument();
  });

  it('shows "Remove from Compare" button when school in comparison', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    const addButton = screen.getByRole('button', { name: /add to compare/i });
    await user.click(addButton);

    expect(screen.getByRole('button', { name: /remove from compare/i })).toBeInTheDocument();
  });

  it('disables "Add to Compare" when 5 schools already selected', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['1', '2', '3', '4', '5']));

    renderWithProviders(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByRole('button', { name: /add to compare/i })).toBeDisabled();
  });
});

describe('Trend Display', () => {
  it('displays trend button for enrollment', () => {
    const schoolWithTrends: SchoolDetail = {
      ...mockSchoolDetail,
      metrics: {
        ...mockSchoolDetail.metrics,
        trends: {
          enrollment: {
            one_year: 50,
            three_year: 125,
            five_year: 200,
            ten_year: 300,
            fifteen_year: 400,
          },
        },
      },
    };

    renderWithProviders(<SchoolDetailView school={schoolWithTrends} />);

    expect(screen.getByRole('button', { name: /show trends/i })).toBeInTheDocument();
  });

  it('shows enrollment trend data when expanded', async () => {
    const user = userEvent.setup();
    const schoolWithTrends: SchoolDetail = {
      ...mockSchoolDetail,
      metrics: {
        ...mockSchoolDetail.metrics,
        enrollment: 1775,
        trends: {
          enrollment: {
            one_year: 50,
            three_year: 125,
            five_year: 200,
            ten_year: 300,
            fifteen_year: 400,
          },
        },
      },
    };

    renderWithProviders(<SchoolDetailView school={schoolWithTrends} />);

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByText('+50 students')).toBeInTheDocument();
  });

  it('shows ACT ELA trend button in academics tab', async () => {
    const user = userEvent.setup();
    const schoolWithTrends: SchoolDetail = {
      ...mockSchoolDetail,
      metrics: {
        ...mockSchoolDetail.metrics,
        act: {
          ela_avg: 17.7,
          math_avg: 18.2,
          science_avg: 18.9,
          overall_avg: 17.95,
        },
        trends: {
          act_ela: {
            one_year: -0.5,
            three_year: -1.2,
            five_year: 0.8,
            ten_year: 1.5,
            fifteen_year: -2.0,
          },
        },
      },
    };

    renderWithProviders(<SchoolDetailView school={schoolWithTrends} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    const trendButtons = screen.getAllByRole('button', { name: /show trends/i });
    expect(trendButtons.length).toBeGreaterThan(0);
  });

  it('shows demographic trend buttons in demographics tab', async () => {
    const user = userEvent.setup();
    const schoolWithTrends: SchoolDetail = {
      ...mockSchoolDetail,
      metrics: {
        ...mockSchoolDetail.metrics,
        demographics: {
          el_percentage: 29.0,
          low_income_percentage: 38.4,
        },
        trends: {
          el_percentage: {
            one_year: 2.0,
            three_year: 5.0,
            five_year: null,
            ten_year: null,
            fifteen_year: null,
          },
          low_income_percentage: {
            one_year: -1.5,
            three_year: -3.0,
            five_year: -5.0,
            ten_year: -7.5,
            fifteen_year: -10.0,
          },
        },
      },
    };

    renderWithProviders(<SchoolDetailView school={schoolWithTrends} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    const trendButtons = screen.getAllByRole('button', { name: /show trends/i });
    expect(trendButtons.length).toBeGreaterThan(0);
  });
});
