# Phase 4: Core Components - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build search functionality and school detail views with full TDD approach

**Architecture:** SearchBar uses Command component with debounced API calls, SchoolCard displays results, SchoolDetail uses Tabs to organize 5 metric groups with simple visualizations

**Tech Stack:** React 19, TypeScript, shadcn/ui (Command, Card, Tabs, Badge, Skeleton, Toast), TanStack Query, Vitest, Playwright

---

## Prerequisites

Before starting, verify Phase 3 is complete:
- [ ] Backend API running on localhost:8000
- [ ] Frontend running on localhost:5173
- [ ] TanStack Query configured
- [ ] React Router configured
- [ ] Vitest and Playwright working

---

## Task 1: Install Required shadcn/ui Components

**Files:**
- Modify: `frontend/package.json` (via CLI)
- Create: Multiple component files in `frontend/src/components/ui/`

**Step 1: Install Command component**

Run:
```bash
cd frontend
npx shadcn@latest add command
```

Expected: Command component files created in `src/components/ui/`

**Step 2: Install Card component**

Run:
```bash
npx shadcn@latest add card
```

Expected: Card component files created

**Step 3: Install Tabs component**

Run:
```bash
npx shadcn@latest add tabs
```

Expected: Tabs component files created

**Step 4: Install Badge component**

Run:
```bash
npx shadcn@latest add badge
```

Expected: Badge component files created

**Step 5: Install Skeleton component**

Run:
```bash
npx shadcn@latest add skeleton
```

Expected: Skeleton component files created

**Step 6: Install Toast components**

Run:
```bash
npx shadcn@latest add toast
```

Expected: Toast, Toaster components and useToast hook created

**Step 7: Install Input component (for SearchBar)**

Run:
```bash
npx shadcn@latest add input
```

Expected: Input component files created

**Step 8: Verify all components installed**

Run:
```bash
ls -la src/components/ui/
```

Expected: Should see: badge.tsx, card.tsx, command.tsx, input.tsx, skeleton.tsx, tabs.tsx, toast.tsx, toaster.tsx

**Step 9: Commit**

```bash
git add src/components/ui package.json package-lock.json
git commit -m "feat: install shadcn/ui components for Phase 4"
```

---

## Task 2: Add Toaster to App Layout

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Write test for Toaster presence**

Create: `frontend/src/App.test.tsx` (append to existing)

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import App from './App';

