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

# Illinois School Explorer - Design Document

**Date:** 2025-11-05
**Status:** Approved
**Author:** Design Session

## Overview

A web application for searching and comparing Illinois schools using the 2025 Report Card Public Dataset. Users can search by school name or city, view key metrics, and compare schools side-by-side.

## Goals & Constraints

### Goals
- Enable quick, intuitive school search for general public
- Display 5 core metric groups: enrollment, ACT scores, EL percentage, low-income percentage, and racial diversity
- Support side-by-side comparison of multiple schools (2-5)
- Build with TDD from day 1
- Create scalable foundation for future enhancements

### Constraints
- Local development environment initially (deployment deferred)
- 4,692 school records from Excel source
- Public data only (no authentication needed)
- Must handle suppressed data (asterisks in source)

### Success Criteria
- Search results appear in <100ms
- All components have test coverage
- Responsive design (mobile + desktop)
- Handle edge cases gracefully (missing data, no results)

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  React Frontend │ ◄─────► │  FastAPI Backend│
│   (Vite + TS)   │  REST   │   (Python)      │
│                 │   API   │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  SQLite Database│
                            │   (FTS5 index)  │
                            └─────────────────┘
```

### Tech Stack

**Backend:**
- FastAPI 0.104+ (ASGI web framework)
- SQLAlchemy 2.0 (ORM)
- SQLite 3 with FTS5 (full-text search)
- uvicorn (ASGI server)
- pytest + httpx (testing)
- uv (Python package manager)

**Frontend:**
- React 18 with TypeScript
- Vite (build tool + dev server)
- shadcn/ui + Tailwind CSS (component library)
- TanStack Query (server state management)
- Vitest + React Testing Library (unit/integration tests)
- Playwright (E2E tests)

**Data Source:**
- 2025-Report-Card-Public-Data-Set.xlsx (39MB)
- Sheets used: "General" and "ACT"

## Project Structure

```
illinois-school-explorer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── database.py             # SQLite connection & models
│   │   ├── models.py               # Pydantic schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── search.py           # Search endpoints
│   │   │   └── schools.py          # School detail endpoints
│   │   └── utils/
│   │       └── import_data.py      # Excel → SQLite import script
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py             # Pytest fixtures
│   │   ├── test_database.py
│   │   ├── test_import_data.py
│   │   ├── test_search_api.py
│   │   └── test_schools_api.py
│   ├── data/
│   │   └── schools.db              # SQLite database (gitignored)
│   ├── pytest.ini
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SchoolCard.tsx
│   │   │   ├── SchoolDetail.tsx
│   │   │   └── ComparisonView.tsx
│   │   ├── lib/
│   │   │   └── api.ts              # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── SearchBar.test.tsx
│   │   │   ├── SchoolCard.test.tsx
│   │   │   └── ComparisonView.test.tsx
│   │   ├── integration/
│   │   │   └── api.test.ts
│   │   └── e2e/
│   │       ├── search-flow.spec.ts
│   │       └── comparison-flow.spec.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── package.json
│   └── README.md
├── docs/
│   └── plans/
│       └── 2025-11-05-illinois-school-explorer-design.md
├── data/
│   └── 2025-Report-Card-Public-Data-Set.xlsx
├── .gitignore
└── README.md
```

## Database Design

### Schema

**`schools` table:**
```sql
CREATE TABLE schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rcdts TEXT UNIQUE NOT NULL,           -- State school ID (e.g., "05-016-2140-17-0002")
    school_name TEXT NOT NULL,
    district TEXT,
    city TEXT NOT NULL,
    county TEXT,
    school_type TEXT,                     -- "Elementary School", "High School", etc.
    level TEXT NOT NULL,                  -- "School", "District", "Statewide"
    grades_served TEXT,                   -- e.g., "9-12"

    -- Core Metrics
    student_enrollment INTEGER,
    el_percentage REAL,                   -- English Learner %
    low_income_percentage REAL,

    -- ACT Scores
    act_ela_avg REAL,
    act_math_avg REAL,
    act_science_avg REAL,

    -- Diversity Percentages
    pct_white REAL,
    pct_black REAL,
    pct_hispanic REAL,
    pct_asian REAL,
    pct_pacific_islander REAL,
    pct_native_american REAL,
    pct_two_or_more REAL,
    pct_mena REAL,                        -- Middle Eastern/North African

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_city ON schools(city);
CREATE INDEX idx_schools_level ON schools(level);

