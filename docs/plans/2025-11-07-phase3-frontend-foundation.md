# Phase 3: Frontend Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up React + TypeScript frontend with testing infrastructure, shadcn/ui, and API client library

**Architecture:** React 18 with Vite for fast development, Vitest for unit tests, Playwright for E2E tests, TanStack Query for server state management, React Router for navigation, shadcn/ui components with Tailwind CSS styling

**Tech Stack:** React 18, TypeScript 5, Vite 5, Vitest, Playwright, shadcn/ui, Tailwind CSS, TanStack Query, axios, React Router

---

## Task 1: Initialize React + Vite + TypeScript Project

**Files:**
- Create: `frontend/` directory and Vite project structure
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/index.html`

**Step 1: Create frontend directory**

```bash
mkdir -p frontend
cd frontend
```

**Step 2: Initialize Vite project with React + TypeScript**

```bash
npm create vite@latest . -- --template react-ts
```

Expected output: Vite scaffolding created

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:5173
Action: Visit http://localhost:5173 - should see Vite + React default page
Action: Ctrl+C to stop server

**Step 5: Clean up default content**

Replace `frontend/src/App.tsx`:

```tsx
// ABOUTME: Main application component
// ABOUTME: Root component that will contain routing and layout

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Illinois School Explorer
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-gray-600">Frontend foundation setup</p>
      </main>
    </div>
  );
}

export default App;
```

**Step 6: Verify app renders**

```bash
npm run dev
```

Expected: http://localhost:5173 shows "Illinois School Explorer" header
Action: Ctrl+C to stop server

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): initialize Vite + React + TypeScript project"
```

---

## Task 2: Configure Vitest for Unit Testing

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Modify: `frontend/package.json` (add test scripts)
- Create: `frontend/src/App.test.tsx` (sample test)

**Step 1: Install Vitest dependencies**

```bash
cd frontend
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 2: Create Vitest configuration**

Create `frontend/vitest.config.ts`:

```typescript
// ABOUTME: Vitest configuration for unit and integration tests
// ABOUTME: Configures jsdom environment and React Testing Library

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

**Step 3: Create test setup file**

Create `frontend/src/test/setup.ts`:

```typescript
// ABOUTME: Test setup file that runs before all tests
// ABOUTME: Imports jest-dom matchers for better assertions

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

**Step 4: Write failing test for App component**

Create `frontend/src/App.test.tsx`:

```tsx
// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with correct header text

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getByText('Illinois School Explorer')).toBeInTheDocument();
  });

  it('renders the foundation setup message', () => {
    render(<App />);
    expect(screen.getByText('Frontend foundation setup')).toBeInTheDocument();
  });
});
```

**Step 5: Run test to verify it passes**

```bash
npm run test
```

If test script doesn't exist, add to `package.json` scripts section:

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run"
}
```

Then run:

```bash
npm run test
```

Expected: 2 tests pass

**Step 6: Commit**

```bash
git add frontend/vitest.config.ts frontend/src/test/ frontend/src/App.test.tsx frontend/package.json
git commit -m "test(frontend): configure Vitest with sample App tests"
```

---

## Task 3: Configure Playwright for E2E Testing

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/e2e/app.spec.ts` (sample E2E test)
- Modify: `frontend/package.json` (add E2E scripts)

**Step 1: Install Playwright**

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

**Step 2: Create Playwright configuration**

Create `frontend/playwright.config.ts`:

```typescript
// ABOUTME: Playwright configuration for end-to-end tests
// ABOUTME: Tests run against local dev server on port 5173

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Write sample E2E test**

Create `frontend/tests/e2e/app.spec.ts`:

```typescript
// ABOUTME: End-to-end test for main application
// ABOUTME: Verifies app loads and displays header correctly

import { test, expect } from '@playwright/test';

test('app displays header and initial content', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Illinois School Explorer' })).toBeVisible();
  await expect(page.getByText('Frontend foundation setup')).toBeVisible();
});
```

**Step 4: Add E2E scripts to package.json**

Add to `package.json` scripts section:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

**Step 5: Run E2E test to verify it passes**

```bash
npm run test:e2e
```

Expected: 1 test passes in chromium

