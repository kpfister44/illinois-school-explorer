# ABOUTME: Comprehensive frontend documentation for React components, routing, and API integration
# ABOUTME: Primary reference for Claude Code sessions working with the frontend

# Illinois School Explorer - Frontend

React + TypeScript frontend for the Illinois School Explorer application.

**Tech:** React 18, TypeScript 5, Vite 5, shadcn/ui, Tailwind CSS 3
**Testing:** 23 unit test files, 6 E2E test files (Vitest + Playwright)
**Status:** Fully implemented with search, detail views, comparison, leaderboards, and historical data visualization

---

## Tech Stack

- **React 18** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Vite 5** - Build tool and dev server
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first CSS
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## Features Implemented

**Core Features:**
- ✅ Full-text school search with autocomplete
- ✅ School detail pages with all metrics
- ✅ Multi-school comparison (2-5 schools)
- ✅ Top 100 leaderboards (ACT/IAR by level)
- ✅ Historical data visualization (2019-2025)
- ✅ Trend analysis (1/3/5 year windows)
- ✅ Comparison basket with persistent selection
- ✅ Responsive design with shadcn/ui components

**Technical:**
- ✅ React Router navigation with header/footer
- ✅ TanStack Query for server state
- ✅ Toast notifications for user feedback
- ✅ Comprehensive test coverage (23 unit + 6 E2E)
- ✅ Type-safe API integration matching backend

---

## Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8000

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## Available Scripts

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing

```bash
npm run test         # Run unit tests (watch mode)
npm run test:run     # Run unit tests (single run)
npm run test:ui      # Run unit tests with UI
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Run E2E tests with UI
```

To focus the new leaderboard journey:

```bash
npx playwright test tests/e2e/top-scores-flow.spec.ts --reporter=list
```

The spec navigates via the homepage CTA, flips between ACT/IAR tabs, and opens a school detail page to ensure the leaderboard behaves as designed.

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   ├── api/          # API client and queries
│   │   └── utils.ts      # Utility functions
│   ├── routes/           # Page components
│   ├── test/             # Test setup
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tests/
│   └── e2e/              # Playwright E2E tests
├── vitest.config.ts      # Vitest configuration
├── playwright.config.ts  # Playwright configuration
└── package.json
```

---

## Components

### Core Components

**Search & Navigation:**
- `SearchBar` (`src/components/SearchBar.tsx`) - Autocomplete search with keyboard navigation
- `Footer` (`src/components/Footer.tsx`) - Application footer

**School Display:**
- `SchoolCard` (`src/components/SchoolCard.tsx`) - School summary card with add-to-compare button
- `SchoolDetailView` (`src/components/SchoolDetailView.tsx`) - Complete school information display
- `SchoolCount` (`src/components/SchoolCount.tsx`) - Total school count indicator

**Comparison:**
- `ComparisonBasket` (`src/components/ComparisonBasket.tsx`) - Persistent floating basket for selected schools
- `ComparisonView` (`src/components/ComparisonView.tsx`) - Side-by-side school comparison table

**Leaderboards:**
- `TopScoresFilters` (`src/components/TopScoresFilters.tsx`) - Assessment/level filter tabs
- `TopScoresTable` (`src/components/TopScoresTable.tsx`) - Ranked school listing

**Data Visualization:**
- `TrendDisplay` (`src/components/TrendDisplay.tsx`) - Trend indicator with color coding
- `TrendTable` (`src/components/TrendTable.tsx`) - Multi-metric trend comparison
- `HistoricalDataTable` (`src/components/HistoricalDataTable.tsx`) - Yearly data charts

**shadcn/ui Components** (`src/components/ui/`)
- `button`, `card`, `table`, `tabs`, `badge`, `dialog`, `toast`, `input`, `skeleton`, `alert`, `progress`, `tooltip`, `command`

### Component Patterns

All components follow these patterns:
- TypeScript for type safety
- ABOUTME comments at file top
- TanStack Query for API calls (where applicable)
- Proper loading/error/success state handling
- Unit tests with React Testing Library
- E2E tests with Playwright (for critical user flows)

---

## Routing Structure

**Routes:**
- `/` - Home page with search bar and introduction
- `/search` - Search results with school cards
- `/school/:rcdts` - School detail page with all metrics, trends, and historical data
- `/compare` - Multi-school comparison table
- `/top-scores` - Top 100 leaderboard (ACT/IAR filtered by level)
- `*` - 404 Not Found page

**Layout:**
- Global header with site title and "Top Scores" nav link
- Main content area with max-width container
- Global footer with attribution
- Floating comparison basket (persistent across pages)
- Toast notifications for user feedback

**Router Configuration:**
- React Router v7 with BrowserRouter
- TanStack Query provider wraps entire app
- ComparisonContext for basket state
- React Query DevTools enabled in development

---

## Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
```

## Testing

### Unit Tests

Unit tests use Vitest and React Testing Library:

```tsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### E2E Tests

E2E tests use Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('user can search for schools', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="search"]', 'Elk Grove');
  await expect(page.getByText('Elk Grove High School')).toBeVisible();
});
```

---

## API Integration

### API Client Configuration

**Base URL:** Configured via environment variable `VITE_API_URL` (default: `http://localhost:8000`)

**Client:** `src/lib/api/client.ts`
- axios instance with 10s timeout
- Error interceptor for centralized logging
- Automatic JSON content-type headers

**Types:** `src/lib/api/types.ts`
- TypeScript interfaces matching backend Pydantic models
- **Basic Types:** `School`, `SchoolDetail`, `SearchResponse`, `CompareResponse`
- **Metrics:** `ACTScores`, `Demographics`, `Diversity`, `SchoolMetrics`
- **Trends:** `TrendWindow`, `TrendMetrics`
- **Historical:** `HistoricalYearlyData`, `HistoricalMetrics`
- **Leaderboards:** `TopScoreEntry`, `TopScoresResponse`, `Assessment`, `SchoolLevel`