-- Full-text search virtual table
CREATE VIRTUAL TABLE schools_fts USING fts5(
    school_name,
    city,
    district,
    content=schools,
    content_rowid=id
);
```

### Data Import Strategy

The import script (`backend/app/utils/import_data.py`) will:

1. Load Excel file with pandas (sheets: "General" + "ACT")
2. Filter to `Level == 'School'` (exclude district/statewide summaries)
3. Join ACT data by RCDTS code
4. Clean data:
   - Convert asterisks (*) to NULL (suppressed values)
   - Parse percentage strings to floats
   - Handle NaN/missing values
5. Bulk insert into SQLite using SQLAlchemy
6. Build FTS5 index for search

**Import characteristics:**
- Idempotent (drops/recreates tables)
- ~4,000 school records
- Expected runtime: <5 seconds

**CLI usage:**
```bash
uv run python -m app.utils.import_data ../data/2025-Report-Card-Public-Data-Set.xlsx
```

## API Design

### Endpoints

#### 1. Search Schools
```
GET /api/search?q={query}&limit={limit}
```

**Parameters:**
- `q` (required): Search query (school name or city)
- `limit` (optional): Max results, default 10, max 50

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": 123,
      "rcdts": "05-016-2140-17-0002",
      "school_name": "Elk Grove High School",
      "city": "Elk Grove Village",
      "district": "Township HSD 214",
      "school_type": "High School"
    }
  ],
  "total": 1
}
```

**Search behavior:**
- Uses SQLite FTS5 for fast full-text search
- Searches across: school_name, city, district
- Returns matches ranked by relevance
- Case-insensitive

#### 2. Get School Details
```
GET /api/schools/{rcdts}
```

**Parameters:**
- `rcdts` (path): School RCDTS identifier

**Response (200 OK):**
```json
{
  "id": 123,
  "rcdts": "05-016-2140-17-0002",
  "school_name": "Elk Grove High School",
  "city": "Elk Grove Village",
  "district": "Township HSD 214",
  "county": "Cook",
  "school_type": "High School",
  "grades_served": "9-12",
  "metrics": {
    "enrollment": 1775,
    "act": {
      "ela_avg": 17.7,
      "math_avg": 18.2,
      "science_avg": 18.9,
      "overall_avg": 17.95
    },
    "demographics": {
      "el_percentage": 29.0,
      "low_income_percentage": 38.4
    },
    "diversity": {
      "white": 36.8,
      "black": 1.9,
      "hispanic": 48.3,
      "asian": 8.7,
      "pacific_islander": null,
      "native_american": null,
      "two_or_more": 3.0,
      "mena": null
    }
  }
}
```

**Notes:**
- `overall_avg` = (ela_avg + math_avg) / 2
- Suppressed values (asterisks in source) appear as `null`

**Error (404):**
```json
{
  "detail": "School not found"
}
```

#### 3. Compare Schools
```
GET /api/schools/compare?rcdts={rcdts1},{rcdts2},{rcdts3}
```

**Parameters:**
- `rcdts` (required): Comma-separated list of RCDTS codes (2-5 schools)

**Response (200 OK):**
```json
{
  "schools": [
    { /* school 1 full details */ },
    { /* school 2 full details */ }
  ]
}
```

**Error (400):**
```json
{
  "detail": "Must provide 2-5 school RCDTS codes"
}
```

### CORS Configuration

Development: Allow `http://localhost:5173` (Vite default)

Production: Configure based on deployment domain

## Frontend Design

### Component Architecture

```
App.tsx
├── SearchBar (shadcn/ui Command)
│   └── Search input with autocomplete
├── Router
    ├── Home
    │   └── SearchBar + Instructions
    ├── SearchResults
    │   ├── SearchBar
    │   └── SchoolCard[] (list of results)
    └── SchoolDetail
        ├── SchoolHeader (name, type, location)
        ├── Tabs (Overview, Academics, Demographics)
        │   ├── Overview Tab
        │   │   ├── Enrollment
        │   │   └── Basic Info
        │   ├── Academics Tab
        │   │   └── ACT Scores (bar chart or progress bars)
        │   └── Demographics Tab
        │       ├── EL & Low Income percentages
        │       └── Diversity Breakdown (horizontal bar chart)
        └── ComparisonBasket (bottom bar)
            ├── Selected schools (badges)
            ├── "Add to Compare" / "Remove" buttons
            └── "Compare" button (→ ComparisonView)

ComparisonView
└── Table (shadcn/ui Table)
    ├── Rows: Metrics
    ├── Columns: Schools (2-5)
    └── Color coding (highlight best/worst)
```

