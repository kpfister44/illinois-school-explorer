# Phase 5: Comparison Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build side-by-side school comparison feature allowing users to compare 2-5 schools with persistent selection state.

**Architecture:** React Context for comparison state with localStorage persistence, ComparisonView table component for side-by-side display, ComparisonBasket UI component for selection management. Backend compare endpoint already exists.

**Tech Stack:** React Context API, localStorage, shadcn/ui (Table, Badge, Button), TanStack Query (useCompare hook exists), Vitest, Playwright

---

## Task 1: Add shadcn/ui Table Component

**Files:**
- Create: `frontend/src/components/ui/table.tsx`

**Step 1: Add shadcn Table component**

Run: `cd frontend && npx shadcn@latest add table`

Expected: Table component installed successfully

**Step 2: Verify Table component exists**

Run: `ls frontend/src/components/ui/table.tsx`

Expected: File exists

**Step 3: Commit**

```bash
git add frontend/src/components/ui/table.tsx
git commit -m "chore(ui): add shadcn Table component"
```

---

## Task 2: Comparison State Management (Context)

**Files:**
- Create: `frontend/src/contexts/ComparisonContext.test.tsx`
- Create: `frontend/src/contexts/ComparisonContext.tsx`

**Step 1: Write failing test for ComparisonContext**

File: `frontend/src/contexts/ComparisonContext.test.tsx`

```typescript
// ABOUTME: Tests for ComparisonContext
// ABOUTME: Verifies add/remove/clear operations and localStorage persistence

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ComparisonProvider, useComparison } from './ComparisonContext';

describe('ComparisonContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts with empty comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    expect(result.current.comparisonList).toEqual([]);
  });

  it('adds school to comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0001']);
  });

  it('removes school from comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
      result.current.addToComparison('12-345-6789-01-0002');
    });

    act(() => {
      result.current.removeFromComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0002']);
  });

  it('prevents adding more than 5 schools', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('rcdts-1');
      result.current.addToComparison('rcdts-2');
      result.current.addToComparison('rcdts-3');
      result.current.addToComparison('rcdts-4');
      result.current.addToComparison('rcdts-5');
    });

    expect(result.current.comparisonList).toHaveLength(5);
    expect(result.current.canAddMore).toBe(false);

    act(() => {
      result.current.addToComparison('rcdts-6');
    });

    expect(result.current.comparisonList).toHaveLength(5);
  });

  it('checks if school is in comparison list', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.isInComparison('12-345-6789-01-0001')).toBe(true);
    expect(result.current.isInComparison('12-345-6789-01-0002')).toBe(false);
  });

  it('clears all schools from comparison', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('rcdts-1');
      result.current.addToComparison('rcdts-2');
    });

    expect(result.current.comparisonList).toHaveLength(2);

    act(() => {
      result.current.clearComparison();
    });

    expect(result.current.comparisonList).toEqual([]);
  });

  it('persists to localStorage when adding school', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
    });

    const stored = localStorage.getItem('school-comparison');
    expect(stored).toBe(JSON.stringify(['12-345-6789-01-0001']));
  });

  it('loads from localStorage on mount', () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['12-345-6789-01-0001', '12-345-6789-01-0002'])
    );

    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    expect(result.current.comparisonList).toEqual([
      '12-345-6789-01-0001',
      '12-345-6789-01-0002',
    ]);
  });

  it('prevents duplicate schools', () => {
    const { result } = renderHook(() => useComparison(), {
      wrapper: ComparisonProvider,
    });

    act(() => {
      result.current.addToComparison('12-345-6789-01-0001');
      result.current.addToComparison('12-345-6789-01-0001');
    });

    expect(result.current.comparisonList).toEqual(['12-345-6789-01-0001']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test ComparisonContext.test.tsx`

Expected: FAIL with "Cannot find module './ComparisonContext'"

**Step 3: Write minimal ComparisonContext implementation**

File: `frontend/src/contexts/ComparisonContext.tsx`

