# Illinois School Explorer Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the Illinois School Explorer UI so people can search, inspect, compare, and rank schools against the FastAPI backend (including the new `/api/top-scores` endpoint).

**Architecture:** React app bootstrapped with Vite + TypeScript, styled via Tailwind and shadcn/ui primitives, React Router for pages, TanStack Query for server state, and shared comparison context persisted to `localStorage`. Axios-based client talks to FastAPI running on `http://localhost:8000`.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), React Router v6, TanStack Query v5, Axios, Vitest + React Testing Library, Playwright.

---

### Task 1: App shell, theming, and providers

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/App.test.tsx`

**Step 1: Write the failing test**

`frontend/src/App.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from './App';

test('renders branded header and home hero copy', () => {
  const router = createMemoryRouter([
    { path: '/', element: <App /> },
  ]);
  render(<RouterProvider router={router} />);

  expect(screen.getByRole('link', { name: /Illinois School Explorer/i })).toBeVisible();
  expect(screen.getByText(/Search for Illinois Schools/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- App.test.tsx`

Expected: FAIL because the layout/branding is not rendered yet.

**Step 3: Write minimal implementation**

1. Install shared UI primitives once so shadcn components exist:
   ```bash
   cd frontend
   npx shadcn@latest add button card input textarea tabs badge table alert skeleton toast command select scroll-area toggle-group
   ```
2. Update `tailwind.config.js` with shadcn presets and semantic colors:
   ```ts
   import { fontFamily } from 'tailwindcss/defaultTheme'
   export default {
     darkMode: ['class'],
     content: ['./index.html', './src/**/*.{ts,tsx}'],
     theme: {
       extend: {
         fontFamily: { sans: ['"Inter"', ...fontFamily.sans] },
         colors: {
           brand: {
             DEFAULT: '#0f172a',
             foreground: '#f8fafc',
           },
         },
       },
     },
     plugins: [require('tailwindcss-animate')],
   }
   ```
3. Replace `src/index.css` with Tailwind directives and smooth background:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   body {
     @apply bg-muted/40 text-foreground antialiased;
   }
   ```
4. Update `src/main.tsx` to mount `<App />` inside the shadcn `ThemeProvider` (if used) and React Query context.
5. Implement `src/App.tsx` with BrowserRouter, header, container grid, `ComparisonProvider`, `ComparisonBasket`, and `<Toaster />` similar to:
   ```tsx
   import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   import { Toaster } from '@/components/ui/toaster';
   import { ComparisonProvider } from '@/contexts/ComparisonContext';
   import ComparisonBasket from '@/components/ComparisonBasket';
   import Home from '@/routes/Home';
   import SearchResults from '@/routes/SearchResults';
   import SchoolDetail from '@/routes/SchoolDetail';
   import Compare from '@/routes/Compare';
   import TopScores from '@/routes/TopScores';
   import NotFound from '@/routes/NotFound';

   const queryClient = new QueryClient({
     defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
   });

   export default function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <ComparisonProvider>
           <BrowserRouter>
             <div className="min-h-screen bg-background pb-28">
               <header className="border-b bg-white/70 backdrop-blur">
                 <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
                   <Link to="/" className="text-3xl font-bold tracking-tight hover:text-primary">
                     Illinois School Explorer
                   </Link>
                   <Link to="/top-scores" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                     View Top Scores
                   </Link>
                 </div>
               </header>
               <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                 <Routes>
                   <Route path="/" element={<Home />} />
                   <Route path="/search" element={<SearchResults />} />
                   <Route path="/school/:rcdts" element={<SchoolDetail />} />
                   <Route path="/compare" element={<Compare />} />
                   <Route path="/top-scores" element={<TopScores />} />
                   <Route path="*" element={<NotFound />} />
                 </Routes>
               </main>
             </div>
             <ComparisonBasket />
             <Toaster />
           </BrowserRouter>
         </ComparisonProvider>
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     );
   }
   ```

**Step 4: Re-run the focused test**

Run: `cd frontend && npm run test -- App.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
cd frontend
git add src/App.tsx src/main.tsx src/index.css tailwind.config.js src/components/ui
git commit -m "feat(frontend): scaffold app shell and theming"
```

---

### Task 2: API client, shared types, and React Query helpers

**Files:**
- Modify: `frontend/src/lib/api/types.ts`
- Modify: `frontend/src/lib/api/client.ts`
- Modify: `frontend/src/lib/api/queries.ts`
- Test: `frontend/src/lib/api/queries.test.ts`

**Step 1: Write the failing test**

`frontend/src/lib/api/queries.test.ts`
```ts
import { http } from './client';
import { getSchoolDetail, searchSchools, getTopScores } from './queries';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

test('searchSchools hits /api/search with query + limit', async () => {
  const spy = vi.spyOn(http, 'get').mockResolvedValue({ data: { results: [], total: 0 } });
  await searchSchools('oak', 5);
  expect(spy).toHaveBeenCalledWith('/api/search', { params: { q: 'oak', limit: 5 } });
});

test('getSchoolDetail fetches a single school', async () => {
  const spy = vi.spyOn(http, 'get').mockResolvedValue({ data: { id: 1 } });
  await getSchoolDetail('05-016-2140-17-0002');
  expect(spy).toHaveBeenCalledWith('/api/schools/05-016-2140-17-0002');
});

test('getTopScores forwards assessment + level and returns typed entries', async () => {
  vi.spyOn(http, 'get').mockResolvedValue({
    data: {
      results: [
        {
          rank: 1,
          rcdts: '11-111-1111-11-0001',
          school_name: 'Test High',
          city: 'Chicago',
          level: 'high',
          score: 24.5,
        },
      ],
    },
  });
  const payload = await getTopScores({ assessment: 'act', level: 'high', limit: 25 });
  expect(payload.results[0].score).toBe(24.5);
});
```

**Step 2: Run the tests (expect failure)**

Run: `cd frontend && npm run test -- src/lib/api/queries.test.ts`

Expected: FAIL because helper functions/types are missing.

**Step 3: Implement minimal code**

1. `src/lib/api/types.ts`: extend existing types with backend-aligned fields (EL%, low-income, diversity, ACT metrics, and new leaderboard models):
   ```ts
   export interface TopScoreEntry {
     rank: number;
     rcdts: string;
     school_name: string;
     city: string;
     district: string | null;
     school_type: string | null;
     level: 'elementary' | 'middle' | 'high';
     enrollment: number | null;
     score: number;
   }

   export interface TopScoresResponse {
     results: TopScoreEntry[];
   }
   ```
2. `src/lib/api/client.ts`: create Axios instance with base URL + timeout + JSON headers and export for tests:
   ```ts
   import axios from 'axios';
   export const http = axios.create({
     baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
     timeout: 8000,
   });
   ```
3. `src/lib/api/queries.ts`: implement typed helpers using `http.get`:
   ```ts
   export function searchSchools(q: string, limit = 10) {
     return http.get<SearchResponse>('/api/search', { params: { q, limit } }).then((r) => r.data);
   }

   export function getSchoolDetail(rcdts: string) {
     return http.get<SchoolDetail>(`/api/schools/${rcdts}`).then((r) => r.data);
   }

   export function compareSchools(ids: string[]) {
     return http
       .get<CompareResponse>('/api/schools/compare', { params: { rcdts: ids.join(',') } })
       .then((r) => r.data);
   }

   export function getTopScores(params: { assessment: 'act' | 'iar'; level: 'high' | 'middle' | 'elementary'; limit?: number }) {
     return http.get<TopScoresResponse>('/api/top-scores', { params }).then((r) => r.data);
   }
   ```

**Step 4: Re-run the tests**

Run: `cd frontend && npm run test -- src/lib/api/queries.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/api/types.ts frontend/src/lib/api/client.ts frontend/src/lib/api/queries.ts frontend/src/lib/api/queries.test.ts
git commit -m "feat(frontend): add typed API client helpers"
```

---

### Task 3: SearchBar autocomplete component

**Files:**
- Modify: `frontend/src/components/SearchBar.tsx`
- Test: `frontend/src/components/SearchBar.test.tsx`

**Step 1: Write the failing test**

`frontend/src/components/SearchBar.test.tsx`
```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SearchBar from './SearchBar';
import * as queries from '@/lib/api/queries';

vi.spyOn(queries, 'searchSchools');

it('debounces input and shows autocomplete results', async () => {
  vi.spyOn(queries, 'searchSchools').mockResolvedValue({
    results: [
      { rcdts: '11', school_name: 'Sample High', city: 'Normal', district: 'Unit 5', school_type: 'High School' },
    ],
    total: 1,
  });

  render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sam' } });

  await waitFor(() => expect(screen.getByText('Sample High')).toBeVisible());
});
```

**Step 2: Run the test (expect failure)**

Run: `cd frontend && npm run test -- src/components/SearchBar.test.tsx`

Expected: FAIL because component logic/UI is not implemented.

**Step 3: Implement minimal component**

`frontend/src/components/SearchBar.tsx`
```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { searchSchools } from '@/lib/api/queries';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchBar() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const debounced = useDebounce(value, 300);
  const enabled = debounced.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchSchools(debounced, 10),
    enabled,
  });

  const handleSubmit = (text: string) => {
    if (!text) return;
    const url = new URLSearchParams({ q: text });
    navigate(`/search?${url.toString()}`, { replace: location.pathname.startsWith('/search') });
  };

  const handleSelect = (rcdts: string) => {
    navigate(`/school/${rcdts}`);
    setValue('');
  };

  return (
    <Command className="rounded-lg border bg-white shadow-md">
      <CommandInput
        placeholder="Search for schools by name or city..."
        value={value}
        onValueChange={(next) => {
          setValue(next);
          if (next.length >= 2) handleSubmit(next);
        }}
        aria-label="Search schools"
      />
      <CommandList>
        {enabled && !isFetching && data && data.results.length === 0 && (
          <CommandEmpty>No schools found.</CommandEmpty>
        )}
        {enabled && data && data.results.length > 0 && (
          <CommandGroup heading="Schools">
            {data.results.map((school) => (
              <CommandItem key={school.rcdts} onSelect={() => handleSelect(school.rcdts)}>
                <div className="flex flex-col">
                  <span className="font-medium">{school.school_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {school.city}
                    {school.district ? ` • ${school.district}` : ''}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
```

**Step 4: Re-run the test**

Run: `cd frontend && npm run test -- src/components/SearchBar.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/SearchBar.tsx frontend/src/components/SearchBar.test.tsx
git commit -m "feat(frontend): add search autocomplete"
```

---

### Task 4: Search results page and SchoolCard preview UI

**Files:**
- Modify: `frontend/src/components/SchoolCard.tsx`
- Modify: `frontend/src/routes/SearchResults.tsx`
- Test: `frontend/src/components/SchoolCard.test.tsx`
- Test: `frontend/src/routes/SearchResults.test.tsx`

**Step 1: Write the failing tests**

`frontend/src/components/SchoolCard.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import SchoolCard from './SchoolCard';

it('shows school metadata and compare action', () => {
  render(
    <SchoolCard
      school={{
        id: 1,
        rcdts: '11',
        school_name: 'Sample High',
        city: 'Normal',
        district: 'Unit 5',
        school_type: 'High School',
      }}
    />
  );
  expect(screen.getByText('Sample High')).toBeVisible();
  expect(screen.getByRole('button', { name: /Add to Compare/i })).toBeEnabled();
});
```

`frontend/src/routes/SearchResults.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchResults from './SearchResults';
import * as queries from '@/lib/api/queries';

const queryClient = new QueryClient();

it('renders list of school cards', async () => {
  vi.spyOn(queries, 'searchSchools').mockResolvedValue({
    results: [
      { id: 1, rcdts: '11', school_name: 'Sample High', city: 'Normal', district: 'Unit 5', school_type: 'High School' },
    ],
    total: 1,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/search?q=sample']}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  expect(await screen.findByText('Found 1 school')).toBeVisible();
});
```

**Step 2: Run the tests (expect failure)**

Run: `cd frontend && npm run test -- src/components/SchoolCard.test.tsx src/routes/SearchResults.test.tsx`

Expected: FAIL because UI is missing.

**Step 3: Implement minimal code**

1. `SchoolCard.tsx`: compose shadcn `Card`, `Badge`, `Button`, `Skeleton` for preview metrics and action button tied into comparison context.
   ```tsx
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { Badge } from '@/components/ui/badge';
   import { Link } from 'react-router-dom';
   import { useComparison } from '@/contexts/ComparisonContext';

   export default function SchoolCard({ school }: { school: School }) {
     const { isSelected, toggle } = useComparison();
     const selected = isSelected(school.rcdts);

     return (
       <Card className="hover:shadow-lg transition-shadow">
         <CardHeader className="flex flex-wrap gap-2 justify-between">
           <div>
             <CardTitle className="text-xl font-semibold">{school.school_name}</CardTitle>
             <p className="text-sm text-muted-foreground">{school.city} • {school.district}</p>
           </div>
           {school.school_type && <Badge variant="secondary">{school.school_type}</Badge>}
         </CardHeader>
         <CardContent className="flex flex-wrap items-center gap-3">
           <Button asChild variant="outline" size="sm">
             <Link to={`/school/${school.rcdts}`}>View Details</Link>
           </Button>
           <Button size="sm" onClick={() => toggle(school)} variant={selected ? 'default' : 'secondary'}>
             {selected ? 'Remove from Compare' : 'Add to Compare'}
           </Button>
         </CardContent>
       </Card>
     );
   }
   ```
2. `SearchResults.tsx`: fetch query param, call `searchSchools`, render states (helper text, skeletons, empty), and map results to `SchoolCard`.

**Step 4: Re-run the tests**

Run: `cd frontend && npm run test -- src/components/SchoolCard.test.tsx src/routes/SearchResults.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/SchoolCard.tsx frontend/src/components/SchoolCard.test.tsx frontend/src/routes/SearchResults.tsx frontend/src/routes/SearchResults.test.tsx
git commit -m "feat(frontend): render search results list"
```

---

### Task 5: School detail view with metrics tabs

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`
- Modify: `frontend/src/routes/SchoolDetail.tsx`
- Modify: `frontend/src/components/ComparisonBasket.tsx`
- Test: `frontend/src/components/SchoolDetailView.test.tsx`
- Test: `frontend/src/routes/SchoolDetail.test.tsx`

**Step 1: Write failing tests**

`frontend/src/components/SchoolDetailView.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import SchoolDetailView from './SchoolDetailView';

const school = {
  id: 1,
  rcdts: '11',
  school_name: 'Sample High',
  city: 'Normal',
  district: 'Unit 5',
  county: 'McLean',
  school_type: 'High School',
  grades_served: '9-12',
  metrics: {
    enrollment: 1200,
    act: { ela_avg: 23.4, math_avg: 24.1, science_avg: 23.8, overall_avg: 23.8 },
    demographics: { el_percentage: 12.5, low_income_percentage: 38.2 },
    diversity: { white: 40, black: 30, hispanic: 20, asian: 5, pacific_islander: 1, native_american: 1, two_or_more: 3, mena: 0 },
  },
};

test('renders header and tabs for metrics', () => {
  render(<SchoolDetailView school={school} />);
  expect(screen.getByRole('heading', { name: /Sample High/ })).toBeVisible();
  expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText(/Enrollment/)).toBeVisible();
});
```

`frontend/src/routes/SchoolDetail.test.tsx` should verify data fetching, loading skeleton, and error toast (mock `getSchoolDetail`).

**Step 2: Run the tests (expect failure)**

Run: `cd frontend && npm run test -- src/components/SchoolDetailView.test.tsx src/routes/SchoolDetail.test.tsx`

Expected: FAIL.

**Step 3: Implement minimal code**

1. `SchoolDetail.tsx`: use `useParams`, fetch via `useQuery`, show skeletons, surface errors with shadcn `Alert`, and render `SchoolDetailView` once data is loaded.
2. `SchoolDetailView.tsx`: create header card plus shadcn `Tabs` for Overview, Academics, Demographics. Each tab uses semantic components (stat blocks with `Card`, horizontal `Progress` bars for ACT, `Table` for diversity). Provide CTA button hooking into comparison context.
3. `ComparisonBasket.tsx`: expose `Add/Remove` actions and persistent CTA `Compare Schools` button that slides from bottom.

**Step 4: Re-run the tests**

Run: `cd frontend && npm run test -- src/components/SchoolDetailView.test.tsx src/routes/SchoolDetail.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/routes/SchoolDetail.tsx frontend/src/components/SchoolDetailView.tsx frontend/src/components/ComparisonBasket.tsx frontend/src/components/SchoolDetailView.test.tsx frontend/src/routes/SchoolDetail.test.tsx
git commit -m "feat(frontend): build school detail experience"
```

---

### Task 6: Comparison context, basket, and table view

**Files:**
- Create: `frontend/src/contexts/ComparisonContext.tsx`
- Create: `frontend/src/hooks/useComparisonSchools.ts`
- Modify: `frontend/src/components/ComparisonBasket.tsx`
- Modify: `frontend/src/components/ComparisonView.tsx`
- Modify: `frontend/src/routes/Compare.tsx`
- Test: `frontend/src/contexts/ComparisonContext.test.tsx`
- Test: `frontend/src/components/ComparisonView.test.tsx`
- Test: `frontend/src/routes/Compare.test.tsx`

**Step 1: Write failing tests**

`frontend/src/contexts/ComparisonContext.test.tsx`
```tsx
import { act, renderHook } from '@testing-library/react';
import { ComparisonProvider, useComparison } from './ComparisonContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <ComparisonProvider>{children}</ComparisonProvider>;

test('adds and removes schools with max of five stored in localStorage', () => {
  const { result } = renderHook(() => useComparison(), { wrapper });

  act(() => result.current.add({ rcdts: '1', school_name: 'One', id: 1, city: '', district: '', school_type: null }));
  expect(result.current.isSelected('1')).toBe(true);

  act(() => result.current.remove('1'));
  expect(result.current.isSelected('1')).toBe(false);
});
```

`frontend/src/components/ComparisonView.test.tsx`: ensure rows/columns render.

`frontend/src/routes/Compare.test.tsx`: ensure API call triggers when query param `schools` defined.

**Step 2: Run tests (expect failure)**

Run: `cd frontend && npm run test -- src/contexts/ComparisonContext.test.tsx src/components/ComparisonView.test.tsx src/routes/Compare.test.tsx`

Expected: FAIL.

**Step 3: Implement minimal code**

1. `ComparisonContext.tsx`: store `selected` array in state + `localStorage`, expose helpers `add`, `remove`, `toggle`, `isSelected`, `clear`, `schools` (with metadata). Use `useMemo` and `useCallback` for performance.
2. `hooks/useComparisonSchools.ts`: returns derived data by calling `compareSchools` TanStack query keyed by `selected` IDs.
3. `ComparisonBasket.tsx`: render bottom sticky drawer with selected chips (shadcn `Badge` + `Button`), `Compare` CTA disabled until >=2 schools.
4. `ComparisonView.tsx`: use shadcn `Table` + `ScrollArea` to lay out metrics rows vs columns. Highlight best metric per row using Tailwind conditional classes (e.g., `bg-emerald-50`). Provide `Remove` button per column.
5. `routes/Compare.tsx`: parse query param `schools`, sync with context, fetch compare data, show skeleton + `ComparisonView`, surfaces errors via `Alert`.

**Step 4: Re-run tests**

Run: `cd frontend && npm run test -- src/contexts/ComparisonContext.test.tsx src/components/ComparisonView.test.tsx src/routes/Compare.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/contexts frontend/src/hooks/frontend/src/components/Comparison* frontend/src/routes/Compare.tsx frontend/src/components/ComparisonView.tsx frontend/src/tests
git commit -m "feat(frontend): add comparison flow"
```

---

### Task 7: Top Scores leaderboard page using new API

**Files:**
- Create: `frontend/src/components/TopScoresFilters.tsx`
- Create: `frontend/src/components/TopScoresTable.tsx`
- Create: `frontend/src/routes/TopScores.tsx`
- Modify: `frontend/src/lib/api/types.ts`
- Modify: `frontend/src/lib/api/queries.ts`
- Modify: `frontend/src/routes/Home.tsx`
- Test: `frontend/src/routes/TopScores.test.tsx`
- Test: `frontend/src/components/TopScoresTable.test.tsx`

**Step 1: Write failing tests**

`frontend/src/components/TopScoresTable.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import TopScoresTable from './TopScoresTable';

it('renders leaderboard rows with rank and score badge', () => {
  render(
    <TopScoresTable
      entries=[
        {
          rank: 1,
          rcdts: '11',
          school_name: 'Sample High',
          city: 'Normal',
          district: 'Unit 5',
          school_type: 'High School',
          level: 'high',
          enrollment: 1200,
          score: 24.2,
        },
      ]
    />
  );
  expect(screen.getByText('1')).toBeVisible();
  expect(screen.getByText('24.2')).toBeVisible();
});
```

`frontend/src/routes/TopScores.test.tsx`
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TopScores from './TopScores';
import * as queries from '@/lib/api/queries';

const queryClient = new QueryClient();

it('fetches leaderboard using default filters', async () => {
  vi.spyOn(queries, 'getTopScores').mockResolvedValue({
    results: [
      {
        rank: 1,
        rcdts: '11',
        school_name: 'Sample High',
        city: 'Normal',
        district: 'Unit 5',
        school_type: 'High School',
        level: 'high',
        enrollment: 1200,
        score: 24.2,
      },
    ],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TopScores />
      </MemoryRouter>
    </QueryClientProvider>
  );

  await waitFor(() => expect(screen.getByText(/Top Illinois Schools/)).toBeVisible());
  expect(screen.getByText('Sample High')).toBeInTheDocument();
});
```

**Step 2: Run tests (expect failure)**

Run: `cd frontend && npm run test -- src/components/TopScoresTable.test.tsx src/routes/TopScores.test.tsx`

Expected: FAIL.

**Step 3: Implement minimal code**

1. Extend types + queries from Task 2 as needed (already added), ensure `getTopScores` returns `TopScoresResponse`.
2. `TopScoresFilters.tsx`: use shadcn `Select` + `ToggleGroup` for `assessment` and `level`. Accept props `value`, `onChange`.
3. `TopScoresTable.tsx`: build responsive `Table` with sticky rank column, `Badge` for rank, `Link` to school detail, highlight top 3.
4. `TopScores.tsx`: hold filter state, call `useQuery` with `getTopScores`, show skeleton rows, error `Alert`, hero copy.
5. Update `Home.tsx` with `Button` linking to `/top-scores`.

**Step 4: Re-run tests**

Run: `cd frontend && npm run test -- src/components/TopScoresTable.test.tsx src/routes/TopScores.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/TopScores* frontend/src/routes/TopScores.tsx frontend/src/routes/Home.tsx frontend/src/lib/api/types.ts frontend/src/lib/api/queries.ts frontend/src/routes/*test.tsx frontend/src/components/*test.tsx
git commit -m "feat(frontend): add top scores leaderboard"
```

---

### Task 8: E2E verification and documentation updates

**Files:**
- Modify/Create: `frontend/tests/e2e/search-flow.spec.ts`
- Modify/Create: `frontend/tests/e2e/comparison-flow.spec.ts`
- Modify/Create: `frontend/tests/e2e/top-scores-flow.spec.ts`
- Modify: `frontend/README.md`

**Step 1: Write failing Playwright specs**

`frontend/tests/e2e/top-scores-flow.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('user views top ACT high schools and opens detail page', async ({ page }) => {
  await page.goto('http://localhost:5173/top-scores');
  await expect(page.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();
  await page.getByLabel('Assessment').selectOption('act');
  await page.getByLabel('Level').selectOption('high');
  await expect(page.getByRole('row').nth(1)).toContainText('1');
  await page.getByRole('link', { name: /High School/ }).first().click();
  await expect(page).toHaveURL(/\/school\//);
});
```

Similarly update existing search/comparison flows to reflect finished UI.

**Step 2: Run specs (expect failure)**

Run (from repo root): `cd frontend && npx playwright test --reporter=list`

Expected: FAIL until UI flows exist.

**Step 3: Implement supporting code**

1. Ensure dev server + backend running for E2E (document commands in README).
2. Hook up Playwright config base URL (`http://localhost:5173`).
3. Update README with instructions for running backend (`uv run uvicorn ...`) and frontend (`npm run dev`), plus how to run Vitest/Playwright.

**Step 4: Re-run specs**

Run: `cd frontend && npx playwright test --reporter=list`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/tests/e2e frontend/README.md playwright-report .
git commit -m "test(frontend): cover core flows end-to-end"
```

---

**Plan complete. Follow RED→GREEN→REFACTOR for each task, keep commits focused, and coordinate with Kyle before deviating from scope.**

---