### Key Components

**1. SearchBar**
- shadcn/ui Command component
- Debounced API calls (300ms)
- Top 10 autocomplete results
- Keyboard navigation (↑↓, Enter, Esc)

**2. SchoolCard**
- shadcn/ui Card component
- Displays: name, city, district, type
- Preview metrics: enrollment, ACT avg
- "Add to Compare" button
- Click → Navigate to SchoolDetail

**3. SchoolDetail**
- shadcn/ui Tabs for organizing metrics
- shadcn/ui Badge for tags (school type, grades)
- Simple visualizations for ACT scores and diversity
- "Add to Compare" floating action button

**4. ComparisonView**
- shadcn/ui Table (responsive, horizontal scroll on mobile)
- Metrics in rows, schools in columns
- Color coding: green for high values, red for low (context-dependent)
- "Remove school" button per column
- Export to CSV (future enhancement)

### State Management

**Server State (TanStack Query):**
- Search results cache (5 min)
- School details cache (10 min)
- Automatic refetching on stale
- Loading/error states built-in

**Client State (React Context or Zustand):**
- Comparison basket (selected school RCDTS codes)
- Persisted to localStorage
- Max 5 schools

**URL State:**
- Current school: `/school/{rcdts}`
- Comparison: `/compare?schools={rcdts1},{rcdts2}`
- Search query: `/?q={query}`

### User Flow

```
1. User lands on homepage
   ↓
2. Types "elk grove" in SearchBar
   ↓
3. Sees autocomplete dropdown (10 results)
   ↓
4. Selects "Elk Grove High School"
   ↓
5. Views SchoolDetail page (tabs: Overview, Academics, Demographics)
   ↓
6. Clicks "Add to Compare" (badge appears in bottom bar)
   ↓
7. Searches for another school
   ↓
8. Selects second school, adds to compare
   ↓
9. Clicks "Compare" button in bottom bar
   ↓
10. Views ComparisonView (side-by-side table)
    ↓
11. Can remove schools or add more (up to 5)
```

## Testing Strategy (TDD)

### Backend Testing

**Test Structure:**
```
tests/
├── conftest.py              # Fixtures: test_db, client
├── test_database.py         # SQLAlchemy models
├── test_import_data.py      # Excel import logic
├── test_search_api.py       # /api/search endpoint
└── test_schools_api.py      # /api/schools/* endpoints
```

**Key Fixtures (conftest.py):**
```python
@pytest.fixture(scope="function")
def test_db():
    """In-memory SQLite for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine)()
    Base.metadata.drop_all(engine)

@pytest.fixture
def client(test_db):
    """FastAPI TestClient with test DB."""
    app.dependency_overrides[get_db] = lambda: test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

**Test Coverage Goals:**
- All API endpoints (happy path + error cases)
- Database models (CRUD operations)
- Data import (parsing, cleaning, edge cases)
- FTS search (relevance, special characters)

**Running Tests:**
```bash
cd backend
uv run pytest                     # All tests
uv run pytest --cov=app           # With coverage
uv run pytest -k test_search      # Specific test
```

### Frontend Testing

**Test Structure:**
```
tests/
├── unit/
│   ├── SearchBar.test.tsx        # Component behavior
│   ├── SchoolCard.test.tsx
│   └── ComparisonView.test.tsx
├── integration/
│   └── api.test.ts               # API client integration
└── e2e/
    ├── search-flow.spec.ts       # Full search to detail flow
    └── comparison-flow.spec.ts   # Multi-school comparison
