// ABOUTME: Tests for SchoolDetailView component
// ABOUTME: Verifies the single-scroll school page for high, elementary and mixed schools, including benchmarks and missing data

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import SchoolDetailView from './SchoolDetailView';
import { apiClient } from '@/lib/api/client';
import type { SchoolDetail, SimilarSchoolsResponse, StateBenchmark } from '@/lib/api/types';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

const STATE_BENCHMARKS: Record<string, StateBenchmark> = {
  act: {
    metric: 'act',
    level: 'high',
    schools: 684,
    band_low: 14.2,
    band_high: 20.7,
    years: [
      { year: 2010, average: 20.1, schools: 530 },
      { year: 2026, average: 17.55, schools: 684 },
    ],
  },
  iar: {
    metric: 'iar',
    level: 'elementary',
    schools: 2143,
    band_low: 21.5,
    band_high: 76.3,
    years: [
      { year: 2025, average: 47.9, schools: 2130 },
      { year: 2026, average: 49.6, schools: 2143 },
    ],
  },
};

const SIMILAR_SCHOOLS: SimilarSchoolsResponse = {
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
  ],
};

const highSchool: SchoolDetail = {
  id: 1,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  display_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  district: 'Township HSD 214',
  county: 'Cook',
  school_type: 'High School',
  grades_served: '9 - 12',
  designation: 'Approaching Exemplary',
  benchmarks: {
    act: {
      level: 'high',
      state_average: 17.55,
      state_schools: 684,
      district_average: 20.47,
      district_schools: 6,
      percentile: 64,
      similar_average: 18.27,
    },
    iar: null,
    el: {
      level: 'high',
      state_average: 18.14,
      state_schools: 379,
      district_average: 21.3,
      district_schools: 6,
      percentile: null,
      similar_average: null,
    },
    low_income: {
      level: 'high',
      state_average: 48.93,
      state_schools: 691,
      district_average: 27.1,
      district_schools: 6,
      percentile: null,
      similar_average: null,
    },
  },
  metrics: {
    enrollment: 1721,
    act: {
      ela_avg: 17.6,
      math_avg: 18.6,
      science_avg: 19.3,
      overall_avg: 18.1,
    },
    demographics: {
      el_percentage: 30.7,
      low_income_percentage: 35.2,
    },
    diversity: {
      white: 35.6,
      black: 2.0,
      hispanic: 47.9,
      asian: 9.8,
      pacific_islander: null,
      native_american: null,
      two_or_more: 3.8,
      mena: 0.8,
    },
    iar_ela_proficiency_pct: null,
    iar_math_proficiency_pct: null,
    iar_overall_proficiency_pct: null,
    trends: {
      act: { one_year: 0.15, three_year: 0.4, five_year: -0.5, ten_year: -3.2, fifteen_year: -3.9 },
    },
    historical: {
      enrollment: { yr_2026: 1721, yr_2025: 1775, yr_2010: 2044 },
      act: { yr_2026: 18.1, yr_2025: 17.9, yr_2020: null, yr_2019: 19.6, yr_2018: null, yr_2017: 21.4, yr_2010: 22.5 },
      el: { yr_2026: 30.7, yr_2025: 29.0, yr_2010: 5.7 },
      low_income: { yr_2026: 35.2, yr_2025: 38.4, yr_2010: 26.0 },
    },
  },
};

