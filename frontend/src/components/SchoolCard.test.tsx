// ABOUTME: Tests for SchoolCard component
// ABOUTME: Verifies school info display and click navigation

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SchoolCard from './SchoolCard';
import { School } from '@/lib/api/types';

const mockSchool: School = {
  id: 1,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  district: 'Township HSD 214',
  school_type: 'High School',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SchoolCard', () => {
  it('displays school name', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
  });

  it('displays city and district', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
    expect(screen.getByText(/Township HSD 214/)).toBeInTheDocument();
  });

  it('displays school type badge', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText('High School')).toBeInTheDocument();
  });

  it('navigates to school detail when clicked', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);

    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/school/05-016-2140-17-0002');
  });

  it('handles missing optional fields gracefully', () => {
    const schoolWithoutOptionals: School = {
      id: 2,
      rcdts: '12-345-6789-01-0001',
      school_name: 'Test School',
      city: 'Chicago',
      district: null,
      school_type: null,
    };

    renderWithRouter(<SchoolCard school={schoolWithoutOptionals} />);

    expect(screen.getByText('Test School')).toBeInTheDocument();
    expect(screen.getByText('Chicago')).toBeInTheDocument();
  });
});