```

**Test Tools:**
- Vitest for unit/integration (fast, Vite-native)
- React Testing Library (user-centric queries)
- Playwright for E2E (real browser testing)

**Test Coverage Goals:**
- All components (rendering, user interactions)
- API client (request/response handling)
- Critical user flows (search → detail → compare)
- Error states (network failures, no results)

**Running Tests:**
```bash
cd frontend
npm test                          # Unit tests (watch mode)
npm run test:ci                   # CI mode (run once)
npm run test:e2e                  # Playwright E2E
npm run test:e2e:ui               # Playwright UI mode
```

### TDD Workflow

**Backend (Red-Green-Refactor):**
1. Write failing test (e.g., `test_search_returns_results`)
2. Run `uv run pytest tests/test_search_api.py -v`
3. Write minimal code to pass
4. Refactor, ensure tests still pass
5. Commit

**Frontend (Red-Green-Refactor):**
1. Write failing test (e.g., `SearchBar renders and accepts input`)
2. Run `npm test SearchBar.test.tsx`
3. Write minimal component code
4. Refactor, ensure tests still pass
5. Commit

**E2E (Feature Verification):**
1. Write Playwright test for full flow
2. Run `npm run test:e2e`
3. Implement backend + frontend to pass
4. Verify entire feature works
5. Commit

**Development Order:**
1. Set up testing infrastructure (pytest, vitest, playwright)
2. TDD: Data import script
3. TDD: Database models
4. TDD: API endpoints
5. TDD: React components
6. TDD: User flows (E2E)

## Error Handling

### Backend Errors

| Error | HTTP Code | Response |
|-------|-----------|----------|
| Invalid RCDTS | 404 | `{"detail": "School not found"}` |
| Malformed query params | 400 | `{"detail": "Invalid query parameter"}` |
| Database connection failure | 503 | `{"detail": "Service temporarily unavailable"}` |
| Internal error | 500 | `{"detail": "Internal server error"}` |

**All errors return JSON with `detail` field.**

### Frontend Error Handling

| Error Scenario | Handling |
|----------------|----------|
| API request fails | shadcn/ui Toast notification with retry button |
| Empty search results | "No schools found" message + search tips |
| School not found | 404 page with link back to search |
| Network offline | Display cached data (if available) + offline indicator |
| Loading states | shadcn/ui Skeleton components |

### Edge Cases

| Case | Solution |
|------|----------|
| Suppressed data (asterisks) | Show "Data not available" instead of null |
| No ACT data | Hide ACT section or show "N/A" |
| Very long school names | Truncate with ellipsis, show full name on hover (Tooltip) |
| Comparing schools with missing metrics | Show "-" in comparison table cells |
| User tries to add >5 schools to compare | Disable "Add" button, show toast: "Maximum 5 schools" |
| Special characters in search | Sanitize input, handle gracefully |

## Development Setup

### Initial Setup

```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit: Design document"

# 2. Backend setup
cd backend
uv venv
uv pip install fastapi sqlalchemy uvicorn pandas openpyxl pytest pytest-asyncio httpx
uv pip freeze > requirements.txt

# 3. Import data
uv run python -m app.utils.import_data ../data/2025-Report-Card-Public-Data-Set.xlsx

# 4. Start backend
uv run uvicorn app.main:app --reload --port 8000

# 5. Frontend setup (separate terminal)
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npx shadcn-ui@latest init
npm install @tanstack/react-query axios
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test

# 6. Start frontend
npm run dev  # Runs on http://localhost:5173
```

### Development URLs

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Alt API Docs:** http://localhost:8000/redoc

### Git Workflow

```bash
# Feature branches
git checkout -b feature/search-api
# ... implement with TDD ...
git commit -m "Add search API with tests"
git checkout main
git merge feature/search-api
```

## Future Enhancements (Out of Scope for MVP)

1. **Additional Metrics:**
   - Graduation rates
   - Chronic absenteeism
   - Teacher stats
   - Class sizes
   - All 681+ fields available

2. **Advanced Features:**
   - Export comparison to PDF/CSV
   - Shareable comparison links
   - School district overview pages
   - Geographic search (map view)
   - Filter by school type, grades, city

3. **Deployment:**
   - Backend: Railway, Render, or AWS
   - Frontend: Vercel or Netlify
   - Database: PostgreSQL (for production)

4. **Analytics:**
   - Track popular searches
   - Most compared schools
   - Usage metrics

5. **Performance:**
   - Caching layer (Redis)
   - CDN for static assets
   - Database query optimization

## Open Questions

None at this time. Design is approved and ready for implementation.

## Appendix

### Dependencies (requirements.txt)
```
fastapi==0.104.1
sqlalchemy==2.0.23
uvicorn[standard]==0.24.0
pandas==2.1.4
openpyxl==3.1.2
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2
```

### Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "jsdom": "^23.0.1",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.1",
    "tailwindcss": "^3.4.0"
  }
}
```

### Reference: Excel Column Mapping

**General Sheet:**
- Column 2: RCDTS
- Column 4: School Name
- Column 5: District
- Column 6: City
- Column 16: # Student Enrollment
- Column 30: % Student Enrollment - EL
- Column 33: % Student Enrollment - Low Income
- Columns 20-27: Diversity percentages (White, Black, Hispanic, Asian, etc.)

**ACT Sheet:**
- Column 2: RCDTS (join key)
- ACT ELA Average Score - Grade 11
- ACT Math Average Score - Grade 11
- ACT Science Average Score - Grade 11

---

**End of Design Document**