const elementarySchool: SchoolDetail = {
  id: 2,
  rcdts: '05-016-0590-04-2003',
  school_name: 'Clearmont Elem School',
  display_name: 'Clearmont Elementary School',
  city: 'Elk Grove Village',
  district: 'Comm Cons SD 59',
  county: 'Cook',
  school_type: 'Elementary School',
  grades_served: 'K - 5',
  designation: 'Exemplary',
  benchmarks: {
    act: null,
    iar: {
      level: 'elementary',
      state_average: 49.6,
      state_schools: 2143,
      district_average: 44.12,
      district_schools: 11,
      percentile: 58,
      similar_average: 52.4,
    },
    el: {
      level: 'elementary',
      state_average: 15.2,
      state_schools: 1637,
      district_average: 30.5,
      district_schools: 11,
      percentile: null,
      similar_average: null,
    },
    low_income: {
      level: 'elementary',
      state_average: 51.3,
      state_schools: 2365,
      district_average: 45.0,
      district_schools: 11,
      percentile: null,
      similar_average: null,
    },
  },
  metrics: {
    enrollment: 388,
    act: null,
    demographics: {
      el_percentage: null,
      low_income_percentage: 31.2,
    },
    diversity: {
      white: 75.0,
      black: null,
      hispanic: 25.0,
      asian: null,
      pacific_islander: null,
      native_american: null,
      two_or_more: null,
      mena: null,
    },
    iar_ela_proficiency_pct: 61.2,
    iar_math_proficiency_pct: 52.0,
    iar_overall_proficiency_pct: 56.6,
    trends: {
      iar: { one_year: 4.4, three_year: null, five_year: null, ten_year: null, fifteen_year: null },
      iar_ela: { one_year: 6.1, three_year: null, five_year: null, ten_year: null, fifteen_year: null },
      iar_math: { one_year: -2.5, three_year: null, five_year: null, ten_year: null, fifteen_year: null },
    },
    historical: {
      enrollment: { yr_2026: 388 },
      iar: { yr_2026: 56.6, yr_2025: 52.2 },
      iar_ela: { yr_2026: 61.2, yr_2025: 55.1 },
      iar_math: { yr_2026: 52.0, yr_2025: 54.5 },
    },
  },
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ComparisonProvider>{ui}</ComparisonProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function paragraph(text: string) {
  return (_: string, element: Element | null) =>
    element?.tagName === 'P' && element.textContent === text;
}

function section(name: RegExp | string) {
  return within(screen.getByRole('region', { name }));
}

beforeEach(() => {
  localStorage.clear();
  mockedGet.mockReset();
  mockedGet.mockImplementation(async (url: string, config?: { params?: { metric?: string } }) => {
    if (url === '/api/benchmarks/state') {
      return { data: STATE_BENCHMARKS[config?.params?.metric ?? ''] };
    }
    if (url.endsWith('/similar')) {
      return { data: SIMILAR_SCHOOLS };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
});

describe('SchoolDetailView header', () => {
  it('shows the display name as the headline with city, district and county', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Elk Grove High School' })).toBeInTheDocument();
    expect(screen.getByText('Elk Grove Village · Township HSD 214 · Cook County')).toBeInTheDocument();
  });

  it('shows the official name when it differs from the display name', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Clearmont Elementary School' })).toBeInTheDocument();
    expect(screen.getByText('Official name: Clearmont Elem School')).toBeInTheDocument();
  });

  it('leaves out the official name when it matches the display name', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.queryByText(/Official name/)).not.toBeInTheDocument();
  });

  it('shows grades, students and low income as three facts', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const facts = within(screen.getByRole('list', { name: 'Key facts' }));
    expect(facts.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '9–12Grades',
      '1,721Students',
      '35.2%Low income',
    ]);
  });

  it('marks missing facts as not reported', () => {
    const school: SchoolDetail = {
      ...highSchool,
      grades_served: null,
      metrics: {
        ...highSchool.metrics,
        enrollment: null,
        demographics: { el_percentage: null, low_income_percentage: null },
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    const facts = within(screen.getByRole('list', { name: 'Key facts' }));
    expect(facts.getAllByText('Not reported')).toHaveLength(3);
  });

  it('shows the state designation', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.getByText('Approaching Exemplary')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Second highest of five levels' })).toBeInTheDocument();
  });

  it('returns to the previous page from the back button', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/top-scores', '/school/05-016-2140-17-0002']} initialIndex={1}>
          <ComparisonProvider>
            <Routes>
              <Route path="/top-scores" element={<div>Leaderboard</div>} />
              <Route path="/school/:rcdts" element={<SchoolDetailView school={highSchool} />} />
            </Routes>
          </ComparisonProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });
});

describe('SchoolDetailView layout', () => {
  it('puts every section on one page with no tabs', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(['Test scores · 2026', 'Over time', 'Students', 'Enrollment']);
  });

  it('offers a link to each section', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const links = within(screen.getByRole('navigation', { name: 'Sections' }));
    expect(links.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Scores',
      'Over time',
      'Students',
      'Enrollment',
    ]);
  });
});