**Step 6: Commit**

```bash
git add frontend/playwright.config.ts frontend/tests/ frontend/package.json
git commit -m "test(frontend): configure Playwright for E2E testing"
```

---

## Task 4: Install and Configure shadcn/ui with Tailwind CSS

**Reference Skill:** Use `shadcn-ui` skill for guidance if needed

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/components/ui/` (shadcn/ui components directory)

**Step 1: Install Tailwind CSS and dependencies**

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Install shadcn/ui dependencies**

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
```

**Step 3: Configure Tailwind CSS**

Replace `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

**Step 4: Update global CSS with Tailwind directives and shadcn/ui variables**

Replace `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 5: Create utils helper for className merging**

Create `frontend/src/lib/utils.ts`:

```typescript
// ABOUTME: Utility functions for className manipulation
// ABOUTME: Combines clsx and tailwind-merge for optimal className handling

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Create components.json for shadcn/ui configuration**

Create `frontend/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Step 7: Configure TypeScript path aliases**

Update `frontend/tsconfig.json` - add to compilerOptions:

```json
{
  "compilerOptions": {
    // ... existing options ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 8: Configure Vite path aliases**

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 9: Install a sample shadcn/ui component (Button)**

```bash
npx shadcn-ui@latest add button
```

Expected: Creates `frontend/src/components/ui/button.tsx`

**Step 10: Write test for Button component**

Create `frontend/src/components/ui/button.test.tsx`:

```tsx
// ABOUTME: Unit tests for shadcn/ui Button component
// ABOUTME: Verifies Button renders and handles click events

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with text content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Step 11: Run tests to verify Button component works**

```bash
npm run test:run
```

Expected: All tests pass (including new Button tests)

**Step 12: Update App.tsx to use Button**

Update `frontend/src/App.tsx`:

```tsx
// ABOUTME: Main application component
// ABOUTME: Root component that will contain routing and layout

import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Illinois School Explorer
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-muted-foreground mb-4">Frontend foundation setup complete</p>
        <Button>Get Started</Button>
      </main>
    </div>
  );
}

export default App;
```

**Step 13: Verify app renders with styled Button**

```bash
npm run dev
```

Expected: http://localhost:5173 shows styled button with shadcn/ui styling
Action: Ctrl+C to stop server

**Step 14: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): configure shadcn/ui with Tailwind CSS"
```

---

## Task 5: Create API Client Library

**Files:**
- Create: `frontend/src/lib/api/client.ts` (axios instance)
- Create: `frontend/src/lib/api/types.ts` (TypeScript types)
- Create: `frontend/src/lib/api/queries.ts` (TanStack Query hooks)
- Create: `frontend/src/lib/api/client.test.ts` (unit tests)

**Step 1: Install API client dependencies**

```bash
cd frontend
npm install axios @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

**Step 2: Create TypeScript types for API responses**

Create `frontend/src/lib/api/types.ts`:

```typescript
// ABOUTME: TypeScript types for backend API responses
// ABOUTME: Matches Pydantic models from FastAPI backend

export interface School {
  id: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  school_type: string | null;
}

export interface SearchResponse {
  results: School[];
  total: number;
}

export interface ACTScores {
  ela_avg: number | null;
  math_avg: number | null;
  science_avg: number | null;
  overall_avg: number | null;
}

export interface Demographics {
  el_percentage: number | null;
  low_income_percentage: number | null;
}

export interface Diversity {
  white: number | null;
  black: number | null;
  hispanic: number | null;
  asian: number | null;
  pacific_islander: number | null;
  native_american: number | null;
  two_or_more: number | null;
  mena: number | null;
}

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores;
  demographics: Demographics;
  diversity: Diversity;
}

export interface SchoolDetail extends School {
  county: string | null;
  grades_served: string | null;
  metrics: SchoolMetrics;
}

export interface CompareResponse {
  schools: SchoolDetail[];
}
```

**Step 3: Write failing test for API client**

Create `frontend/src/lib/api/client.test.ts`:

