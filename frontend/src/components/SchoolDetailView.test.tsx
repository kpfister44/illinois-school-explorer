// ABOUTME: Tests for SchoolDetailView component
// ABOUTME: Verifies tabbed interface and metric display

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
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

describe('SchoolDetailView', () => {
  it('displays school name and basic info', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
    expect(screen.getByText(/Cook/)).toBeInTheDocument();
  });

  it('displays school type and grades badges', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('High School')).toBeInTheDocument();
    expect(screen.getByText('Grades 9-12')).toBeInTheDocument();
  });

  it('renders tabs for Overview, Academics, Demographics', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /academics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /demographics/i })).toBeInTheDocument();
  });

  it('displays enrollment in Overview tab by default', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText(/enrollment/i)).toBeInTheDocument();
    expect(screen.getByText('1,775')).toBeInTheDocument();
  });

  it('displays ACT scores when Academics tab is clicked', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    expect(screen.getByText(/ELA/i)).toBeInTheDocument();
    expect(screen.getByText('17.7')).toBeInTheDocument();
    expect(screen.getByText(/Math/i)).toBeInTheDocument();
    expect(screen.getByText('18.2')).toBeInTheDocument();
  });

  it('displays ACT score progress bars', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays demographics when Demographics tab is clicked', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    expect(screen.getByText(/English Learners/i)).toBeInTheDocument();
    expect(screen.getByText('29.0%')).toBeInTheDocument();
    expect(screen.getByText(/Low Income/i)).toBeInTheDocument();
    expect(screen.getByText('38.4%')).toBeInTheDocument();
  });

  it('displays diversity progress bars', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