describe('SchoolDetailView for a high school', () => {
  it('leads the test scores with the ACT average and where it stands', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const scores = section('Test scores · 2026');
    expect(scores.getByText('average ACT, out of 36')).toBeInTheDocument();
    expect(
      scores.getByText(
        paragraph(
          'Higher than 64% of Illinois high schools, and below the average for its district.'
        )
      )
    ).toBeInTheDocument();
  });

  it('compares the ACT average with Illinois, the district and similar schools', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const rows = within(
      section('Test scores · 2026').getByRole('list', { name: 'Average ACT compared' })
    ).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'This school18.1',
      'Illinois17.6',
      'District20.5',
      'Similar schools18.3',
    ]);
  });

  it('leaves out the district when it has too few schools to average', () => {
    const school: SchoolDetail = {
      ...highSchool,
      benchmarks: {
        ...highSchool.benchmarks!,
        act: { ...highSchool.benchmarks!.act!, district_average: null, district_schools: 1 },
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    const scores = section('Test scores · 2026');
    expect(
      scores.getByText(paragraph('Higher than 64% of Illinois high schools.'))
    ).toBeInTheDocument();
    expect(scores.queryByText('District')).not.toBeInTheDocument();
  });

  it('leaves out similar schools when the school cannot be matched', () => {
    const school: SchoolDetail = {
      ...highSchool,
      benchmarks: {
        ...highSchool.benchmarks!,
        act: { ...highSchool.benchmarks!.act!, similar_average: null },
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    const scores = section('Test scores · 2026');
    expect(scores.queryByText(/Similar schools/)).not.toBeInTheDocument();
    expect(scores.queryByRole('button', { name: 'See similar schools' })).not.toBeInTheDocument();
  });

  it('says where most schools fall once the state figures arrive', async () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(
      await section('Test scores · 2026').findByText(
        /Shaded band: where most Illinois high schools fall, 14.2 to 20.7\./
      )
    ).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/benchmarks/state', {
      params: { metric: 'act', level: 'high' },
    });
  });

  it('opens the list of similar schools', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    await user.click(screen.getByRole('button', { name: 'See similar schools' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Similar schools' }));
    expect(await dialog.findByRole('link', { name: /Maine East High School/ })).toBeInTheDocument();
  });

  it('links to the explanation of the yardsticks', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(
      section('Test scores · 2026').getByRole('link', { name: 'How this works' })
    ).toHaveAttribute('href', '/how-this-works');
  });

  it('shows the score without yardsticks when the school has no benchmarks', () => {
    renderWithProviders(<SchoolDetailView school={{ ...highSchool, benchmarks: null }} />);

    const scores = section('Test scores · 2026');
    expect(scores.getByText('18.1')).toBeInTheDocument();
    expect(scores.queryByRole('list', { name: 'Average ACT compared' })).not.toBeInTheDocument();
    expect(scores.queryByText(/Higher than/)).not.toBeInTheDocument();
  });

  it('draws the Illinois average on the ACT chart', async () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(
      await section('Over time').findByRole('img', {
        name: /Illinois high school average: 17.6 in 2026\.$/,
      })
    ).toBeInTheDocument();
  });

  it('charts the ACT average over time with the SAT years explained', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const overTime = section('Over time');
    expect(
      overTime.getByRole('img', { name: 'Average ACT from 2010 to 2026: 22.5 in 2010, 18.1 in 2026.' })
    ).toBeInTheDocument();
    expect(overTime.getByText(/From 2019 to 2024 Illinois gave the SAT/)).toBeInTheDocument();
  });

  it('shows each ACT subject score plainly', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const subjects = within(screen.getByRole('list', { name: 'ACT subject scores' }));
    expect(subjects.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '17.6English',
      '18.6Math',
      '19.3Science',
    ]);
  });

  it('opens the year-by-year ACT table', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    await user.click(screen.getByRole('button', { name: 'See every year' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Average ACT' }));
    expect(dialog.getByRole('row', { name: /2019/ })).toHaveTextContent('19.6');
    expect(dialog.getByRole('row', { name: /2019/ })).toHaveTextContent('SAT, converted');
    expect(dialog.getByRole('row', { name: /2018/ })).toHaveTextContent('No data');
  });

  it('shows no IAR results', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.queryByText(/IAR/)).not.toBeInTheDocument();
  });
});