```typescript
// ABOUTME: Unit tests for API client
// ABOUTME: Tests API base configuration and error handling

import { describe, it, expect } from 'vitest';
import { apiClient } from './client';

describe('API Client', () => {
  it('has correct base URL configured', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8000');
  });

  it('has correct timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it('has JSON content type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
```

**Step 4: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL - "Cannot find module './client'"

**Step 5: Create axios client instance**

Create `frontend/src/lib/api/client.ts`:

```typescript
// ABOUTME: Axios client instance for backend API
// ABOUTME: Configured with base URL and default headers

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

**Step 6: Run test to verify it passes**

```bash
npm run test:run
```

Expected: All tests pass

**Step 7: Write tests for search query hook**

Create `frontend/src/lib/api/queries.test.ts`:

```typescript
// ABOUTME: Unit tests for TanStack Query hooks
// ABOUTME: Tests query key generation for caching

import { describe, it, expect } from 'vitest';
import { searchQueryKey, schoolDetailQueryKey, compareQueryKey } from './queries';

describe('Query Keys', () => {
  it('generates correct search query key', () => {
    const key = searchQueryKey('test query', 10);
    expect(key).toEqual(['search', 'test query', 10]);
  });

  it('generates correct school detail query key', () => {
    const key = schoolDetailQueryKey('05-016-2140-17-0002');
    expect(key).toEqual(['school', '05-016-2140-17-0002']);
  });

  it('generates correct compare query key', () => {
    const key = compareQueryKey(['rcdts1', 'rcdts2']);
    expect(key).toEqual(['compare', 'rcdts1,rcdts2']);
  });
});
```

**Step 8: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL - "Cannot find module './queries'"

**Step 9: Create TanStack Query hooks**

Create `frontend/src/lib/api/queries.ts`:

```typescript
// ABOUTME: TanStack Query hooks for backend API
// ABOUTME: Provides useSearch, useSchoolDetail, and useCompare hooks

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { SearchResponse, SchoolDetail, CompareResponse } from './types';

// Query key factories for consistent caching
export const searchQueryKey = (query: string, limit: number) => ['search', query, limit];
export const schoolDetailQueryKey = (rcdts: string) => ['school', rcdts];
export const compareQueryKey = (rcdtsList: string[]) => ['compare', rcdtsList.join(',')];