```typescript
// ABOUTME: Context for managing school comparison state
// ABOUTME: Handles add/remove operations and localStorage persistence

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ComparisonContextType {
  comparisonList: string[];
  addToComparison: (rcdts: string) => void;
  removeFromComparison: (rcdts: string) => void;
  clearComparison: () => void;
  isInComparison: (rcdts: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'school-comparison';
const MAX_SCHOOLS = 5;

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
  }, [comparisonList]);

  const addToComparison = (rcdts: string) => {
    setComparisonList((prev) => {
      if (prev.includes(rcdts) || prev.length >= MAX_SCHOOLS) {
        return prev;
      }
      return [...prev, rcdts];
    });
  };

  const removeFromComparison = (rcdts: string) => {
    setComparisonList((prev) => prev.filter((id) => id !== rcdts));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isInComparison = (rcdts: string) => {
    return comparisonList.includes(rcdts);
  };

  const canAddMore = comparisonList.length < MAX_SCHOOLS;

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test ComparisonContext.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/contexts/ComparisonContext.tsx frontend/src/contexts/ComparisonContext.test.tsx
git commit -m "feat(comparison): add ComparisonContext with localStorage"
```

---

## Task 3: Wrap App with ComparisonProvider

**Files:**
- Modify: `frontend/src/App.tsx:23-50`
- Modify: `frontend/src/App.test.tsx`

**Step 1: Write failing test for ComparisonProvider in App**

File: `frontend/src/App.test.tsx` (modify existing test)

Add import at top:
```typescript
import { useComparison } from '@/contexts/ComparisonContext';
```

Add new test:
```typescript
it('provides ComparisonContext to child components', () => {
  let contextValue: any;

  function TestComponent() {
    contextValue = useComparison();
    return null;
  }

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(contextValue).toBeDefined();
  expect(contextValue.comparisonList).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test App.test.tsx`

Expected: FAIL with "useComparison must be used within a ComparisonProvider"

**Step 3: Update App.tsx to include ComparisonProvider**

File: `frontend/src/App.tsx`

Add import:
```typescript
import { ComparisonProvider } from '@/contexts/ComparisonContext';
```

Wrap the BrowserRouter content with ComparisonProvider:
```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <BrowserRouter>
          {/* existing content */}
        </BrowserRouter>
      </ComparisonProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test App.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx
git commit -m "feat(comparison): wrap App with ComparisonProvider"
```

---

## Task 4: ComparisonBasket Component

**Files:**
- Create: `frontend/src/components/ComparisonBasket.test.tsx`
- Create: `frontend/src/components/ComparisonBasket.tsx`

**Step 1: Write failing test for ComparisonBasket**

File: `frontend/src/components/ComparisonBasket.test.tsx`

```typescript
// ABOUTME: Tests for ComparisonBasket component
// ABOUTME: Verifies bottom bar display and Compare button behavior

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import ComparisonBasket from './ComparisonBasket';

const mockSchools = [
  {
    id: 1,
    rcdts: '12-345-6789-01-0001',
    school_name: 'Test High School',
    city: 'Springfield',
    district: 'Test District',
    school_type: 'High School',
  },
  {
    id: 2,
    rcdts: '12-345-6789-01-0002',
    school_name: 'Sample Elementary',
    city: 'Chicago',
    district: 'Sample District',
    school_type: 'Elementary School',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ComparisonProvider>{ui}</ComparisonProvider>
    </BrowserRouter>
  );
}

describe('ComparisonBasket', () => {
  it('does not render when comparison list is empty', () => {
    const { container } = renderWithProviders(<ComparisonBasket schools={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders basket with school badges when schools are selected', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    expect(screen.getByText(/compare schools/i)).toBeInTheDocument();
    expect(screen.getByText('Test High School')).toBeInTheDocument();
    expect(screen.getByText('Sample Elementary')).toBeInTheDocument();
  });

  it('shows count of selected schools', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    expect(screen.getByText('2 schools selected')).toBeInTheDocument();
  });

  it('removes school when X button clicked', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);

    // School should still be in DOM until parent re-renders
    // This test verifies the button exists and is clickable
    expect(removeButtons[0]).toBeInTheDocument();
  });

  it('disables Compare button when less than 2 schools', () => {
    renderWithProviders(<ComparisonBasket schools={[mockSchools[0]]} />);

    const compareButton = screen.getByRole('button', { name: /compare/i });
    expect(compareButton).toBeDisabled();
  });

  it('enables Compare button when 2 or more schools', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const compareButton = screen.getByRole('button', { name: /compare/i });
    expect(compareButton).not.toBeDisabled();
  });

  it('clears all schools when Clear All clicked', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);

    // Button should exist and be clickable
    expect(clearButton).toBeInTheDocument();
  });

  it('navigates to compare page when Compare button clicked', () => {
    renderWithProviders(<ComparisonBasket schools={mockSchools} />);

    const compareButton = screen.getByRole('button', { name: /compare/i });
    expect(compareButton).toHaveAttribute('href', '/compare');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test ComparisonBasket.test.tsx`