describe('SchoolDetailView for an elementary school', () => {
  it('leads the test scores with IAR proficiency and where it stands', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    const scores = section('Test scores · 2026');
    expect(scores.getByText('of students proficient on the IAR')).toBeInTheDocument();
    expect(
      scores.getByText(
        paragraph(
          'Higher than 58% of Illinois elementary schools, and above the average for its district.'
        )
      )
    ).toBeInTheDocument();
  });

  it('compares IAR proficiency with Illinois, the district and similar schools', async () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    const scores = section('Test scores · 2026');
    const rows = within(scores.getByRole('list', { name: 'IAR proficiency compared' })).getAllByRole(
      'listitem'
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      'This school56.6%',
      'Illinois49.6%',
      'District44.1%',
      'Similar schools52.4%',
    ]);
    expect(
      await scores.findByText(/where most Illinois elementary schools fall, 21.5% to 76.3%\./)
    ).toBeInTheDocument();
  });

  it('compares 2025 and 2026 for each IAR subject', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    const overTime = section('Over time');
    expect(overTime.getByRole('row', { name: /Overall/ })).toHaveTextContent('Overall52.2%56.6%+4.4 pts');
    expect(overTime.getByRole('row', { name: /English language arts/ })).toHaveTextContent(
      'English language arts55.1%61.2%+6.1 pts'
    );
    expect(overTime.getByRole('row', { name: /Math/ })).toHaveTextContent('Math54.5%52.0%-2.5 pts');
  });

  it('explains why IAR history starts in 2025', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    expect(section('Over time').getByText(/scoring changed in 2025/)).toBeInTheDocument();
  });

  it('shows no ACT chart or scores', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    expect(screen.queryByText(/ACT/)).not.toBeInTheDocument();
  });

  it('says when there is no 2025 IAR result to compare', () => {
    const school: SchoolDetail = {
      ...elementarySchool,
      metrics: {
        ...elementarySchool.metrics,
        trends: {},
        historical: { iar: { yr_2026: 56.6 }, iar_ela: { yr_2026: 61.2 }, iar_math: { yr_2026: 52.0 } },
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    expect(section('Over time').getByRole('row', { name: /Overall/ })).toHaveTextContent(
      'OverallNo data56.6%No data'
    );
  });
});

