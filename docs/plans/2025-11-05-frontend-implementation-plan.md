# Top Scores Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the Top 100 Scores experience so users can jump from the homepage CTA to `/top-scores`, filter by assessment/level, and browse ranked schools pulled from the new `/api/top-scores` backend route.

**Architecture:** Reuse the existing Vite + React app, React Router, TanStack Query, and shadcn/ui design system. Add typed API helpers, a CTA card on the Home page, a dedicated `/top-scores` route with tabbed filters, and a responsive leaderboard table that links to school detail pages. Prefetch adjacent tab data for snappy navigation and persist TanStack Query caches per current patterns.

**Tech Stack:** React 18, TypeScript, React Router v6, TanStack Query v5, shadcn/ui + Tailwind CSS (@ui-styling), Axios API client, Vitest + React Testing Library, Playwright.

---

### Task 1: Typed API client for `/api/top-scores`

**Files:**
- Modify: `frontend/src/lib/api/types.ts`
- Modify: `frontend/src/lib/api/queries.ts`
- Test: `frontend/src/lib/api/queries.test.ts`
- (Existing) `frontend/src/lib/api/client.ts` used by new helpers

**Step 1: Write the failing tests**

Append to `frontend/src/lib/api/queries.test.ts`:
```ts
import { vi } from 'vitest';
import { apiClient } from './client';
import { getTopScores } from './queries';

vi.mock('./client');

test('getTopScores requests leaderboard with params', async () => {
  (apiClient.get as jest.Mock).mockResolvedValue({
    data: {
      results: [
        {
          rank: 1,
          rcdts: '11-111-1111-11-0001',
          school_name: 'Sample High',
          city: 'Normal',
          district: 'Unit 5',
          school_type: 'High School',
          level: 'high',
          enrollment: 1200,
          score: 24.3,
        },
      ],
    },
  });

  const payload = await getTopScores({ assessment: 'act', level: 'high', limit: 25 });
  expect(apiClient.get).toHaveBeenCalledWith('/api/top-scores', {
    params: { assessment: 'act', level: 'high', limit: 25 },
  });
  expect(payload.results[0].rank).toBe(1);
});
```

**Step 2: Run the test to verify it fails**

Run: `cd frontend && npm run test -- src/lib/api/queries.test.ts`
Expected: FAIL (`getTopScores` undefined / types missing).

**Step 3: Implement minimal code**

1. Extend `frontend/src/lib/api/types.ts`:
```ts
export type Assessment = 'act' | 'iar';
export type SchoolLevel = 'high' | 'middle' | 'elementary';

export interface TopScoreEntry {
  rank: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  school_type: string | null;
  level: SchoolLevel;
  enrollment: number | null;
  score: number;
}

export interface TopScoresResponse {
  results: TopScoreEntry[];
}
```
2. Add helper + query key to `frontend/src/lib/api/queries.ts`:
```ts
import type { Assessment, SchoolLevel, TopScoresResponse } from './types';

export const topScoresQueryKey = (
  assessment: Assessment,
  level: SchoolLevel,
  limit: number
) => ['top-scores', assessment, level, limit];

export async function getTopScores(params: {
  assessment: Assessment;
  level: SchoolLevel;
  limit?: number;
}): Promise<TopScoresResponse> {
  const { data } = await apiClient.get<TopScoresResponse>('/api/top-scores', {
    params: { limit: 100, ...params },
  });
  return data;
}
```

**Step 4: Re-run the tests**

Run: `cd frontend && npm run test -- src/lib/api/queries.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/api/types.ts frontend/src/lib/api/queries.ts frontend/src/lib/api/queries.test.ts
git commit -m "feat(frontend): add typed top scores api helper"
```

---

### Task 2: Home page CTA card to promote leaderboard

**Files:**
- Modify: `frontend/src/routes/Home.tsx`
- Modify: `frontend/src/routes/Home.test.tsx`
- Modify: `frontend/src/App.tsx` (add `/top-scores` route link in nav)