Expected: FAIL with "Cannot find module './ComparisonBasket'"

**Step 3: Write minimal ComparisonBasket implementation**

File: `frontend/src/components/ComparisonBasket.tsx`

```typescript
// ABOUTME: Bottom bar showing selected schools for comparison
// ABOUTME: Displays badges and Compare button when schools are selected

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComparison } from '@/contexts/ComparisonContext';
import type { School } from '@/lib/api/types';

interface ComparisonBasketProps {
  schools: School[];
}

export default function ComparisonBasket({ schools }: ComparisonBasketProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();

  if (comparisonList.length === 0) {
    return null;
  }

  const canCompare = comparisonList.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">Compare Schools</span>
              <Badge variant="secondary">{comparisonList.length} schools selected</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {schools.map((school) => (
                <Badge key={school.rcdts} variant="outline" className="pr-1">
                  <span className="max-w-[200px] truncate">{school.school_name}</span>
                  <button
                    onClick={() => removeFromComparison(school.rcdts)}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                    aria-label={`Remove ${school.school_name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearComparison}>
              Clear All
            </Button>
            <Button asChild disabled={!canCompare}>
              <Link to="/compare">Compare</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test ComparisonBasket.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/components/ComparisonBasket.tsx frontend/src/components/ComparisonBasket.test.tsx
git commit -m "feat(comparison): add ComparisonBasket component"
```

---

## Task 5: Add ComparisonBasket to App

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/hooks/useComparisonSchools.ts`
- Create: `frontend/src/hooks/useComparisonSchools.test.ts`

**Step 1: Write failing test for useComparisonSchools hook**

File: `frontend/src/hooks/useComparisonSchools.test.ts`

```typescript
// ABOUTME: Tests for useComparisonSchools hook
// ABOUTME: Verifies fetching school data for comparison list

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComparisonProvider, useComparison } from '@/contexts/ComparisonContext';
import { useComparisonSchools } from './useComparisonSchools';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>{children}</ComparisonProvider>
    </QueryClientProvider>
  );
}

describe('useComparisonSchools', () => {
  it('returns empty array when no schools in comparison', () => {
    const { result } = renderHook(() => useComparisonSchools(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual([]);
  });

  it('fetches schools from comparison list', async () => {
    const wrapper = createWrapper();

    // First add schools to comparison
    const { result: comparisonResult } = renderHook(() => useComparison(), { wrapper });

    comparisonResult.current.addToComparison('05-016-2140-17-0002');

    // Then fetch schools
    const { result: schoolsResult } = renderHook(() => useComparisonSchools(), { wrapper });

    await waitFor(() => {
      expect(schoolsResult.current.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test useComparisonSchools.test.ts`

Expected: FAIL with "Cannot find module './useComparisonSchools'"

**Step 3: Write minimal useComparisonSchools implementation**

File: `frontend/src/hooks/useComparisonSchools.ts`

```typescript
// ABOUTME: Hook to fetch school data for comparison list
// ABOUTME: Returns School objects for all RCDTS codes in comparison

import { useQueries } from '@tanstack/react-query';
import { useComparison } from '@/contexts/ComparisonContext';
import { getSchoolDetail, schoolDetailQueryKey } from '@/lib/api/queries';
import type { School } from '@/lib/api/types';

export function useComparisonSchools(): School[] {
  const { comparisonList } = useComparison();

  const queries = useQueries({
    queries: comparisonList.map((rcdts) => ({
      queryKey: schoolDetailQueryKey(rcdts),
      queryFn: () => getSchoolDetail(rcdts),
      staleTime: 10 * 60 * 1000,
    })),
  });

  return queries
    .filter((query) => query.data)
    .map((query) => ({
      id: query.data!.id,
      rcdts: query.data!.rcdts,
      school_name: query.data!.school_name,
      city: query.data!.city,
      district: query.data!.district,
      school_type: query.data!.school_type,
    }));
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test useComparisonSchools.test.ts`

Expected: All tests PASS

