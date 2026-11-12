// ABOUTME: Tests for the SectionLinks component
// ABOUTME: Verifies each link scrolls to its section without changing the address

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SectionLinks from './SectionLinks';

const SECTIONS = [
  { id: 'scores', label: 'Scores' },
  { id: 'students', label: 'Students' },
];

describe('SectionLinks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers a control for each section', () => {
    render(<SectionLinks sections={SECTIONS} />);

    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();
  });

  it('scrolls to the section when its control is pressed', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    render(
      <>
        <SectionLinks sections={SECTIONS} />
        <section id="scores" />
        <section id="students" />
      </>
    );
    document.getElementById('students')!.scrollIntoView = scrollIntoView;
    const addressBefore = window.location.href;

    await user.click(screen.getByRole('button', { name: 'Students' }));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(addressBefore);
  });
});
