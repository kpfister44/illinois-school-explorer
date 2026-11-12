// ABOUTME: Tests for the SimilarSchoolsSheet component
// ABOUTME: Verifies the list is requested on opening and shows each school, with empty and error states

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SimilarSchoolsSheet from './SimilarSchoolsSheet';
import { apiClient } from '@/lib/api/client';
import type { SimilarSchoolsResponse } from '@/lib/api/types';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

const SIMILAR: SimilarSchoolsResponse = {
  assessment: 'act',
  level: 'high',
  average: 18.27,
  schools: [
    {
      rcdts: '05-016-2070-17-0002',
      school_name: 'Maine East High School',
      display_name: 'Maine East High School',
      city: 'Park Ridge',
      district: 'Maine Township HSD 207',
      enrollment: 1804,
      low_income_percentage: 38.1,
      el_percentage: 21.4,
      score: 19.25,
    },
    {
      rcdts: '05-016-2120-17-0001',
      school_name: 'East Leyden High School',
      display_name: 'East Leyden High School',
      city: 'Franklin Park',
      district: 'Leyden CHSD 212',
      enrollment: 1730,
      low_income_percentage: 41.0,
      el_percentage: null,
      score: 17.4,
    },
  ],
};

function renderSheet() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SimilarSchoolsSheet rcdts="05-016-2140-17-0002" assessment="act" level="high">
          <button type="button">See similar schools</button>
        </SimilarSchoolsSheet>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function openSheet() {
  await userEvent.setup().click(screen.getByRole('button', { name: 'See similar schools' }));
  return within(screen.getByRole('dialog', { name: 'Similar schools' }));
}

beforeEach(() => {
  mockedGet.mockReset();
});

describe('SimilarSchoolsSheet', () => {
  it('requests nothing until it is opened', () => {
    renderSheet();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('lists the similar schools with their score and context', async () => {
    mockedGet.mockResolvedValue({ data: SIMILAR });
    renderSheet();

    const dialog = await openSheet();

    const first = await dialog.findByRole('link', { name: /Maine East High School/ });
    expect(first).toHaveAttribute('href', '/school/05-016-2070-17-0002');
    expect(first).toHaveTextContent('Park Ridge · 1,804 students · 38.1% low income');
    expect(first).toHaveTextContent('19.3');
    expect(dialog.getAllByRole('link')).toHaveLength(2);
    expect(mockedGet).toHaveBeenCalledWith('/api/schools/05-016-2140-17-0002/similar', {
      params: { assessment: 'act' },
    });
  });

  it('explains how the schools were chosen and gives their average', async () => {
    mockedGet.mockResolvedValue({ data: SIMILAR });
    renderSheet();

    const dialog = await openSheet();

    expect(
      dialog.getByText(/Illinois high schools most like this one in family income, English learners and size/)
    ).toBeInTheDocument();
    expect(await dialog.findByText('Their average ACT is 18.3.')).toBeInTheDocument();
  });

  it('says when the school cannot be matched', async () => {
    mockedGet.mockResolvedValue({ data: { ...SIMILAR, average: null, schools: [] } });
    renderSheet();

    const dialog = await openSheet();

    expect(await dialog.findByText(/cannot be matched/)).toBeInTheDocument();
  });

  it('says when the list fails to load', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'));
    renderSheet();

    const dialog = await openSheet();

    expect(await dialog.findByText('The similar schools could not be loaded.')).toBeInTheDocument();
  });
});