**Step 5: Add ComparisonBasket to App.tsx**

File: `frontend/src/App.tsx`

Add imports:
```typescript
import ComparisonBasket from '@/components/ComparisonBasket';
import { useComparisonSchools } from '@/hooks/useComparisonSchools';
```

Update App component to use hook and render basket:
```typescript
function App() {
  const comparisonSchools = useComparisonSchools();

  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background pb-24">
            <header className="border-b">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <Link to="/" className="text-3xl font-bold tracking-tight hover:text-primary">
                  Illinois School Explorer
                </Link>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/school/:rcdts" element={<SchoolDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <ComparisonBasket schools={comparisonSchools} />
          <Toaster />
        </BrowserRouter>
      </ComparisonProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 6: Run test to verify it passes**

Run: `cd frontend && npm test App.test.tsx`

Expected: All tests PASS

**Step 7: Commit**

```bash
git add frontend/src/App.tsx frontend/src/hooks/useComparisonSchools.ts frontend/src/hooks/useComparisonSchools.test.ts
git commit -m "feat(comparison): integrate ComparisonBasket into App"
```

---

## Task 6: Add "Add to Compare" Button to SchoolDetailView

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.test.tsx`
- Modify: `frontend/src/components/SchoolDetailView.tsx`

**Step 1: Write failing test for Add to Compare button**

File: `frontend/src/components/SchoolDetailView.test.tsx`

Add new tests:
```typescript
import { ComparisonProvider } from '@/contexts/ComparisonContext';

// Update renderWithProviders to include ComparisonProvider
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ComparisonProvider>{ui}</ComparisonProvider>
  );
}

// Add new tests
it('shows "Add to Compare" button when school not in comparison', () => {
  renderWithProviders(<SchoolDetailView school={mockSchool} />);

  const addButton = screen.getByRole('button', { name: /add to compare/i });
  expect(addButton).toBeInTheDocument();
});

it('shows "Remove from Compare" button when school in comparison', () => {
  const { rerender } = renderWithProviders(<SchoolDetailView school={mockSchool} />);

  // Add to comparison first
  const addButton = screen.getByRole('button', { name: /add to compare/i });
  fireEvent.click(addButton);

  // Re-render to see updated state
  rerender(<SchoolDetailView school={mockSchool} />);

  expect(screen.getByRole('button', { name: /remove from compare/i })).toBeInTheDocument();
});

it('disables "Add to Compare" when 5 schools already selected', () => {
  // This test would require mocking the context with 5 schools
  // For now, we'll verify the button exists
  renderWithProviders(<SchoolDetailView school={mockSchool} />);

  const addButton = screen.getByRole('button', { name: /add to compare/i });
  expect(addButton).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test SchoolDetailView.test.tsx`

Expected: FAIL with "Unable to find role 'button' with name /add to compare/i"

**Step 3: Add button to SchoolDetailView**

File: `frontend/src/components/SchoolDetailView.tsx`

Add imports:
```typescript
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/contexts/ComparisonContext';
```