### TanStack Query Hooks

**Available in `src/lib/api/queries.ts`:**

#### 1. useSearch - Search Schools

```tsx
import { useSearch } from '@/lib/api/queries';

function SearchComponent() {
  const { data, isLoading, isError } = useSearch('Elk Grove', 10);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading schools</div>;

  return (
    <div>
      <p>{data?.total} schools found</p>
      {data?.results.map(school => (
        <div key={school.id}>{school.school_name}</div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `query: string` - Search query (must be non-empty)
- `limit: number` - Max results (default: 10)

**Returns:** `SearchResponse` with `results` array and `total` count

**Caching:** 5 minutes stale time

---

#### 2. useSchoolDetail - Get School Details

```tsx
import { useSchoolDetail } from '@/lib/api/queries';

function SchoolDetailComponent({ rcdts }: { rcdts: string }) {
  const { data: school, isLoading, isError } = useSchoolDetail(rcdts);

  if (isLoading) return <div>Loading school details...</div>;
  if (isError) return <div>School not found</div>;

  return (
    <div>
      <h1>{school.school_name}</h1>
      <p>City: {school.city}</p>
      <p>Enrollment: {school.metrics.enrollment}</p>
      <p>ACT Average: {school.metrics.act.overall_avg}</p>
    </div>
  );
}
```

**Parameters:**
- `rcdts: string` - School RCDTS identifier (e.g., "05-016-2140-17-0002")

**Returns:** `SchoolDetail` with full school information and metrics

**Caching:** 10 minutes stale time

---

#### 3. useCompare - Compare Multiple Schools

```tsx
import { useCompare } from '@/lib/api/queries';

function ComparisonComponent({ rcdtsList }: { rcdtsList: string[] }) {
  const { data, isLoading, isError } = useCompare(rcdtsList);

  if (isLoading) return <div>Loading comparison...</div>;
  if (isError) return <div>Error loading schools</div>;

  return (
    <table>
      <thead>
        <tr>
          {data?.schools.map(school => (
            <th key={school.rcdts}>{school.school_name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {data?.schools.map(school => (
            <td key={school.rcdts}>{school.metrics.enrollment}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
```

**Parameters:**
- `rcdtsList: string[]` - Array of 2-5 RCDTS codes

**Returns:** `CompareResponse` with `schools` array

**Caching:** 10 minutes stale time

**Validation:** Query only enabled when 2-5 schools provided

---

#### 4. useTopScores - Top Scores Leaderboard

Note: This hook is not yet exported from `queries.ts`. Use the `getTopScores` function directly with `useQuery`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { getTopScores, topScoresQueryKey } from '@/lib/api/queries';

function TopScoresComponent() {
  const { data, isLoading } = useQuery({
    queryKey: topScoresQueryKey('act', 'high', 100),
    queryFn: () => getTopScores({ assessment: 'act', level: 'high', limit: 100 }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.results.map((entry, idx) => (
        <div key={entry.rcdts}>
          #{entry.rank} - {entry.school_name} - {entry.score}
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `assessment: 'act' | 'iar'` - Assessment type
- `level: 'high' | 'middle' | 'elementary'` - School level
- `limit: number` - Max results (default: 100, max: 100)

**Returns:** `TopScoresResponse` with ranked `results` array

**Caching:** Managed by TanStack Query

---

### Query Key Factories

For manual cache invalidation or prefetching:

```tsx
import {
  searchQueryKey,
  schoolDetailQueryKey,
  compareQueryKey,
  topScoresQueryKey
} from '@/lib/api/queries';

// Generate query keys
const key1 = searchQueryKey('query', 10);           // ['search', 'query', 10]
const key2 = schoolDetailQueryKey('rcdts');         // ['school', 'rcdts']
const key3 = compareQueryKey(['r1', 'r2']);         // ['compare', 'r1,r2']
const key4 = topScoresQueryKey('act', 'high', 100); // ['top-scores', 'act', 'high', 100]

// Invalidate cache
queryClient.invalidateQueries({ queryKey: searchQueryKey('elk', 10) });
```

---

## Environment Configuration

### Environment Variables

**File:** `.env.local` (gitignored, copy from `.env.example`)

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000
```

**Access in code:**
```tsx
const apiUrl = import.meta.env.VITE_API_URL;
```

**Notes:**
- Environment variables must be prefixed with `VITE_` to be exposed to the frontend
- Changes to `.env.local` require dev server restart
- Never commit `.env.local` (contains local/sensitive config)
- Always update `.env.example` when adding new variables

---

## Development Workflow

1. Start backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Write tests first (TDD)
4. Run tests: `npm run test`
5. Commit frequently

## Troubleshooting

### Backend Connection Issues

- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env.local`
- Verify CORS is configured in backend

### Test Failures

- Clear Vitest cache: `npx vitest --clearCache`
- Update Playwright browsers: `npx playwright install`

## Architecture Notes

**State Management:**
- Server state: TanStack Query (caching, background refetch)
- Comparison basket: React Context (`ComparisonContext`)
- URL state: React Router (search params, route params)

**Data Flow:**
1. User interaction triggers query hook
2. TanStack Query checks cache
3. Cache miss → API client fetches from backend
4. Response validated against TypeScript types
5. Component re-renders with data

**Key Patterns:**
- Optimistic updates for comparison basket
- Skeleton loaders during data fetch
- Toast notifications for user feedback
- Null-safe rendering for suppressed data
- Color-coded trend indicators (green/red/gray)
