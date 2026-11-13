// ABOUTME: Tests for a school's row in the Top scores ranking
// ABOUTME: Verifies the rank, context figures, designation, score and link

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import { TOP_SCORE_ENTRY } from '@/test/topScores';
import TopScoreRow from './TopScoreRow';

function renderRow(ui: React.ReactNode) {
  render(
    <MemoryRouter>
      <ul>{ui}</ul>
    </MemoryRouter>
  );
}

test('links to the school and shows its rank, name and score', () => {
  renderRow(<TopScoreRow entry={TOP_SCORE_ENTRY} assessment="act" />);

  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('href', `/school/${TOP_SCORE_ENTRY.rcdts}`);
  expect(link).toHaveTextContent('Rank 7');
  expect(link).toHaveTextContent('Elk Grove High School');
  expect(link).toHaveTextContent('18.1');
});

test('shows the town, enrollment and low-income share', () => {
  renderRow(<TopScoreRow entry={TOP_SCORE_ENTRY} assessment="act" />);

  expect(screen.getByText('Elk Grove Village · 1,721 students · 35.2% low income')).toBeVisible();
});

test('says when enrollment or low-income share is not reported', () => {
  renderRow(
    <TopScoreRow
      entry={{ ...TOP_SCORE_ENTRY, enrollment: null, low_income_percentage: null }}
      assessment="act"
    />
  );

  expect(
    screen.getByText('Elk Grove Village · Enrollment not reported · Low income not reported')
  ).toBeVisible();
});

test('shows the state designation', () => {
  renderRow(<TopScoreRow entry={TOP_SCORE_ENTRY} assessment="act" />);

  expect(screen.getByText('Approaching Exemplary')).toBeVisible();
});

test('shows the ACT subject averages under an ACT score', () => {
  renderRow(<TopScoreRow entry={TOP_SCORE_ENTRY} assessment="act" />);

  expect(screen.getByText('ELA 17.6 · Math 18.6')).toBeVisible();
});

test('shows an IAR score as a percentage with no subject averages', () => {
  renderRow(
    <TopScoreRow
      entry={{ ...TOP_SCORE_ENTRY, score: 72.5, act_ela_avg: null, act_math_avg: null }}
      assessment="iar"
    />
  );

  expect(screen.getByText('72.5%')).toBeVisible();
  expect(screen.queryByText(/ELA/)).not.toBeInTheDocument();
});

test('marks the looked-up school with the highlighter', () => {
  renderRow(<TopScoreRow entry={TOP_SCORE_ENTRY} assessment="act" highlighted />);

  expect(screen.getByText('Elk Grove High School')).toHaveClass('bg-highlighter');
});
