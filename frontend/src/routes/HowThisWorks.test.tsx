// ABOUTME: Tests for the How this works page
// ABOUTME: Verifies each yardstick is explained, including how averages differ from ISBE's

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HowThisWorks from './HowThisWorks';

function renderPage() {
  return render(
    <MemoryRouter>
      <HowThisWorks />
    </MemoryRouter>
  );
}

describe('HowThisWorks', () => {
  it('explains each yardstick under its own heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'How this works' })).toBeInTheDocument();
    for (const name of [
      'Illinois average',
      'District average',
      'Higher than a share of schools',
      'Where most schools fall',
      'Similar schools',
      'Which schools a test is compared with',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });

  it('says its averages count each school once and so differ from ISBE figures', () => {
    renderPage();

    expect(screen.getByText(/Every school counts once, whatever its size/)).toBeInTheDocument();
    expect(screen.getByText(/ISBE's published state figures count every student/)).toBeInTheDocument();
  });

  it('says a withheld English learner share counts as zero when matching', () => {
    renderPage();

    expect(screen.getByText(/counts as zero for matching only/)).toBeInTheDocument();
  });
});
