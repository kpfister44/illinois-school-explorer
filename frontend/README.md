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