// Search schools by name or city
export const useSearch = (query: string, limit: number = 10) => {
  return useQuery({
    queryKey: searchQueryKey(query, limit),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchResponse>('/api/search', {
        params: { q: query, limit },
      });
      return data;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get school details by RCDTS
export const useSchoolDetail = (rcdts: string) => {
  return useQuery({
    queryKey: schoolDetailQueryKey(rcdts),
    queryFn: async () => {
      const { data } = await apiClient.get<SchoolDetail>(`/api/schools/${rcdts}`);
      return data;
    },
    enabled: !!rcdts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Compare multiple schools
export const useCompare = (rcdtsList: string[]) => {
  return useQuery({
    queryKey: compareQueryKey(rcdtsList),
    queryFn: async () => {
      const { data } = await apiClient.get<CompareResponse>('/api/schools/compare', {
        params: { rcdts: rcdtsList.join(',') },
      });
      return data;
    },
    enabled: rcdtsList.length >= 2 && rcdtsList.length <= 5,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

**Step 10: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: All tests pass

**Step 11: Commit**

```bash
git add frontend/src/lib/api/
git commit -m "feat(frontend): create API client with TanStack Query hooks"
```

---

## Task 6: Set Up React Router

**Files:**
- Create: `frontend/src/routes/Home.tsx`
- Create: `frontend/src/routes/SearchResults.tsx`
- Create: `frontend/src/routes/SchoolDetail.tsx`
- Create: `frontend/src/routes/Compare.tsx`
- Create: `frontend/src/routes/NotFound.tsx`
- Modify: `frontend/src/App.tsx` (add router)
- Create: `frontend/src/routes/Home.test.tsx`

**Step 1: Install React Router**

```bash
cd frontend
npm install react-router-dom
```

**Step 2: Write test for Home route**

Create `frontend/src/routes/Home.test.tsx`:

```tsx
// ABOUTME: Unit tests for Home page component
// ABOUTME: Verifies welcome message renders correctly

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders welcome message', () => {
    render(<Home />);
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });

  it('renders search instruction', () => {
    render(<Home />);
    expect(screen.getByText(/enter a school name or city/i)).toBeInTheDocument();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL - "Cannot find module './Home'"

**Step 4: Create Home route component**

Create `frontend/src/routes/Home.tsx`:

```tsx
// ABOUTME: Home page component
// ABOUTME: Landing page with search instructions

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Search for Illinois Schools
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Enter a school name or city to view enrollment, test scores, and demographics.
          Compare multiple schools side-by-side.
        </p>
        <Button size="lg">Get Started</Button>
      </div>
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

```bash
npm run test:run
```

Expected: All tests pass

**Step 6: Create placeholder route components**

Create `frontend/src/routes/SearchResults.tsx`:

```tsx
// ABOUTME: Search results page component
// ABOUTME: Displays list of schools matching search query

export default function SearchResults() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search Results</h2>
      <p className="text-muted-foreground">Results will appear here</p>
    </div>
  );
}
```

Create `frontend/src/routes/SchoolDetail.tsx`:

```tsx
// ABOUTME: School detail page component
// ABOUTME: Displays full information for a single school

export default function SchoolDetail() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">School Details</h2>
      <p className="text-muted-foreground">School information will appear here</p>
    </div>
  );
}
```

Create `frontend/src/routes/Compare.tsx`:

```tsx
// ABOUTME: School comparison page component
// ABOUTME: Displays side-by-side comparison of multiple schools

export default function Compare() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Compare Schools</h2>
      <p className="text-muted-foreground">Comparison table will appear here</p>
    </div>
  );
}
```

Create `frontend/src/routes/NotFound.tsx`:

```tsx
// ABOUTME: 404 Not Found page component
// ABOUTME: Displayed when user navigates to invalid route

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
```

**Step 7: Update App.tsx to use React Router**

Replace `frontend/src/App.tsx`:

```tsx
// ABOUTME: Main application component with routing
// ABOUTME: Sets up React Router and TanStack Query provider

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Home from './routes/Home';
import SearchResults from './routes/SearchResults';
import SchoolDetail from './routes/SchoolDetail';
import Compare from './routes/Compare';
import NotFound from './routes/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
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
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
```

**Step 8: Update App.test.tsx**

Update `frontend/src/App.test.tsx`:

```tsx
// ABOUTME: Unit tests for main App component
// ABOUTME: Verifies app renders with router and navigation

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getByText('Illinois School Explorer')).toBeInTheDocument();
  });

  it('renders home page by default', () => {
    render(<App />);
    expect(screen.getByText(/search for illinois schools/i)).toBeInTheDocument();
  });
});
```

**Step 9: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: All tests pass

**Step 10: Verify app routes work**

```bash
npm run dev
```

Expected:
- http://localhost:5173/ shows Home page
- http://localhost:5173/search shows SearchResults placeholder
- http://localhost:5173/school/test shows SchoolDetail placeholder
- http://localhost:5173/compare shows Compare placeholder
- http://localhost:5173/invalid shows NotFound page

Action: Ctrl+C to stop server

**Step 11: Commit**

```bash
git add frontend/src/routes/ frontend/src/App.tsx frontend/src/App.test.tsx
git commit -m "feat(frontend): set up React Router with route structure"
```

---

## Task 7: Create E2E Test for API Integration

**Files:**
- Create: `frontend/tests/e2e/api-integration.spec.ts`

**Step 1: Write E2E test that verifies backend API connection**

Create `frontend/tests/e2e/api-integration.spec.ts`:

```typescript
// ABOUTME: End-to-end test for API client integration
// ABOUTME: Verifies frontend can successfully fetch from backend API

import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running
    await page.goto('/');
  });

  test('can reach backend health endpoint', async ({ page }) => {
    // Use page.request to directly test API
    const response = await page.request.get('http://localhost:8000/api/search?q=high&limit=1');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('total');
  });

  test('API client configuration is correct', async ({ page }) => {
    await page.goto('/');

    // Check that page loads without errors (API client is properly configured)
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
```

**Step 2: Ensure backend is running**

In a separate terminal:

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

**Step 3: Run E2E test to verify API integration**

```bash
npm run test:e2e
```

Expected: Both tests pass, confirming:
- Backend API is reachable
- Frontend can make requests to backend
- API responses have expected structure

**Step 4: Stop backend server**

In the backend terminal, press Ctrl+C

**Step 5: Commit**

```bash
git add frontend/tests/e2e/api-integration.spec.ts
git commit -m "test(frontend): add E2E test for API integration"
```

---

## Task 8: Create Sample Component with Full Test Coverage

**Files:**
- Create: `frontend/src/components/SchoolCount.tsx`
- Create: `frontend/src/components/SchoolCount.test.tsx`
- Create: `frontend/tests/e2e/school-count.spec.ts`

**Step 1: Write failing unit test for SchoolCount component**

Create `frontend/src/components/SchoolCount.test.tsx`:

```tsx
// ABOUTME: Unit tests for SchoolCount component
// ABOUTME: Verifies component displays loading, error, and data states

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchoolCount from './SchoolCount';
import * as queries from '@/lib/api/queries';

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

describe('SchoolCount', () => {
  it('displays loading state initially', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays school count when data loads', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: { results: [], total: 3827 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/3827 schools/i)).toBeInTheDocument();
  });

  it('displays error message on failure', () => {
    vi.spyOn(queries, 'useSearch').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    } as any);

    render(<SchoolCount />, { wrapper: createWrapper() });
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL - "Cannot find module './SchoolCount'"

**Step 3: Create SchoolCount component**

Create `frontend/src/components/SchoolCount.tsx`:

```tsx
// ABOUTME: Component that displays total count of schools in database
// ABOUTME: Demonstrates API client usage with loading and error states

import { useSearch } from '@/lib/api/queries';

export default function SchoolCount() {
  const { data, isLoading, isError } = useSearch('', 1);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading school count...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load school count</p>;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {data?.total.toLocaleString()} schools available
    </p>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run
```

Expected: All tests pass

**Step 5: Add SchoolCount to Home page**

Update `frontend/src/routes/Home.tsx`:

```tsx
// ABOUTME: Home page component
// ABOUTME: Landing page with search instructions

import { Button } from '@/components/ui/button';
import SchoolCount from '@/components/SchoolCount';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Search for Illinois Schools
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Enter a school name or city to view enrollment, test scores, and demographics.
          Compare multiple schools side-by-side.
        </p>
        <div className="mb-8">
          <SchoolCount />
        </div>
        <Button size="lg">Get Started</Button>
      </div>
    </div>
  );
}
```

**Step 6: Write E2E test for SchoolCount**

Create `frontend/tests/e2e/school-count.spec.ts`:

```typescript
// ABOUTME: End-to-end test for SchoolCount component
// ABOUTME: Verifies component displays correct count from backend

import { test, expect } from '@playwright/test';

test.describe('School Count', () => {
  test('displays school count on home page', async ({ page }) => {
    await page.goto('/');

    // Wait for count to load
    await expect(page.getByText(/schools available/i)).toBeVisible({ timeout: 10000 });

    // Verify count is a reasonable number (should be ~3,827)
    const countText = await page.getByText(/schools available/i).textContent();
    expect(countText).toMatch(/\d+/);
  });
});
```

**Step 7: Start backend server**

In a separate terminal:

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

**Step 8: Run E2E test to verify integration**

```bash
npm run test:e2e
```

Expected: Test passes, confirming:
- Frontend successfully fetches from backend
- School count displays correctly
- Loading and error states work

**Step 9: Verify manually**

```bash
npm run dev
```

Expected: Home page shows "3,827 schools available" (or actual count from database)
Action: Ctrl+C to stop server

**Step 10: Stop backend server**

In the backend terminal, press Ctrl+C

**Step 11: Commit**

```bash
git add frontend/src/components/SchoolCount.tsx frontend/src/components/SchoolCount.test.tsx frontend/src/routes/Home.tsx frontend/tests/e2e/school-count.spec.ts
git commit -m "feat(frontend): add SchoolCount component with API integration"
```

---

## Task 9: Add Environment Configuration

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/.env.local` (gitignored)
- Update: `frontend/.gitignore`

**Step 1: Create environment variable example file**

Create `frontend/.env.example`:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

**Step 2: Create local environment file**

Create `frontend/.env.local`:

```env
# Backend API URL for local development
VITE_API_URL=http://localhost:8000
```

**Step 3: Ensure .env.local is gitignored**

Verify `frontend/.gitignore` contains:

```
# Environment
.env.local
```

If not present, add it.

**Step 4: Update API client to use environment variable**

The `frontend/src/lib/api/client.ts` already uses `import.meta.env.VITE_API_URL` - verify it's correct:

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  // ...
});
```

**Step 5: Commit**

```bash
git add frontend/.env.example frontend/.gitignore
git commit -m "chore(frontend): add environment configuration"
```

---

## Task 10: Create Development README

**Files:**
- Create: `frontend/README.md`

**Step 1: Create comprehensive README**

Create `frontend/README.md`:

```markdown
# Illinois School Explorer - Frontend

React + TypeScript frontend for the Illinois School Explorer application.

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

## API Integration

The frontend connects to the backend API at `http://localhost:8000`.

API client hooks are available in `src/lib/api/queries.ts`:

```tsx
import { useSearch, useSchoolDetail, useCompare } from '@/lib/api/queries';

// Search schools
const { data, isLoading } = useSearch('Elk Grove', 10);

// Get school details
const { data: school } = useSchoolDetail('05-016-2140-17-0002');

// Compare schools
const { data: comparison } = useCompare(['rcdts1', 'rcdts2']);
```

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
```

**Step 2: Commit**

```bash
git add frontend/README.md
git commit -m "docs(frontend): add comprehensive README"
```

---

## Verification Checklist

Before considering Phase 3 complete, verify all deliverables:

### Infrastructure
- [ ] React app runs on `http://localhost:5173`
- [ ] Vite dev server starts without errors
- [ ] TypeScript compilation works without errors

### Testing
- [ ] Vitest runs unit tests successfully
- [ ] All unit tests pass (SchoolCount, Button, routes, API client)
- [ ] Playwright runs E2E tests successfully
- [ ] API integration E2E test passes (requires backend running)

### Styling
- [ ] shadcn/ui Button component renders with correct styling
- [ ] Tailwind CSS classes work correctly
- [ ] App has consistent visual design

### API Client
- [ ] API client configured with correct base URL
- [ ] TanStack Query hooks defined (useSearch, useSchoolDetail, useCompare)
- [ ] SchoolCount component successfully fetches from backend
- [ ] React Query DevTools visible in browser

### Routing
- [ ] Home page (`/`) renders
- [ ] Placeholder routes render (search, school/:rcdts, compare)
- [ ] 404 page renders for invalid routes
- [ ] Header link navigates to home page

### Code Quality
- [ ] All files have ABOUTME comments
- [ ] TypeScript types defined for API responses
- [ ] No console errors in browser
- [ ] Git history shows frequent, atomic commits

### Documentation
- [ ] README.md explains setup and usage
- [ ] Environment variables documented (.env.example)

---

## Success Criteria

Phase 3 is complete when:

1. ✅ Frontend runs on localhost:5173 without errors
2. ✅ All unit tests pass (10+ tests)
3. ✅ E2E infrastructure works (Playwright configured)
4. ✅ shadcn/ui components available and styled correctly
5. ✅ API client successfully fetches from backend (verified with SchoolCount)
6. ✅ React Router handles all defined routes
7. ✅ Test coverage demonstrates TDD approach (tests written first)
8. ✅ Code committed with clear, descriptive messages

**Backend Dependency:** Phase 3 E2E tests require backend running on port 8000. Ensure Phase 2 is complete and backend can be started with `cd backend && uv run uvicorn app.main:app --reload`.

---

## Next Phase

After Phase 3 completion:

- **Phase 4: Core Components** - Build SearchBar, SchoolCard, and SchoolDetail components with full functionality
- See `docs/plans/IMPLEMENTATION-ROADMAP.md` for details

Use `/superpowers:write-plan` to create detailed Phase 4 plan.

---

**Plan Complete!** Ready for execution with TDD workflow.