**Step 1: Write the failing test**

Update `frontend/src/routes/Home.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

test('renders top scores CTA with link', () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  const cta = screen.getByRole('link', { name: /Explore Top 100 Scores/i });
  expect(cta).toHaveAttribute('href', '/top-scores');
});
```

**Step 2: Run the test (expect failure)**

`cd frontend && npm run test -- src/routes/Home.test.tsx`
Expected: FAIL since CTA missing.

**Step 3: Implement minimal code**

1. In `App.tsx`, add nav link `<Link to="/top-scores" ...>` inside header actions (if not already there per design file).
2. In `Home.tsx`, insert CTA beneath the SearchBar block using @ui-styling shadcn `Card` + `Button`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

<Card className="mt-8 w-full">
  <CardHeader>
    <CardTitle className="text-2xl">Explore Top 100 School Scores</CardTitle>
    <p className="text-muted-foreground">
      See the highest-performing Illinois schools ranked by ACT and IAR results.
    </p>
  </CardHeader>
  <CardContent>
    <Button asChild size="lg" className="gap-2">
      <Link to="/top-scores">
        Explore Top Scores
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Button>
  </CardContent>
</Card>
```
Ensure flex/mobile spacing follows @ui-styling guidance.

**Step 4: Re-run the test**

`cd frontend && npm run test -- src/routes/Home.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/routes/Home.tsx frontend/src/routes/Home.test.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add top scores cta"
```

---

### Task 3: `/top-scores` route skeleton + hero

**Files:**
- Create: `frontend/src/routes/TopScores.tsx`
- Create: `frontend/src/routes/TopScores.test.tsx`
- Modify: `frontend/src/App.tsx` (add `<Route path="/top-scores" element={<TopScores />} />`)

**Step 1: Write the failing test**

`frontend/src/routes/TopScores.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TopScores from './TopScores';