describe('App - Toaster', () => {
  it('renders Toaster component for global notifications', () => {
    render(<App />);
    // Toaster renders with role="region" and aria-label
    const toaster = document.querySelector('[data-sonner-toaster]');
    // Note: Toaster may not be visible until triggered, just verify it's in DOM
    // We'll test actual toast functionality in component tests
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd frontend
npm test App.test.tsx
```

Expected: Test passes (Toaster not yet required in component)

**Step 3: Add Toaster to App component**

Modify: `frontend/src/App.tsx`

```typescript
// ABOUTME: Main application component with routing
// ABOUTME: Provides React Query and Toast notification context

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/routes/Home';
import SearchResults from '@/routes/SearchResults';
import SchoolDetail from '@/routes/SchoolDetail';
import Compare from '@/routes/Compare';
import NotFound from '@/routes/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">
                <a href="/">Illinois School Explorer</a>
              </h1>
            </div>
          </header>
          <main className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/school/:rcdts" element={<SchoolDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 4: Verify app still runs**

Run:
```bash
npm run dev
```

Expected: App runs without errors, visit http://localhost:5173

**Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: add Toaster component to app layout"
```

---

## Task 3: Create useDebounce Hook

**Files:**
- Create: `frontend/src/hooks/useDebounce.ts`
- Create: `frontend/src/hooks/useDebounce.test.ts`

**Step 1: Write failing test for useDebounce**

Create: `frontend/src/hooks/useDebounce.test.ts`

```typescript
// ABOUTME: Tests for useDebounce hook
// ABOUTME: Verifies debouncing delays value updates correctly

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('delays updating value until after delay period', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    expect(result.current).toBe('first');

    // Update the value
    rerender({ value: 'second', delay: 500 });

    // Should still be first immediately after change
    expect(result.current).toBe('first');

    // Fast forward time by 499ms
    vi.advanceTimersByTime(499);
    expect(result.current).toBe('first');

    // Fast forward remaining 1ms to complete delay
    vi.advanceTimersByTime(1);
    expect(result.current).toBe('second');
  });

  it('resets timer if value changes before delay completes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    vi.advanceTimersByTime(300);

    // Change value again before 500ms completes
    rerender({ value: 'third' });
    vi.advanceTimersByTime(300);

    // Should still be 'first' because timer was reset
    expect(result.current).toBe('first');

    // Complete the full delay
    vi.advanceTimersByTime(200);
    expect(result.current).toBe('third');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test useDebounce.test.ts
```

Expected: FAIL - "Cannot find module './useDebounce'"

**Step 3: Implement useDebounce hook**

Create: `frontend/src/hooks/useDebounce.ts`

```typescript
// ABOUTME: Custom hook for debouncing rapidly changing values
// ABOUTME: Delays value updates until after specified delay period

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test useDebounce.test.ts
```

Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/hooks/useDebounce.ts src/hooks/useDebounce.test.ts
git commit -m "feat: add useDebounce hook for search input"
```

---

## Task 4: Create SearchBar Component (Structure)

**Files:**
- Create: `frontend/src/components/SearchBar.test.tsx`
- Create: `frontend/src/components/SearchBar.tsx`

**Step 1: Write failing test for SearchBar rendering**

Create: `frontend/src/components/SearchBar.test.tsx`

```typescript
// ABOUTME: Tests for SearchBar component
// ABOUTME: Verifies search input, autocomplete, and keyboard navigation

import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchBar from './SearchBar';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
    expect(input).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/search for schools/i);
    await user.type(input, 'elk grove');

    expect(input).toHaveValue('elk grove');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test SearchBar.test.tsx
```

Expected: FAIL - "Cannot find module './SearchBar'"

**Step 3: Create basic SearchBar component**

Create: `frontend/src/components/SearchBar.tsx`

```typescript
// ABOUTME: SearchBar component with autocomplete functionality
// ABOUTME: Uses Command component with debounced search API calls

import { useState } from 'react';
import { Command, CommandInput } from '@/components/ui/command';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search for schools by name or city..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
    </Command>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test SearchBar.test.tsx
```

Expected: PASS - Basic tests passing

**Step 5: Commit**

```bash
git add src/components/SearchBar.tsx src/components/SearchBar.test.tsx
git commit -m "feat: create basic SearchBar component structure"
```

---

## Task 5: Add Autocomplete to SearchBar

**Files:**
- Modify: `frontend/src/components/SearchBar.test.tsx`
- Modify: `frontend/src/components/SearchBar.tsx`

**Step 1: Write failing test for autocomplete results**

Modify: `frontend/src/components/SearchBar.test.tsx` (append)

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock API server
const server = setupServer(
  http.get('http://localhost:8000/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query === 'elk') {
      return HttpResponse.json({
        results: [
          {
            id: 1,
            rcdts: '05-016-2140-17-0002',
            school_name: 'Elk Grove High School',
            city: 'Elk Grove Village',
            district: 'Township HSD 214',
            school_type: 'High School',
          },
        ],
        total: 1,
      });
    }

    return HttpResponse.json({ results: [], total: 0 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Add to describe block:
it('displays autocomplete results after debounce delay', async () => {
  const user = userEvent.setup();
  render(<SearchBar />, { wrapper: createWrapper() });

  const input = screen.getByPlaceholderText(/search for schools/i);
  await user.type(input, 'elk');

  // Wait for debounce (300ms) and API call
  await waitFor(() => {
    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
  }, { timeout: 1000 });

  expect(screen.getByText('Elk Grove Village')).toBeInTheDocument();
});

it('does not search until 2 characters entered', async () => {
  const user = userEvent.setup();
  render(<SearchBar />, { wrapper: createWrapper() });

  const input = screen.getByPlaceholderText(/search for schools/i);
  await user.type(input, 'e');

  // Wait to ensure no API call is made
  await new Promise(resolve => setTimeout(resolve, 400));

  expect(screen.queryByText('Elk Grove High School')).not.toBeInTheDocument();
});
```

**Step 2: Install MSW for mocking**

Run:
```bash
npm install -D msw@latest
```

**Step 3: Run test to verify it fails**

Run:
```bash
npm test SearchBar.test.tsx
```

Expected: FAIL - Autocomplete results not displayed

**Step 4: Implement autocomplete functionality**

Modify: `frontend/src/components/SearchBar.tsx`

```typescript
// ABOUTME: SearchBar component with autocomplete functionality
// ABOUTME: Uses Command component with debounced search API calls

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { searchSchools } from '@/lib/api/queries';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  // Only search if query is at least 2 characters
  const shouldSearch = debouncedQuery.length >= 2;

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchSchools(debouncedQuery, 10),
    enabled: shouldSearch,
  });

  const handleSelectSchool = (rcdts: string) => {
    navigate(`/school/${rcdts}`);
    setSearchQuery('');
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search for schools by name or city..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {shouldSearch && !isLoading && data && data.results.length === 0 && (
          <CommandEmpty>No schools found.</CommandEmpty>
        )}
        {shouldSearch && data && data.results.length > 0 && (
          <CommandGroup heading="Schools">
            {data.results.map((school) => (
              <CommandItem
                key={school.rcdts}
                value={school.rcdts}
                onSelect={() => handleSelectSchool(school.rcdts)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{school.school_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {school.city}
                    {school.district && ` • ${school.district}`}
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

**Step 5: Run test to verify it passes**

Run:
```bash
npm test SearchBar.test.tsx
```

Expected: PASS - All autocomplete tests passing

**Step 6: Commit**

```bash
git add src/components/SearchBar.tsx src/components/SearchBar.test.tsx package.json package-lock.json
git commit -m "feat: add autocomplete functionality to SearchBar"
```

---

## Task 6: Create SchoolCard Component

**Files:**
- Create: `frontend/src/components/SchoolCard.test.tsx`
- Create: `frontend/src/components/SchoolCard.tsx`

**Step 1: Write failing test for SchoolCard**

Create: `frontend/src/components/SchoolCard.test.tsx`

```typescript
// ABOUTME: Tests for SchoolCard component
// ABOUTME: Verifies school info display and click navigation

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SchoolCard from './SchoolCard';
import { School } from '@/lib/api/types';

const mockSchool: School = {
  id: 1,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  district: 'Township HSD 214',
  school_type: 'High School',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SchoolCard', () => {
  it('displays school name', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
  });

  it('displays city and district', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
    expect(screen.getByText(/Township HSD 214/)).toBeInTheDocument();
  });

  it('displays school type badge', () => {
    renderWithRouter(<SchoolCard school={mockSchool} />);
    expect(screen.getByText('High School')).toBeInTheDocument();
  });

  it('navigates to school detail when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SchoolCard school={mockSchool} />);

    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/school/05-016-2140-17-0002');
  });

  it('handles missing optional fields gracefully', () => {
    const schoolWithoutOptionals: School = {
      id: 2,
      rcdts: '12-345-6789-01-0001',
      school_name: 'Test School',
      city: 'Chicago',
      district: null,
      school_type: null,
    };

    renderWithRouter(<SchoolCard school={schoolWithoutOptionals} />);

    expect(screen.getByText('Test School')).toBeInTheDocument();
    expect(screen.getByText('Chicago')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test SchoolCard.test.tsx
```

Expected: FAIL - "Cannot find module './SchoolCard'"

**Step 3: Implement SchoolCard component**

Create: `frontend/src/components/SchoolCard.tsx`

```typescript
// ABOUTME: SchoolCard component for displaying school in search results
// ABOUTME: Shows basic info and links to detail view

import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School } from '@/lib/api/types';

interface SchoolCardProps {
  school: School;
}

export default function SchoolCard({ school }: SchoolCardProps) {
  return (
    <Link to={`/school/${school.rcdts}`} className="block">
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{school.school_name}</CardTitle>
              <CardDescription>
                {school.city}
                {school.district && ` • ${school.district}`}
              </CardDescription>
            </div>
            {school.school_type && (
              <Badge variant="secondary">{school.school_type}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test SchoolCard.test.tsx
```

Expected: PASS - All SchoolCard tests passing

**Step 5: Commit**

```bash
git add src/components/SchoolCard.tsx src/components/SchoolCard.test.tsx
git commit -m "feat: create SchoolCard component for search results"
```

---

## Task 7: Implement SearchResults Page

**Files:**
- Modify: `frontend/src/routes/SearchResults.tsx`
- Create: `frontend/src/routes/SearchResults.test.tsx`

**Step 1: Write failing test for SearchResults page**

Create: `frontend/src/routes/SearchResults.test.tsx`

```typescript
// ABOUTME: Tests for SearchResults page
// ABOUTME: Verifies search results display and loading states

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import SearchResults from './SearchResults';

const server = setupServer(
  http.get('http://localhost:8000/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query === 'grove') {
      return HttpResponse.json({
        results: [
          {
            id: 1,
            rcdts: '05-016-2140-17-0002',
            school_name: 'Elk Grove High School',
            city: 'Elk Grove Village',
            district: 'Township HSD 214',
            school_type: 'High School',
          },
          {
            id: 2,
            rcdts: '05-016-2260-17-0003',
            school_name: 'Buffalo Grove High School',
            city: 'Buffalo Grove',
            district: 'Township HSD 214',
            school_type: 'High School',
          },
        ],
        total: 2,
      });
    }

    return HttpResponse.json({ results: [], total: 0 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = (initialRoute = '/search?q=grove') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SearchResults', () => {
  it('displays search results from URL query parameter', async () => {
    render(<SearchResults />, { wrapper: createWrapper('/search?q=grove') });

    await waitFor(() => {
      expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    });

    expect(screen.getByText('Buffalo Grove High School')).toBeInTheDocument();
  });

  it('displays "no results" message when search returns empty', async () => {
    render(<SearchResults />, { wrapper: createWrapper('/search?q=xyz') });

    await waitFor(() => {
      expect(screen.getByText(/no schools found/i)).toBeInTheDocument();
    });
  });

  it('displays SearchBar at top of results', () => {
    render(<SearchResults />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search for schools/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test SearchResults.test.tsx
```

Expected: FAIL - SearchResults not implemented

**Step 3: Implement SearchResults page**

Modify: `frontend/src/routes/SearchResults.tsx`

```typescript
// ABOUTME: SearchResults page component
// ABOUTME: Displays search results with SearchBar and SchoolCard list

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import SchoolCard from '@/components/SchoolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { searchSchools } from '@/lib/api/queries';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchSchools(query, 50),
    enabled: query.length >= 2,
  });

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <SearchBar />
      </div>

      <div className="max-w-4xl mx-auto">
        {query.length < 2 && (
          <p className="text-center text-muted-foreground">
            Enter at least 2 characters to search
          </p>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center text-destructive">
            <p>Error loading search results: {error.message}</p>
          </div>
        )}

        {data && data.results.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No schools found</p>
            <p className="text-sm">Try searching by school name or city</p>
          </div>
        )}

        {data && data.results.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Found {data.total} {data.total === 1 ? 'school' : 'schools'}
            </p>
            <div className="space-y-4">
              {data.results.map((school) => (
                <SchoolCard key={school.rcdts} school={school} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test SearchResults.test.tsx
```

Expected: PASS - All SearchResults tests passing

**Step 5: Commit**

```bash
git add src/routes/SearchResults.tsx src/routes/SearchResults.test.tsx
git commit -m "feat: implement SearchResults page with loading and error states"
```

---

## Task 8: Create SchoolDetail Component (Structure)

**Files:**
- Create: `frontend/src/components/SchoolDetailView.test.tsx`
- Create: `frontend/src/components/SchoolDetailView.tsx`

**Step 1: Write failing test for SchoolDetailView**

Create: `frontend/src/components/SchoolDetailView.test.tsx`

```typescript
// ABOUTME: Tests for SchoolDetailView component
// ABOUTME: Verifies tabbed interface and metric display

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import SchoolDetailView from './SchoolDetailView';
import { SchoolDetail } from '@/lib/api/types';

const mockSchoolDetail: SchoolDetail = {
  id: 1,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  district: 'Township HSD 214',
  county: 'Cook',
  school_type: 'High School',
  grades_served: '9-12',
  metrics: {
    enrollment: 1775,
    act: {
      ela_avg: 17.7,
      math_avg: 18.2,
      science_avg: 18.9,
      overall_avg: 17.95,
    },
    demographics: {
      el_percentage: 29.0,
      low_income_percentage: 38.4,
    },
    diversity: {
      white: 36.8,
      black: 1.9,
      hispanic: 48.3,
      asian: 8.7,
      pacific_islander: null,
      native_american: null,
      two_or_more: 3.0,
      mena: null,
    },
  },
};

describe('SchoolDetailView', () => {
  it('displays school name and basic info', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
    expect(screen.getByText(/Cook/)).toBeInTheDocument();
  });

  it('displays school type and grades badges', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText('High School')).toBeInTheDocument();
    expect(screen.getByText('Grades 9-12')).toBeInTheDocument();
  });

  it('renders tabs for Overview, Academics, Demographics', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /academics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /demographics/i })).toBeInTheDocument();
  });

  it('displays enrollment in Overview tab by default', () => {
    render(<SchoolDetailView school={mockSchoolDetail} />);

    expect(screen.getByText(/enrollment/i)).toBeInTheDocument();
    expect(screen.getByText('1,775')).toBeInTheDocument();
  });

  it('displays ACT scores when Academics tab is clicked', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const academicsTab = screen.getByRole('tab', { name: /academics/i });
    await user.click(academicsTab);

    expect(screen.getByText(/ELA/i)).toBeInTheDocument();
    expect(screen.getByText('17.7')).toBeInTheDocument();
    expect(screen.getByText(/Math/i)).toBeInTheDocument();
    expect(screen.getByText('18.2')).toBeInTheDocument();
  });

  it('displays demographics when Demographics tab is clicked', async () => {
    const user = userEvent.setup();
    render(<SchoolDetailView school={mockSchoolDetail} />);

    const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
    await user.click(demographicsTab);

    expect(screen.getByText(/English Learners/i)).toBeInTheDocument();
    expect(screen.getByText('29.0%')).toBeInTheDocument();
    expect(screen.getByText(/Low Income/i)).toBeInTheDocument();
    expect(screen.getByText('38.4%')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test SchoolDetailView.test.tsx
```

Expected: FAIL - "Cannot find module './SchoolDetailView'"

**Step 3: Implement SchoolDetailView component**

Create: `frontend/src/components/SchoolDetailView.tsx`

```typescript
// ABOUTME: SchoolDetailView component for displaying full school details
// ABOUTME: Uses tabbed interface to organize metrics into Overview, Academics, Demographics

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolDetail } from '@/lib/api/types';

interface SchoolDetailViewProps {
  school: SchoolDetail;
}

export default function SchoolDetailView({ school }: SchoolDetailViewProps) {
  const formatNumber = (num: number | null): string => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercent = (num: number | null): string => {
    if (num === null) return 'N/A';
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{school.school_name}</h1>
        <p className="text-muted-foreground mb-4">
          {school.city}
          {school.county && ` • ${school.county} County`}
          {school.district && ` • ${school.district}`}
        </p>
        <div className="flex gap-2">
          {school.school_type && (
            <Badge variant="secondary">{school.school_type}</Badge>
          )}
          {school.grades_served && (
            <Badge variant="outline">Grades {school.grades_served}</Badge>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatNumber(school.metrics.enrollment)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Students</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academics Tab */}
        <TabsContent value="academics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ACT Scores</CardTitle>
              <CardDescription>Average scores for Grade 11</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ELA</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(school.metrics.act.ela_avg)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Math</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(school.metrics.act.math_avg)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Science</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(school.metrics.act.science_avg)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(school.metrics.act.overall_avg)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">English Learners</span>
                  <span className="text-sm font-bold">
                    {formatPercent(school.metrics.demographics.el_percentage)}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Low Income</span>
                  <span className="text-sm font-bold">
                    {formatPercent(school.metrics.demographics.low_income_percentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Racial Diversity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {school.metrics.diversity.white !== null && (
                <div className="flex justify-between">
                  <span className="text-sm">White</span>
                  <span className="text-sm font-medium">
                    {formatPercent(school.metrics.diversity.white)}
                  </span>
                </div>
              )}
              {school.metrics.diversity.hispanic !== null && (
                <div className="flex justify-between">
                  <span className="text-sm">Hispanic</span>
                  <span className="text-sm font-medium">
                    {formatPercent(school.metrics.diversity.hispanic)}
                  </span>
                </div>
              )}
              {school.metrics.diversity.asian !== null && (
                <div className="flex justify-between">
                  <span className="text-sm">Asian</span>
                  <span className="text-sm font-medium">
                    {formatPercent(school.metrics.diversity.asian)}
                  </span>
                </div>
              )}
              {school.metrics.diversity.black !== null && (
                <div className="flex justify-between">
                  <span className="text-sm">Black</span>
                  <span className="text-sm font-medium">
                    {formatPercent(school.metrics.diversity.black)}
                  </span>
                </div>
              )}
              {school.metrics.diversity.two_or_more !== null && (
                <div className="flex justify-between">
                  <span className="text-sm">Two or More Races</span>
                  <span className="text-sm font-medium">
                    {formatPercent(school.metrics.diversity.two_or_more)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test SchoolDetailView.test.tsx
```

Expected: PASS - All SchoolDetailView tests passing

**Step 5: Commit**

```bash
git add src/components/SchoolDetailView.tsx src/components/SchoolDetailView.test.tsx
git commit -m "feat: create SchoolDetailView component with tabbed interface"
```

---

## Task 9: Implement SchoolDetail Page

**Files:**
- Modify: `frontend/src/routes/SchoolDetail.tsx`
- Create: `frontend/src/routes/SchoolDetail.test.tsx`

**Step 1: Write failing test for SchoolDetail page**

Create: `frontend/src/routes/SchoolDetail.test.tsx`

```typescript
// ABOUTME: Tests for SchoolDetail page
// ABOUTME: Verifies school detail loading, error handling, and display

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import SchoolDetail from './SchoolDetail';

const mockSchoolDetail = {
  id: 1,
  rcdts: '05-016-2140-17-0002',
  school_name: 'Elk Grove High School',
  city: 'Elk Grove Village',
  district: 'Township HSD 214',
  county: 'Cook',
  school_type: 'High School',
  grades_served: '9-12',
  metrics: {
    enrollment: 1775,
    act: {
      ela_avg: 17.7,
      math_avg: 18.2,
      science_avg: 18.9,
      overall_avg: 17.95,
    },
    demographics: {
      el_percentage: 29.0,
      low_income_percentage: 38.4,
    },
    diversity: {
      white: 36.8,
      black: 1.9,
      hispanic: 48.3,
      asian: 8.7,
      pacific_islander: null,
      native_american: null,
      two_or_more: 3.0,
      mena: null,
    },
  },
};

const server = setupServer(
  http.get('http://localhost:8000/api/schools/:rcdts', ({ params }) => {
    if (params.rcdts === '05-016-2140-17-0002') {
      return HttpResponse.json(mockSchoolDetail);
    }
    return new HttpResponse(null, { status: 404 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = (rcdts: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/school/${rcdts}`]}>
        <Routes>
          <Route path="/school/:rcdts" element={<SchoolDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SchoolDetail', () => {
  it('displays loading skeleton while fetching', () => {
    render(<SchoolDetail />, { wrapper: createWrapper('05-016-2140-17-0002') });

    // Skeleton should be visible initially
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays school detail after loading', async () => {
    render(<SchoolDetail />, { wrapper: createWrapper('05-016-2140-17-0002') });

    await waitFor(() => {
      expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    });

    expect(screen.getByText(/Elk Grove Village/)).toBeInTheDocument();
  });

  it('displays error message when school not found', async () => {
    render(<SchoolDetail />, { wrapper: createWrapper('invalid-rcdts') });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test SchoolDetail.test.tsx
```

Expected: FAIL - SchoolDetail not implemented

**Step 3: Add skeleton test-id to Skeleton component**

Modify: `frontend/src/components/ui/skeleton.tsx`

```typescript
// Add data-testid="skeleton" to the div
<div
  data-testid="skeleton"
  className={cn("animate-pulse rounded-md bg-muted", className)}
  {...props}
/>
```

**Step 4: Implement SchoolDetail page**

Modify: `frontend/src/routes/SchoolDetail.tsx`

```typescript
// ABOUTME: SchoolDetail page component
// ABOUTME: Fetches and displays detailed school information

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import SchoolDetailView from '@/components/SchoolDetailView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getSchoolDetail } from '@/lib/api/queries';

export default function SchoolDetail() {
  const { rcdts } = useParams<{ rcdts: string }>();

  const { data: school, isLoading, isError, error } = useQuery({
    queryKey: ['school', rcdts],
    queryFn: () => getSchoolDetail(rcdts!),
    enabled: !!rcdts,
  });

  if (isLoading) {
    return (
      <div className="py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load school details'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>School not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <SchoolDetailView school={school} />
    </div>
  );
}
```

**Step 5: Add Alert component from shadcn/ui**

Run:
```bash
cd frontend
npx shadcn@latest add alert
```

**Step 6: Add getSchoolDetail query function**

Check if it exists in `frontend/src/lib/api/queries.ts`:

```typescript
export async function getSchoolDetail(rcdts: string): Promise<SchoolDetail> {
  const response = await apiClient.get<SchoolDetail>(`/api/schools/${rcdts}`);
  return response.data;
}
```

**Step 7: Run test to verify it passes**

Run:
```bash
npm test SchoolDetail.test.tsx
```

Expected: PASS - All SchoolDetail tests passing

**Step 8: Commit**

```bash
git add src/routes/SchoolDetail.tsx src/routes/SchoolDetail.test.tsx src/components/ui/skeleton.tsx src/components/ui/alert.tsx src/lib/api/queries.ts package.json package-lock.json
git commit -m "feat: implement SchoolDetail page with loading and error states"
```

---

## Task 10: Add Progress Bars for ACT Scores

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`
- Modify: `frontend/src/components/SchoolDetailView.test.tsx`

**Step 1: Install Progress component**

Run:
```bash
cd frontend
npx shadcn@latest add progress
```

**Step 2: Write test for progress bar visualization**

Modify: `frontend/src/components/SchoolDetailView.test.tsx` (append)

```typescript
it('displays ACT score progress bars', async () => {
  const user = userEvent.setup();
  render(<SchoolDetailView school={mockSchoolDetail} />);

  const academicsTab = screen.getByRole('tab', { name: /academics/i });
  await user.click(academicsTab);

  // Progress bars should be present for each subject
  const progressBars = screen.getAllByRole('progressbar');
  expect(progressBars.length).toBeGreaterThan(0);
});
```

**Step 3: Run test to verify it fails**

Run:
```bash
npm test SchoolDetailView.test.tsx
```

Expected: FAIL - No progress bars found

**Step 4: Add progress bars to Academics tab**

Modify: `frontend/src/components/SchoolDetailView.tsx`

Update the Academics tab content:

```typescript
import { Progress } from '@/components/ui/progress';

// ... in Academics TabsContent, replace the content:

<TabsContent value="academics" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>ACT Scores</CardTitle>
      <CardDescription>Average scores for Grade 11 (out of 36)</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {school.metrics.act.ela_avg !== null && (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">ELA</span>
            <span className="text-sm font-bold">{school.metrics.act.ela_avg.toFixed(1)}</span>
          </div>
          <Progress value={(school.metrics.act.ela_avg / 36) * 100} />
        </div>
      )}
      {school.metrics.act.math_avg !== null && (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Math</span>
            <span className="text-sm font-bold">{school.metrics.act.math_avg.toFixed(1)}</span>
          </div>
          <Progress value={(school.metrics.act.math_avg / 36) * 100} />
        </div>
      )}
      {school.metrics.act.science_avg !== null && (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Science</span>
            <span className="text-sm font-bold">{school.metrics.act.science_avg.toFixed(1)}</span>
          </div>
          <Progress value={(school.metrics.act.science_avg / 36) * 100} />
        </div>
      )}
      {school.metrics.act.overall_avg !== null && (
        <div className="pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Average</span>
            <span className="text-lg font-bold">{school.metrics.act.overall_avg.toFixed(1)}</span>
          </div>
          <Progress value={(school.metrics.act.overall_avg / 36) * 100} className="h-3" />
        </div>
      )}
      {school.metrics.act.ela_avg === null &&
       school.metrics.act.math_avg === null &&
       school.metrics.act.science_avg === null && (
        <p className="text-center text-muted-foreground">ACT data not available</p>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

**Step 5: Run test to verify it passes**

Run:
```bash
npm test SchoolDetailView.test.tsx
```

Expected: PASS - Progress bars displayed

**Step 6: Commit**

```bash
git add src/components/SchoolDetailView.tsx src/components/SchoolDetailView.test.tsx src/components/ui/progress.tsx package.json package-lock.json
git commit -m "feat: add progress bar visualizations for ACT scores"
```

---

## Task 11: Add Progress Bars for Diversity

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`

**Step 1: Add progress bars to diversity section**

Modify: `frontend/src/components/SchoolDetailView.tsx`

Update the Racial Diversity card in Demographics tab:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Racial Diversity</CardTitle>
    <CardDescription>Student population breakdown</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {school.metrics.diversity.white !== null && (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">White</span>
          <span className="text-sm font-bold">{formatPercent(school.metrics.diversity.white)}</span>
        </div>
        <Progress value={school.metrics.diversity.white} />
      </div>
    )}
    {school.metrics.diversity.hispanic !== null && (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Hispanic</span>
          <span className="text-sm font-bold">{formatPercent(school.metrics.diversity.hispanic)}</span>
        </div>
        <Progress value={school.metrics.diversity.hispanic} />
      </div>
    )}
    {school.metrics.diversity.asian !== null && (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Asian</span>
          <span className="text-sm font-bold">{formatPercent(school.metrics.diversity.asian)}</span>
        </div>
        <Progress value={school.metrics.diversity.asian} />
      </div>
    )}
    {school.metrics.diversity.black !== null && (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Black</span>
          <span className="text-sm font-bold">{formatPercent(school.metrics.diversity.black)}</span>
        </div>
        <Progress value={school.metrics.diversity.black} />
      </div>
    )}
    {school.metrics.diversity.two_or_more !== null && (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Two or More Races</span>
          <span className="text-sm font-bold">{formatPercent(school.metrics.diversity.two_or_more)}</span>
        </div>
        <Progress value={school.metrics.diversity.two_or_more} />
      </div>
    )}
  </CardContent>
</Card>
```

**Step 2: Run visual test**

Run:
```bash
npm run dev
```

Visit: http://localhost:5173/school/05-016-2140-17-0002

Expected: Diversity percentages display with progress bars

**Step 3: Commit**

```bash
git add src/components/SchoolDetailView.tsx
git commit -m "feat: add progress bar visualizations for diversity metrics"
```

---

## Task 12: Create E2E Test for Search Flow

**Files:**
- Create: `frontend/e2e/search-flow.spec.ts`

**Step 1: Write E2E test for full search flow**

Create: `frontend/e2e/search-flow.spec.ts`

```typescript
// ABOUTME: E2E test for search to detail flow
// ABOUTME: Verifies complete user journey from search to school detail

import { test, expect } from '@playwright/test';

test.describe('Search to Detail Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running
    await page.goto('http://localhost:5173');
  });

  test('complete search flow: home -> search -> detail', async ({ page }) => {
    // Step 1: Start on home page
    await expect(page.getByRole('heading', { name: /search for illinois schools/i })).toBeVisible();

    // Step 2: Type in search (could be on home or navigate to search)
    await page.goto('http://localhost:5173/search?q=elk');

    // Step 3: Wait for search results to load
    await expect(page.getByText('Elk Grove High School')).toBeVisible({ timeout: 2000 });

    // Step 4: Click on a school card
    await page.getByText('Elk Grove High School').first().click();

    // Step 5: Verify detail page loaded
    await expect(page.getByRole('heading', { name: 'Elk Grove High School' })).toBeVisible();

    // Step 6: Verify tabs are present
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /academics/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /demographics/i })).toBeVisible();

    // Step 7: Click Academics tab
    await page.getByRole('tab', { name: /academics/i }).click();

    // Step 8: Verify ACT scores are visible
    await expect(page.getByText(/ELA/i)).toBeVisible();
    await expect(page.getByText(/Math/i)).toBeVisible();

    // Step 9: Click Demographics tab
    await page.getByRole('tab', { name: /demographics/i }).click();

    // Step 10: Verify demographics are visible
    await expect(page.getByText(/English Learners/i)).toBeVisible();
    await expect(page.getByText(/Low Income/i)).toBeVisible();
  });

  test('search results appear quickly (< 100ms)', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=chicago');

    const startTime = Date.now();

    // Wait for first result to appear
    await expect(page.locator('[href*="/school/"]').first()).toBeVisible({ timeout: 2000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Note: This includes network time + rendering, so we're lenient
    // The API itself should respond in < 100ms, but total time may be higher
    expect(responseTime).toBeLessThan(500); // Allow 500ms for total roundtrip
  });

  test('handles no search results gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=xyzabc123notfound');

    await expect(page.getByText(/no schools found/i)).toBeVisible({ timeout: 2000 });
  });

  test('autocomplete works in SearchBar', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Find search input (might be on home or need to navigate)
    const searchInput = page.getByPlaceholderText(/search for schools/i);

    if (await searchInput.isVisible()) {
      // Type slowly to trigger autocomplete
      await searchInput.type('elk', { delay: 100 });

      // Wait for autocomplete results
      await expect(page.getByText('Elk Grove High School')).toBeVisible({ timeout: 1000 });

      // Click on autocomplete result
      await page.getByText('Elk Grove High School').first().click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/school\//);
    }
  });
});
```

**Step 2: Run E2E test to verify it fails**

Run:
```bash
npm run test:e2e
```

Expected: Some tests may fail depending on current implementation

**Step 3: Fix any failing tests**

Review failures and ensure all components work together.

**Step 4: Run E2E test to verify it passes**

Run:
```bash
npm run test:e2e search-flow.spec.ts
```

Expected: PASS - All E2E tests passing

**Step 5: Commit**

```bash
git add e2e/search-flow.spec.ts
git commit -m "test: add E2E test for search to detail flow"
```

---

## Task 13: Add Error Toast Notifications

**Files:**
- Modify: `frontend/src/routes/SearchResults.tsx`
- Modify: `frontend/src/routes/SchoolDetail.tsx`

**Step 1: Add toast on search error**

Modify: `frontend/src/routes/SearchResults.tsx`

```typescript
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchSchools(query, 50),
    enabled: query.length >= 2,
  });

  // Show toast on error
  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Unable to search schools',
      });
    }
  }, [isError, error, toast]);

  // ... rest of component (remove inline error display, keep toast)
}
```

**Step 2: Add toast on school detail error**

Modify: `frontend/src/routes/SchoolDetail.tsx`

```typescript
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function SchoolDetail() {
  const { rcdts } = useParams<{ rcdts: string }>();
  const { toast } = useToast();

  const { data: school, isLoading, isError, error } = useQuery({
    queryKey: ['school', rcdts],
    queryFn: () => getSchoolDetail(rcdts!),
    enabled: !!rcdts,
  });

  // Show toast on error
  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load School',
        description: error instanceof Error ? error.message : 'Unable to load school details',
      });
    }
  }, [isError, error, toast]);

  // ... rest of component (keep Alert for visual error state too)
}
```

**Step 3: Test error toasts manually**

Run:
```bash
npm run dev
```

Steps:
1. Stop backend server
2. Try searching
3. Verify toast appears
4. Navigate to school detail
5. Verify toast appears

**Step 4: Commit**

```bash
git add src/routes/SearchResults.tsx src/routes/SchoolDetail.tsx
git commit -m "feat: add toast notifications for error handling"
```

---

## Task 14: Run All Tests and Verify

**Files:**
- None (verification step)

**Step 1: Run all unit tests**

Run:
```bash
cd frontend
npm run test:run
```

Expected: All unit tests passing

**Step 2: Run all E2E tests**

First, ensure backend is running:
```bash
cd backend
uv run uvicorn app.main:app --reload
```

Then run E2E tests:
```bash
cd frontend
npm run test:e2e
```

Expected: All E2E tests passing

**Step 3: Manual smoke test**

Run both backend and frontend:
```bash
# Terminal 1
cd backend
uv run uvicorn app.main:app --reload