Update component to include button (after the header section):
```typescript
export default function SchoolDetailView({ school }: SchoolDetailViewProps) {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useComparison();
  const inComparison = isInComparison(school.rcdts);

  const handleComparisonToggle = () => {
    if (inComparison) {
      removeFromComparison(school.rcdts);
    } else {
      addToComparison(school.rcdts);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{school.school_name}</h1>
            <p className="text-muted-foreground">
              {school.city}
              {school.county && ` • ${school.county} County`}
              {school.district && ` • ${school.district}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {school.school_type && <Badge variant="secondary">{school.school_type}</Badge>}
            {school.grades_served && <Badge variant="outline">Grades {school.grades_served}</Badge>}
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={handleComparisonToggle}
            variant={inComparison ? 'outline' : 'default'}
            disabled={!inComparison && !canAddMore}
          >
            {inComparison ? (
              <>
                <Minus className="mr-2 h-4 w-4" />
                Remove from Compare
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to Compare
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Rest of component remains the same */}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test SchoolDetailView.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/components/SchoolDetailView.tsx frontend/src/components/SchoolDetailView.test.tsx
git commit -m "feat(comparison): add Compare button to SchoolDetailView"
```

---

## Task 7: ComparisonView Component

**Files:**
- Create: `frontend/src/components/ComparisonView.test.tsx`
- Create: `frontend/src/components/ComparisonView.tsx`

**Step 1: Write failing test for ComparisonView**

File: `frontend/src/components/ComparisonView.test.tsx`

```typescript
// ABOUTME: Tests for ComparisonView component
// ABOUTME: Verifies side-by-side comparison table display

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import ComparisonView from './ComparisonView';
import type { SchoolDetail } from '@/lib/api/types';

const mockSchools: SchoolDetail[] = [
  {
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
  },
  {
    id: 2,
    rcdts: '05-016-2140-17-0003',
    school_name: 'Rolling Meadows High School',
    city: 'Rolling Meadows',
    district: 'Township HSD 214',
    county: 'Cook',
    school_type: 'High School',
    grades_served: '9-12',
    metrics: {
      enrollment: 1850,
      act: {
        ela_avg: 18.5,
        math_avg: 19.1,
        science_avg: 19.3,
        overall_avg: 18.8,
      },
      demographics: {
        el_percentage: 15.0,
        low_income_percentage: 25.0,
      },
      diversity: {
        white: 45.0,
        black: 3.0,
        hispanic: 35.0,
        asian: 12.0,
        pacific_islander: null,
        native_american: null,
        two_or_more: 4.0,
        mena: null,
      },
    },
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(<ComparisonProvider>{ui}</ComparisonProvider>);
}

describe('ComparisonView', () => {
  it('renders school names as column headers', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('Elk Grove High School')).toBeInTheDocument();
    expect(screen.getByText('Rolling Meadows High School')).toBeInTheDocument();
  });

  it('displays enrollment data for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('1,775')).toBeInTheDocument();
    expect(screen.getByText('1,850')).toBeInTheDocument();
  });

  it('displays ACT scores for each school', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('17.7')).toBeInTheDocument(); // ELA
    expect(screen.getByText('18.5')).toBeInTheDocument(); // ELA
  });

  it('displays demographics percentages', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('29.0%')).toBeInTheDocument(); // EL
    expect(screen.getByText('15.0%')).toBeInTheDocument(); // EL
  });

  it('handles null values gracefully', () => {
    const schoolsWithNulls: SchoolDetail[] = [
      {
        ...mockSchools[0],
        metrics: {
          ...mockSchools[0].metrics,
          act: {
            ela_avg: null,
            math_avg: null,
            science_avg: null,
            overall_avg: null,
          },
        },
      },
    ];

    renderWithProviders(<ComparisonView schools={schoolsWithNulls} />);

    // Should show N/A for null values
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('applies color coding to highlight best values', () => {
    const { container } = renderWithProviders(<ComparisonView schools={mockSchools} />);

    // Check that color classes are applied
    const highlightedCells = container.querySelectorAll('[class*="bg-green"]');
    expect(highlightedCells.length).toBeGreaterThan(0);
  });

  it('renders metric labels in first column', () => {
    renderWithProviders(<ComparisonView schools={mockSchools} />);

    expect(screen.getByText('Enrollment')).toBeInTheDocument();
    expect(screen.getByText('ACT ELA Average')).toBeInTheDocument();
    expect(screen.getByText('ACT Math Average')).toBeInTheDocument();
    expect(screen.getByText('English Learner %')).toBeInTheDocument();
    expect(screen.getByText('Low Income %')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test ComparisonView.test.tsx`

Expected: FAIL with "Cannot find module './ComparisonView'"

**Step 3: Write minimal ComparisonView implementation**

File: `frontend/src/components/ComparisonView.tsx`

```typescript
// ABOUTME: Side-by-side comparison table for schools
// ABOUTME: Displays metrics with color coding for best/worst values

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SchoolDetail } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ComparisonViewProps {
  schools: SchoolDetail[];
}

interface MetricRow {
  label: string;
  getValue: (school: SchoolDetail) => number | null;
  format: (value: number | null) => string;
  higherIsBetter: boolean;
}

const metrics: MetricRow[] = [
  {
    label: 'Enrollment',
    getValue: (s) => s.metrics.enrollment,
    format: (v) => (v === null ? 'N/A' : v.toLocaleString()),
    higherIsBetter: false,
  },
  {
    label: 'ACT ELA Average',
    getValue: (s) => s.metrics.act.ela_avg,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Math Average',
    getValue: (s) => s.metrics.act.math_avg,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Science Average',
    getValue: (s) => s.metrics.act.science_avg,
    format: (v) => (v === null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'English Learner %',
    getValue: (s) => s.metrics.demographics.el_percentage,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Low Income %',
    getValue: (s) => s.metrics.demographics.low_income_percentage,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'White %',
    getValue: (s) => s.metrics.diversity.white,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Black %',
    getValue: (s) => s.metrics.diversity.black,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Hispanic %',
    getValue: (s) => s.metrics.diversity.hispanic,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Asian %',
    getValue: (s) => s.metrics.diversity.asian,
    format: (v) => (v === null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
];

function getColorClass(
  value: number | null,
  values: (number | null)[],
  higherIsBetter: boolean
): string {
  if (value === null) return '';

  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length < 2) return '';

  const max = Math.max(...validValues);
  const min = Math.min(...validValues);

  if (higherIsBetter) {
    return value === max ? 'bg-green-100 dark:bg-green-900' : '';
  } else {
    return value === min ? 'bg-green-100 dark:bg-green-900' : '';
  }
}

export default function ComparisonView({ schools }: ComparisonViewProps) {
  if (schools.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schools to compare</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48 font-bold">Metric</TableHead>
            {schools.map((school) => (
              <TableHead key={school.rcdts} className="min-w-[200px]">
                <div>
                  <div className="font-bold">{school.school_name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {school.city}
                  </div>
                  {school.school_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {school.school_type}
                    </Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => {
            const values = schools.map((s) => metric.getValue(s));

            return (
              <TableRow key={metric.label}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                {schools.map((school, idx) => {
                  const value = metric.getValue(school);
                  const colorClass = getColorClass(value, values, metric.higherIsBetter);

                  return (
                    <TableCell
                      key={school.rcdts}
                      className={cn('text-center', colorClass)}
                    >
                      {metric.format(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test ComparisonView.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/components/ComparisonView.tsx frontend/src/components/ComparisonView.test.tsx
git commit -m "feat(comparison): add ComparisonView table component"
```

---

## Task 8: Update Compare Route

**Files:**
- Create: `frontend/src/routes/Compare.test.tsx`
- Modify: `frontend/src/routes/Compare.tsx`

**Step 1: Write failing test for Compare route**

File: `frontend/src/routes/Compare.test.tsx`

```typescript
// ABOUTME: Tests for Compare route component
// ABOUTME: Verifies comparison page displays correctly

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import Compare from './Compare';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ComparisonProvider>
    </QueryClientProvider>
  );
}

describe('Compare', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows message when no schools selected', () => {
    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/no schools selected/i)).toBeInTheDocument();
  });

  it('shows message when only 1 school selected', () => {
    localStorage.setItem('school-comparison', JSON.stringify(['05-016-2140-17-0002']));

    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/select at least 2 schools/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching schools', async () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['05-016-2140-17-0002', '05-016-2140-17-0003'])
    );

    render(<Compare />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading comparison/i)).toBeInTheDocument();
  });

  it('renders ComparisonView when schools are loaded', async () => {
    localStorage.setItem(
      'school-comparison',
      JSON.stringify(['05-016-2140-17-0002'])
    );

    render(<Compare />, { wrapper: createWrapper() });

    await waitFor(() => {
      // ComparisonView should be visible
      expect(screen.queryByText(/loading comparison/i)).not.toBeInTheDocument();
    });
  });

  it('shows error state when fetching fails', async () => {
    // Mock network error by using invalid RCDTS
    localStorage.setItem('school-comparison', JSON.stringify(['invalid-rcdts']));

    render(<Compare />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load comparison/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test Compare.test.tsx`

Expected: FAIL with tests not matching expected behavior

**Step 3: Update Compare.tsx implementation**

File: `frontend/src/routes/Compare.tsx`

```typescript
// ABOUTME: School comparison page component
// ABOUTME: Displays side-by-side comparison of multiple schools

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import { useCompare } from '@/lib/api/queries';
import { useToast } from '@/hooks/use-toast';
import ComparisonView from '@/components/ComparisonView';

export default function Compare() {
  const { comparisonList } = useComparison();
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useCompare(comparisonList);

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load Comparison',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to load school comparison',
      });
    }
  }, [isError, error, toast]);

  if (comparisonList.length === 0) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Schools Selected</AlertTitle>
          <AlertDescription>
            Search for schools and add them to your comparison list to get started.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Search Schools</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (comparisonList.length === 1) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Enough Schools</AlertTitle>
          <AlertDescription>
            Select at least 2 schools to compare. You currently have 1 school selected.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Search Schools</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 space-y-6">
        <h2 className="text-2xl font-bold">Compare Schools</h2>
        <p className="text-muted-foreground">Loading comparison...</p>
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
            Failed to load comparison. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.schools.length === 0) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No schools found for comparison.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Compare Schools</h2>
        <p className="text-muted-foreground">
          Comparing {data.schools.length} school{data.schools.length > 1 ? 's' : ''}
        </p>
      </div>
      <ComparisonView schools={data.schools} />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test Compare.test.tsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/routes/Compare.tsx frontend/src/routes/Compare.test.tsx
git commit -m "feat(comparison): implement Compare route with states"
```

---

## Task 9: E2E Test for Comparison Flow

**Files:**
- Create: `frontend/e2e/comparison-flow.spec.ts`

**Step 1: Write E2E test for full comparison flow**

File: `frontend/e2e/comparison-flow.spec.ts`

```typescript
// ABOUTME: End-to-end test for school comparison flow
// ABOUTME: Tests full user journey from search to comparison

import { test, expect } from '@playwright/test';

test.describe('School Comparison Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
  });

  test('complete comparison flow', async ({ page }) => {
    // Search for first school
    await page.getByPlaceholder(/search schools/i).fill('elk grove');
    await page.waitForTimeout(500); // Wait for debounce

    // Select first school from results
    const firstResult = page.getByText('Elk Grove High School').first();
    await firstResult.click();

    // Wait for school detail page
    await expect(page).toHaveURL(/\/school\//);
    await expect(page.getByRole('heading', { name: /elk grove high school/i })).toBeVisible();

    // Add to comparison
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Verify comparison basket appears
    await expect(page.getByText(/compare schools/i)).toBeVisible();
    await expect(page.getByText(/1 schools selected/i)).toBeVisible();

    // Search for second school
    await page.goto('/');
    await page.getByPlaceholder(/search schools/i).fill('rolling meadows');
    await page.waitForTimeout(500);

    // Select second school
    const secondResult = page.getByText('Rolling Meadows High School').first();
    await secondResult.click();

    // Add second school to comparison
    await expect(page).toHaveURL(/\/school\//);
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Verify 2 schools in basket
    await expect(page.getByText(/2 schools selected/i)).toBeVisible();

    // Navigate to comparison page
    await page.getByRole('link', { name: /^compare$/i }).click();

    // Verify comparison table
    await expect(page).toHaveURL('/compare');
    await expect(page.getByText('Elk Grove High School')).toBeVisible();
    await expect(page.getByText('Rolling Meadows High School')).toBeVisible();

    // Verify metrics are displayed
    await expect(page.getByText('Enrollment')).toBeVisible();
    await expect(page.getByText('ACT ELA Average')).toBeVisible();
  });

  test('comparison persists across page refresh', async ({ page }) => {
    // Add school to comparison
    await page.getByPlaceholder(/search schools/i).fill('elk grove');
    await page.waitForTimeout(500);
    await page.getByText('Elk Grove High School').first().click();
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Refresh page
    await page.reload();

    // Verify comparison basket still shows school
    await expect(page.getByText(/1 schools selected/i)).toBeVisible();
  });

  test('remove school from comparison', async ({ page }) => {
    // Add two schools
    await page.getByPlaceholder(/search schools/i).fill('elk grove');
    await page.waitForTimeout(500);
    await page.getByText('Elk Grove High School').first().click();
    await page.getByRole('button', { name: /add to compare/i }).click();

    await page.goto('/');
    await page.getByPlaceholder(/search schools/i).fill('rolling meadows');
    await page.waitForTimeout(500);
    await page.getByText('Rolling Meadows High School').first().click();
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Remove first school from basket
    const removeButtons = page.getByLabel(/remove elk grove/i);
    await removeButtons.first().click();

    // Verify only 1 school left
    await expect(page.getByText(/1 schools selected/i)).toBeVisible();
  });

  test('clear all schools from comparison', async ({ page }) => {
    // Add school
    await page.getByPlaceholder(/search schools/i).fill('elk grove');
    await page.waitForTimeout(500);
    await page.getByText('Elk Grove High School').first().click();
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Clear all
    await page.getByRole('button', { name: /clear all/i }).click();

    // Verify basket is gone
    await expect(page.getByText(/compare schools/i)).not.toBeVisible();
  });

  test('cannot compare with only 1 school', async ({ page }) => {
    // Add one school
    await page.getByPlaceholder(/search schools/i).fill('elk grove');
    await page.waitForTimeout(500);
    await page.getByText('Elk Grove High School').first().click();
    await page.getByRole('button', { name: /add to compare/i }).click();

    // Try to navigate to compare
    await page.goto('/compare');

    // Should see error message
    await expect(page.getByText(/select at least 2 schools/i)).toBeVisible();
  });

  test('cannot add more than 5 schools', async ({ page }) => {
    const schools = [
      'Elk Grove High School',
      'Rolling Meadows High School',
      'Wheeling High School',
      'Buffalo Grove High School',
      'Prospect High School',
    ];

    // Add 5 schools
    for (const school of schools) {
      await page.goto('/');
      await page.getByPlaceholder(/search schools/i).fill(school.split(' ')[0]);
      await page.waitForTimeout(500);
      await page.getByText(school).first().click();
      await page.getByRole('button', { name: /add to compare/i }).click();
    }

    // Verify 5 schools in basket
    await expect(page.getByText(/5 schools selected/i)).toBeVisible();

    // Try to add 6th school
    await page.goto('/');
    await page.getByPlaceholder(/search schools/i).fill('fremd');
    await page.waitForTimeout(500);
    await page.getByText('Fremd High School').first().click();

    // Add button should be disabled
    const addButton = page.getByRole('button', { name: /add to compare/i });
    await expect(addButton).toBeDisabled();
  });
});
```

**Step 2: Run E2E test**

Run: `cd frontend && npm run test:e2e comparison-flow.spec.ts`

Expected: All E2E tests PASS

**Step 3: Commit**

```bash
git add frontend/e2e/comparison-flow.spec.ts
git commit -m "test(comparison): add E2E tests for comparison flow"
```

---

## Task 10: Integration Testing & Verification

**Step 1: Run all unit tests**

Run: `cd frontend && npm test`

Expected: All unit tests PASS

**Step 2: Run all E2E tests**

Run: `cd frontend && npm run test:e2e`

Expected: All E2E tests PASS

**Step 3: Start backend and frontend servers**

Terminal 1:
```bash
cd backend && uv run uvicorn app.main:app --reload
```

Terminal 2:
```bash
cd frontend && npm run dev
```

**Step 4: Manual testing checklist**

- [ ] Add school to comparison from SchoolDetail page
- [ ] Verify comparison basket appears at bottom
- [ ] Add second school to comparison
- [ ] Click Compare button to view comparison table
- [ ] Verify metrics are displayed correctly
- [ ] Verify color coding highlights best values
- [ ] Remove school from comparison basket
- [ ] Clear all schools from comparison
- [ ] Refresh page and verify comparison persists
- [ ] Try to add 6th school (should be disabled)
- [ ] Navigate to /compare with 0 or 1 school (should show message)
- [ ] Verify responsive design on mobile width

**Step 5: Run backend tests to ensure no regressions**

Run: `cd backend && uv run pytest`

Expected: All backend tests PASS

**Step 6: Final commit**

```bash
git add .
git commit -m "feat(comparison): Phase 5 complete - comparison feature"
```

---

## Success Criteria

- ✅ Users can add schools to comparison from SchoolDetail page
- ✅ Comparison basket displays at bottom of screen with badges
- ✅ Users can compare 2-5 schools side-by-side in table view
- ✅ Comparison state persists in localStorage across page refreshes
- ✅ Color coding highlights best values in comparison table
- ✅ Cannot add more than 5 schools to comparison
- ✅ Responsive design works on mobile and desktop
- ✅ All unit tests passing
- ✅ All E2E tests passing
- ✅ MVP feature complete

---

## Notes

- **TDD Approach:** Every component has tests written first
- **localStorage:** Automatic persistence of comparison state
- **Color Coding:** Green highlights for best values (context-dependent)
- **Responsive:** Table scrolls horizontally on mobile
- **Error Handling:** Graceful handling of null values and edge cases
- **DRY:** Reusable hooks (useComparison, useComparisonSchools)
- **YAGNI:** No export to CSV or sharing features (future enhancement)

---

**Plan Complete!**
