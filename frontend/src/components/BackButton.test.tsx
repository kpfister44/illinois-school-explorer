// ABOUTME: Tests for BackButton component
// ABOUTME: Verifies it returns to the previous page, or Home when there is none

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import BackButton from './BackButton';

function renderAt(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <div>Home</div> },
      { path: '/search', element: <div>Results</div> },
      { path: '/school/:rcdts', element: <BackButton /> },
    ],
    { initialEntries, initialIndex: initialEntries.length - 1 }
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('BackButton', () => {
  it('returns to the page the visitor came from', async () => {
    const user = userEvent.setup();
    const router = renderAt(['/search?q=elk', '/school/05-016-2140-17-0002']);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(router.state.location.pathname).toBe('/search');
    expect(router.state.location.search).toBe('?q=elk');
  });

  it('goes Home when the visitor landed directly on the page', async () => {
    const user = userEvent.setup();
    const router = renderAt(['/school/05-016-2140-17-0002']);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(router.state.location.pathname).toBe('/');
  });
});
