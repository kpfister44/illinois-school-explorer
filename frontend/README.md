# ABOUTME: Comprehensive frontend documentation for React components, routing, and API integration
# ABOUTME: Primary reference for Claude Code sessions working with the frontend

# Illinois School Explorer - Frontend

React + TypeScript frontend for the Illinois School Explorer application.

**Tech:** React 18, TypeScript 5, Vite 5, shadcn/ui, Tailwind CSS 3
**Testing:** 16 unit tests, 4 E2E tests (Vitest + Playwright)
**Status:** Phase 3 complete, ready for Phase 4 (Core Components)

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

## Current Implementation Status

**Phase 3 Complete:**
- ✅ React + Vite + TypeScript project initialized
- ✅ shadcn/ui + Tailwind CSS 3 configured
- ✅ Vitest unit testing (16 tests passing)
- ✅ Playwright E2E testing (4 tests passing)
- ✅ API client with TanStack Query
- ✅ React Router with route structure
- ✅ SchoolCount component (demonstrates full integration)
- ✅ Environment configuration
- ✅ Comprehensive test coverage

**Phase 4 Next:** SearchBar, SchoolCard, SchoolDetail components

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

### Implemented Components

**SchoolCount** (`src/components/SchoolCount.tsx`)
- Fetches total school count from backend API
- Demonstrates full integration: component → TanStack Query → API client → backend
- Handles loading, error, and success states
- Example usage in `src/routes/Home.tsx`

**shadcn/ui Components** (`src/components/ui/`)
- Button (with variants: default, destructive, outline, ghost)
- More components to be added in Phase 4

### Component Patterns

All components follow these patterns:
- TypeScript for type safety
- ABOUTME comments at file top
- TanStack Query for API calls
- Proper loading/error/success state handling
- Unit tests with React Testing Library
- E2E tests with Playwright (for user flows)

---

## Routing Structure

**Current Routes** (Phase 3):
- `/` - Home page with search instructions
- `/search` - Search results (placeholder)
- `/school/:rcdts` - School detail page (placeholder)
- `/compare` - School comparison (placeholder)
- `*` - 404 Not Found page

**Router Configuration:**
- React Router v7
- BrowserRouter for clean URLs
- TanStack Query provider wraps entire app
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
- `School`, `SchoolDetail`, `SearchResponse`, `CompareResponse`
- All metric types: `ACTScores`, `Demographics`, `Diversity`, `SchoolMetrics`

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

### Query Key Factories

For manual cache invalidation or prefetching:

```tsx
import {
  searchQueryKey,
  schoolDetailQueryKey,
  compareQueryKey
} from '@/lib/api/queries';

// Generate query keys
const key1 = searchQueryKey('query', 10);      // ['search', 'query', 10]
const key2 = schoolDetailQueryKey('rcdts');    // ['school', 'rcdts']
const key3 = compareQueryKey(['r1', 'r2']);    // ['compare', 'r1,r2']

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

## Next Steps

- Phase 4: Core Components (SearchBar, SchoolCard, SchoolDetail)
- Phase 5: Comparison Feature

See `docs/plans/IMPLEMENTATION-ROADMAP.md` for full project plan.