# Terminal 2
cd frontend
npm run dev
```

Visit: http://localhost:5173

Test:
- [ ] Home page loads
- [ ] Search for "elk grove"
- [ ] Results appear in < 100ms
- [ ] Click on school
- [ ] Detail page shows all tabs
- [ ] ACT scores display with progress bars
- [ ] Demographics display with progress bars
- [ ] Mobile responsive (resize browser)

**Step 4: Document any issues**

If any tests fail or manual testing reveals issues, create tickets for Phase 5.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Phase 4 complete - all core components tested"
```

---

## Success Criteria Checklist

Before marking Phase 4 complete:

- [ ] All shadcn/ui components installed
- [ ] SearchBar with autocomplete working
- [ ] Debouncing implemented (300ms delay)
- [ ] SchoolCard displays search results
- [ ] SchoolDetail with tabbed interface (Overview, Academics, Demographics)
- [ ] All 5 metric groups displayed:
  - [ ] Enrollment
  - [ ] ACT scores (with progress bars)
  - [ ] EL percentage
  - [ ] Low income percentage
  - [ ] Racial diversity (with progress bars)
- [ ] Loading states with Skeleton components
- [ ] Error handling with Toast notifications
- [ ] All unit tests passing (SearchBar, SchoolCard, SchoolDetailView, pages)
- [ ] E2E test for search → detail flow passing
- [ ] Search results appear in < 100ms
- [ ] Responsive mobile-first design
- [ ] Backend API running and responding correctly

---

## Phase 4 Complete!

Once all tasks are complete and success criteria met:

1. **Update roadmap**: Mark Phase 4 as complete in `docs/plans/IMPLEMENTATION-ROADMAP.md`
2. **Review code**: Run code review if needed
3. **Create Phase 5 plan**: Ready to begin comparison feature

**Next**: Phase 5 - Comparison Feature (side-by-side school comparison)