describe('SchoolDetailView test score edge cases', () => {
  it('says when a school has no published test scores', () => {
    const school: SchoolDetail = {
      ...elementarySchool,
      metrics: {
        ...elementarySchool.metrics,
        iar_ela_proficiency_pct: null,
        iar_math_proficiency_pct: null,
        iar_overall_proficiency_pct: null,
        trends: {},
        historical: {},
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    expect(section('Test scores · 2026').getByText(/No 2026 test scores are published/)).toBeInTheDocument();
    expect(section('Over time').getByText('No test score history is published for this school.')).toBeInTheDocument();
  });

  it('treats ACT scores that are all missing as no ACT results', () => {
    const school: SchoolDetail = {
      ...highSchool,
      metrics: {
        ...highSchool.metrics,
        act: { ela_avg: null, math_avg: null, science_avg: null, overall_avg: null },
        trends: {},
        historical: {},
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    expect(section('Test scores · 2026').getByText(/No 2026 test scores are published/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'ACT subject scores' })).not.toBeInTheDocument();
  });

  it('still charts earlier ACT years when this year has no score', () => {
    const school: SchoolDetail = {
      ...highSchool,
      metrics: {
        ...highSchool.metrics,
        act: { ela_avg: null, math_avg: null, science_avg: null, overall_avg: null },
        trends: {},
        historical: { act: { yr_2025: 17.9, yr_2010: 22.5 } },
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    expect(
      section('Over time').getByRole('img', { name: 'Average ACT from 2010 to 2025: 22.5 in 2010, 17.9 in 2025.' })
    ).toBeInTheDocument();
  });

  it('shows both ACT and IAR for a school that takes both', () => {
    const school: SchoolDetail = {
      ...highSchool,
      grades_served: '6 - 12',
      designation: 'Dually Designated',
      metrics: {
        ...highSchool.metrics,
        iar_ela_proficiency_pct: 61.2,
        iar_math_proficiency_pct: 52.0,
        iar_overall_proficiency_pct: 56.6,
      },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    const scores = section('Test scores · 2026');
    expect(scores.getByText('average ACT, out of 36')).toBeInTheDocument();
    expect(scores.getByText('of students proficient on the IAR')).toBeInTheDocument();
    const overTime = section('Over time');
    expect(overTime.getByRole('img', { name: /^Average ACT/ })).toBeInTheDocument();
    expect(overTime.getByRole('row', { name: /Overall/ })).toBeInTheDocument();
  });
});

describe('SchoolDetailView students', () => {
  it('shows English learners and low income beside the state figures', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const students = section('Students');
    expect(students.getByText('English learners')).toBeInTheDocument();
    expect(students.getByText('30.7%')).toBeInTheDocument();
    expect(students.getByText('Illinois high schools: 18.1%')).toBeInTheDocument();
    expect(students.getByText('Low income')).toBeInTheDocument();
    expect(students.getByText('35.2%')).toBeInTheDocument();
    expect(students.getByText('Illinois high schools: 48.9%')).toBeInTheDocument();
  });

  it('shows no state figure when the school has no benchmarks', () => {
    renderWithProviders(<SchoolDetailView school={{ ...highSchool, benchmarks: null }} />);

    expect(section('Students').queryByText(/Illinois high schools/)).not.toBeInTheDocument();
  });

  it('opens the history of a student measure from its sparkline', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    await user.click(screen.getByRole('button', { name: 'English learners history' }));

    const dialog = within(screen.getByRole('dialog', { name: 'English learners' }));
    expect(dialog.getByRole('row', { name: /2010/ })).toHaveTextContent('5.7%');
  });

  it('says when a measure is withheld and offers no sparkline without history', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    const students = section('Students');
    expect(students.getByText('Not reported')).toBeInTheDocument();
    expect(students.getByText(/ISBE withholds small counts/)).toBeInTheDocument();
    expect(students.queryByRole('button', { name: 'English learners history' })).not.toBeInTheDocument();
  });

  it('shows every race and ethnicity group that has data', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const students = section('Students');
    expect(students.getByRole('img', { name: /^Race and ethnicity: Hispanic 47.9%/ })).toBeInTheDocument();
    expect(students.getByText('Middle Eastern or North African')).toBeInTheDocument();
    expect(students.getByText('Two or more races')).toBeInTheDocument();
    expect(students.queryByText('Pacific Islander')).not.toBeInTheDocument();
  });
});

describe('SchoolDetailView enrollment', () => {
  it('shows enrollment and its change since the first reported year', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    const enrollment = section('Enrollment');
    expect(enrollment.getByText('1,721')).toBeInTheDocument();
    expect(enrollment.getByText('Down 16% since 2010')).toBeInTheDocument();
    expect(enrollment.getByRole('button', { name: 'Enrollment history' })).toBeInTheDocument();
  });

  it('shows no change or sparkline when only this year is reported', () => {
    renderWithProviders(<SchoolDetailView school={elementarySchool} />);

    const enrollment = section('Enrollment');
    expect(enrollment.getByText('388')).toBeInTheDocument();
    expect(enrollment.queryByText(/since/)).not.toBeInTheDocument();
    expect(enrollment.queryByRole('button', { name: 'Enrollment history' })).not.toBeInTheDocument();
  });

  it('says when enrollment is not reported', () => {
    const school: SchoolDetail = {
      ...elementarySchool,
      metrics: { ...elementarySchool.metrics, enrollment: null, historical: {} },
    };

    renderWithProviders(<SchoolDetailView school={school} />);

    expect(section('Enrollment').getByText('Not reported')).toBeInTheDocument();
  });
});

describe('SchoolDetailView comparison', () => {
  it('shows "Add to Compare" button when school not in comparison', () => {
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.getByRole('button', { name: /add to compare/i })).toBeInTheDocument();
  });

  it('shows "Remove from Compare" button when school in comparison', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchoolDetailView school={highSchool} />);

    await user.click(screen.getByRole('button', { name: /add to compare/i }));

    expect(screen.getByRole('button', { name: /remove from compare/i })).toBeInTheDocument();
  });

  it('disables "Add to Compare" when 5 schools already selected', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['1', '2', '3', '4', '5']));

    renderWithProviders(<SchoolDetailView school={highSchool} />);

    expect(screen.getByRole('button', { name: /add to compare/i })).toBeDisabled();
  });
});
