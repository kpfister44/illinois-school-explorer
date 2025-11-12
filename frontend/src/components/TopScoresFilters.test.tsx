// ABOUTME: Tests for TopScoresFilters component
// ABOUTME: Ensures tab selection calls change handler

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TopScoresFilters, { TopScoresFilterOption } from './TopScoresFilters';

const OPTIONS: TopScoresFilterOption[] = [
  { id: 'act-high', label: 'High ACT', assessment: 'act', level: 'high' },
  { id: 'iar-middle', label: 'Middle IAR', assessment: 'iar', level: 'middle' },
];

test('invokes onChange when tab selected', async () => {
  const handler = vi.fn();
  render(
    <TopScoresFilters value={OPTIONS[0].id} options={OPTIONS} onChange={handler} />
  );

  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: /Middle IAR/ }));
  expect(handler).toHaveBeenCalledWith('iar-middle');
});
