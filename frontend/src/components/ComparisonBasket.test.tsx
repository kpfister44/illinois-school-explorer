// ABOUTME: Tests for ComparisonBasket component
// ABOUTME: Verifies bottom bar display and Compare button behavior

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import type { School } from '@/lib/api/types';
import ComparisonBasket from './ComparisonBasket';

const mockSchools: School[] = [
  {
    id: 1,
    rcdts: '12-345-6789-01-0001',
    school_name: 'Test High School',
    city: 'Springfield',
    district: 'Test District',
    school_type: 'High School',
  },
  {
    id: 2,
    rcdts: '12-345-6789-01-0002',
    school_name: 'Sample Elementary',
    city: 'Chicago',
    district: 'Sample District',
    school_type: 'Elementary School',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ComparisonProvider>{ui}</ComparisonProvider>
    </BrowserRouter>
  );
}

describe('ComparisonBasket', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not render when comparison list is empty', () => {
    const { container } = renderWithProviders(<ComparisonBasket schools={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders basket with school badges when schools are selected', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    expect(screen.getByText(/compare schools/i)).toBeInTheDocument();
    expect(screen.getByText('Test High School')).toBeInTheDocument();
    expect(screen.getByText('Sample Elementary')).toBeInTheDocument();
  });

  it('shows count of selected schools', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    expect(screen.getByText('2 schools selected')).toBeInTheDocument();
  });

  it('removes school when X button clicked', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByText('Test High School')).not.toBeInTheDocument();
  });

  it('disables Compare button when less than 2 schools', () => {
    localStorage.setItem('school-comparison', JSON.stringify([mockSchools[0].rcdts]));

    renderWithProviders(<ComparisonBasket schools={[mockSchools[0]]} />);

    const compareButton = screen.getByRole('button', { name: 'Compare' });
    expect(compareButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables Compare button when 2 or more schools', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const compareButton = screen.getByRole('button', { name: 'Compare' });
    expect(compareButton).toHaveAttribute('aria-disabled', 'false');
    expect(compareButton).toHaveAttribute('href', '/compare');
  });

  it('clears all schools when Clear All clicked', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    const { container } = renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const clearButtons = screen.getAllByRole('button', { name: /clear all/i });
    fireEvent.click(clearButtons[0]);

    expect(container.firstChild).toBeNull();
  });

  it('navigates to compare page when Compare button clicked', () => {
    localStorage.setItem('school-comparison', JSON.stringify(mockSchools.map((s) => s.rcdts)));

    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const compareButton = screen.getByRole('button', { name: 'Compare' });
    expect(compareButton).toHaveAttribute('href', '/compare');
  });
});