test('renders hero heading and description', () => {
  render(
    <MemoryRouter initialEntries={['/top-scores']}>
      <Routes>
        <Route path="/top-scores" element={<TopScores />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();
  expect(screen.getByText(/ranked by ACT and IAR/)).toBeInTheDocument();
});
```

**Step 2: Run the test (expect failure)**

`cd frontend && npm run test -- src/routes/TopScores.test.tsx`
Expected: FAIL because component/route missing.

**Step 3: Implement minimal code**

Create `TopScores.tsx` with hero + placeholder for filters/table:
```tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getTopScores, topScoresQueryKey } from '@/lib/api/queries';

const DEFAULTS = [
  { id: 'act-high', assessment: 'act', level: 'high', label: 'High School ACT' },
  { id: 'iar-middle', assessment: 'iar', level: 'middle', label: 'Middle School IAR' },
  { id: 'iar-elementary', assessment: 'iar', level: 'elementary', label: 'Elementary IAR' },
];

export default function TopScores() {
  const [active, setActive] = useState(DEFAULTS[0]);
  const query = useQuery({
    queryKey: topScoresQueryKey(active.assessment, active.level, 100),
    queryFn: () => getTopScores({ assessment: active.assessment, level: active.level, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Leaderboard</p>
        <h1 className="text-4xl font-bold">Top Illinois Schools</h1>
        <p className="text-lg text-muted-foreground">
          Ranked by ACT (grade 11) and IAR % Meets/Exceeds per normalized level.
        </p>
      </header>
      <Tabs value={active.id} onValueChange={(id) => setActive(DEFAULTS.find((tab) => tab.id === id)!)}>
        <TabsList className="flex flex-wrap gap-2">
          {DEFAULTS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/* Table + states will be wired in Task 4/5 */}
    </section>
  );
}
```

**Step 4: Re-run the test**

`cd frontend && npm run test -- src/routes/TopScores.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/routes/TopScores.tsx frontend/src/routes/TopScores.test.tsx frontend/src/App.tsx
git commit -m "feat(frontend): scaffold top scores route"
```

---

### Task 4: Filter tabs + TanStack Query prefetching

**Files:**
- Modify: `frontend/src/routes/TopScores.tsx`
- Create: `frontend/src/components/TopScoresFilters.tsx`
- Test: `frontend/src/components/TopScoresFilters.test.tsx`

**Step 1: Write the failing test**

`frontend/src/components/TopScoresFilters.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import TopScoresFilters, { TopScoresFilterOption } from './TopScoresFilters';

const OPTIONS: TopScoresFilterOption[] = [
  { id: 'act-high', label: 'High ACT', assessment: 'act', level: 'high' },
  { id: 'iar-middle', label: 'Middle IAR', assessment: 'iar', level: 'middle' },
];

test('invokes onChange when tab selected', () => {
  const handler = vi.fn();
  render(
    <TopScoresFilters value={OPTIONS[0].id} options={OPTIONS} onChange={(id) => handler(id)} />
  );
  fireEvent.click(screen.getByRole('tab', { name: /Middle IAR/ }));
  expect(handler).toHaveBeenCalledWith('iar-middle');
});
```

**Step 2: Run the test (expect failure)**

`cd frontend && npm run test -- src/components/TopScoresFilters.test.tsx`
Expected: FAIL (component missing).

**Step 3: Implement minimal code**

1. Build `TopScoresFilters.tsx` using shadcn `Tabs` from @ui-styling skill:
```tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Assessment, SchoolLevel } from '@/lib/api/types';

export interface TopScoresFilterOption {
  id: string;
  label: string;
  assessment: Assessment;
  level: SchoolLevel;
}

export default function TopScoresFilters({ value, options, onChange }: {
  value: string;
  options: TopScoresFilterOption[];
  onChange: (id: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        {options.map((option) => (
          <TabsTrigger
            key={option.id}
            value={option.id}
            className="flex-1 min-w-[200px]"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```
2. In `TopScores.tsx`, replace inline tab logic with `<TopScoresFilters />`, track active option object, and use `useQueryClient` to prefetch the next hovered tab:
```tsx
const queryClient = useQueryClient();

const handleChange = (id: string) => {
  const next = OPTIONS.find((opt) => opt.id === id)!;
  setActive(next);
};

const prefetch = (option: TopScoresFilterOption) => {
  queryClient.prefetchQuery({
    queryKey: topScoresQueryKey(option.assessment, option.level, 100),
    queryFn: () => getTopScores({ assessment: option.assessment, level: option.level, limit: 100 }),
  });
};
```
Attach `onMouseEnter={() => prefetch(option)}` to each trigger.

**Step 4: Re-run tests**

`cd frontend && npm run test -- src/components/TopScoresFilters.test.tsx src/routes/TopScores.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/TopScoresFilters.tsx frontend/src/components/TopScoresFilters.test.tsx frontend/src/routes/TopScores.tsx
git commit -m "feat(frontend): add top scores filters"
```

---

### Task 5: Leaderboard table + states

**Files:**
- Create: `frontend/src/components/TopScoresTable.tsx`
- Create: `frontend/src/components/TopScoresTable.test.tsx`
- Modify: `frontend/src/routes/TopScores.tsx` (render table in page)
- Optionally create `frontend/src/components/TopScoreRow.tsx` if needed for clarity

**Step 1: Write failing component tests**

`frontend/src/components/TopScoresTable.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import TopScoresTable from './TopScoresTable';

const ENTRIES = [
  {
    rank: 1,
    rcdts: '11',
    school_name: 'Sample High',
    city: 'Normal',
    district: 'Unit 5',
    school_type: 'High School',
    level: 'high',
    enrollment: 1200,
    score: 24.3,
  },
];

test('shows rank, school name, and score badge', () => {
  render(<TopScoresTable entries={ENTRIES} />);
  expect(screen.getByText('Sample High')).toBeVisible();
  expect(screen.getByText('24.3')).toBeVisible();
  expect(screen.getByText('1')).toBeVisible();
});
```

**Step 2: Run the test (expect failure)**

`cd frontend && npm run test -- src/components/TopScoresTable.test.tsx`
Expected: FAIL.

**Step 3: Implement minimal code**

1. Create responsive table using shadcn `Table` + `ScrollArea` per @ui-styling:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { TopScoreEntry } from '@/lib/api/types';

export default function TopScoresTable({ entries }: { entries: TopScoreEntry[] }) {
  if (!entries.length) {
    return <p className="text-muted-foreground text-center py-8">No ranked schools available.</p>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>School</TableHead>
            <TableHead className="hidden md:table-cell">District</TableHead>
            <TableHead className="hidden lg:table-cell">Enrollment</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.rcdts} className="hover:bg-muted/50">
              <TableCell>
                <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>{entry.rank}</Badge>
              </TableCell>
              <TableCell>
                <div className="font-semibold">{entry.school_name}</div>
                <p className="text-sm text-muted-foreground">{entry.city}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">{entry.district}</TableCell>
              <TableCell className="hidden lg:table-cell">{entry.enrollment?.toLocaleString() ?? '—'}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-semibold">{entry.score.toFixed(1)}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/school/${entry.rcdts}`}>Details</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```
2. In `TopScores.tsx`, render skeleton rows when `query.isLoading`, show `Alert` on error, and pass data to `<TopScoresTable entries={query.data?.results ?? []} />`. Add methodology callout and legend text per design doc.

**Step 4: Re-run tests**

`cd frontend && npm run test -- src/components/TopScoresTable.test.tsx src/routes/TopScores.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/TopScoresTable.tsx frontend/src/components/TopScoresTable.test.tsx frontend/src/routes/TopScores.tsx
git commit -m "feat(frontend): render top scores leaderboard"
```

---

### Task 6: Playwright coverage + README updates

**Files:**
- Modify/Create: `frontend/tests/e2e/top-scores-flow.spec.ts`
- Modify/Create: `frontend/tests/e2e/search-flow.spec.ts` (update CTA navigation step)
- Modify: `frontend/README.md` (document new page + how to run leaderboard tests)

**Step 1: Write failing Playwright spec**

`frontend/tests/e2e/top-scores-flow.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173';

test('user opens leaderboard, switches tabs, and jumps to detail page', async ({ page }) => {
  await page.goto(FRONTEND);
  await page.getByRole('link', { name: /Explore Top 100 Scores/ }).click();
  await expect(page).toHaveURL(/\/top-scores$/);

  await expect(page.getByRole('heading', { name: /Top Illinois Schools/ })).toBeVisible();
  await page.getByRole('tab', { name: /Middle School IAR/ }).click();
  const firstRow = page.getByRole('row').nth(1);
  await expect(firstRow).toContainText('1');
  await firstRow.getByRole('link', { name: /Details/ }).click();
  await expect(page).toHaveURL(/\/school\//);
});
```

**Step 2: Run the spec (expect failure)**

Ensure backend + frontend running, then: `cd frontend && npx playwright test tests/e2e/top-scores-flow.spec.ts --reporter=list`
Expected: FAIL until UI works.

**Step 3: Update docs**

Add README section describing the leaderboard page, how tabs map to backend params, and steps to run Playwright spec (include command + expectation).

**Step 4: Re-run specs**

`cd frontend && npx playwright test --reporter=list`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/tests/e2e/top-scores-flow.spec.ts frontend/tests/e2e/search-flow.spec.ts frontend/README.md
git commit -m "test(frontend): add top scores e2e coverage"
```

---

**Plan complete. Follow RED → GREEN → REFACTOR for each task, keep commits atomic, and coordinate with Kyle before deviating from this scope.**
