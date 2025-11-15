# ABOUTME: High-level overview of the Illinois School Explorer web application
# ABOUTME: Essential context for Claude Code sessions before diving into specific features

# Illinois School Explorer - Project Overview

A full-stack web application for exploring and comparing Illinois K-12 schools using official 2025 Report Card data. Search 3,827 schools, view detailed metrics, compare schools side-by-side, and browse top-performing schools by ACT or IAR scores.

---

## Architecture

**Frontend (React + TypeScript)**
- React 18 with TypeScript 5, built with Vite
- UI: shadcn/ui components + Tailwind CSS
- State: TanStack Query for server state management
- Routing: React Router v7
- Testing: Vitest (unit) + Playwright (E2E)

**Backend (FastAPI + Python)**
- FastAPI REST API with Pydantic validation
- Database: SQLite with FTS5 full-text search
- Data: 3,827 Illinois schools from 2025 Report Card dataset
- ORM: SQLAlchemy 2.0
- Testing: pytest with in-memory test database

**Communication:**
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:8000` (uvicorn)
- CORS pre-configured for local development
- API contract enforced via TypeScript types matching Pydantic models

See [`frontend/README.md`](frontend/README.md) and [`backend/README.md`](backend/README.md) for detailed setup, API documentation, and component patterns.

---

## Key Concepts

### RCDTS Identifiers

Every Illinois school has a unique **RCDTS code** (Regional County District Type School):
- Format: `05-016-2140-17-0002` (hyphen-separated)
- Used as the primary identifier throughout the app
- Required for school detail pages and comparisons
- Stable across years (does not change)

### School Levels (Normalized)

Schools are categorized into normalized levels for leaderboards and filtering:
- **`elementary`**: Elementary/Primary schools
- **`middle`**: Middle/Junior High schools
- **`high`**: High schools
- **`other`**: Alternative/Special education schools

The `level` field is computed during import from the `school_type` field. See `backend/app/utils/import_data.py` for normalization logic.

### Suppressed Data (Nulls)

Illinois suppresses certain metrics when student counts are too low (privacy protection):
- Source data: Asterisks (`*`) in Excel files
- Database: `NULL` values
- API responses: `null` in JSON
- Frontend: Handle nulls gracefully (show "N/A" or hide metrics)

**Common null scenarios:**
- ACT scores for elementary schools (no ACT testing)
- Demographics with <10 students in a category
- Small schools with suppressed diversity percentages

### Historical Trend Data

The app displays multi-year trends for enrollment, demographics, and test scores:
- **Data source:** Historical Report Card files in `data/historical-report-cards/`
- **Years available:** 2015-2024 (varies by metric)
- **Trend columns:** `*_trend_1yr`, `*_trend_3yr`, `*_trend_5yr` in database
- **Calculation:** Year-over-year percentage change
- **Import process:** See `docs/trend-data-workflow.md`

Trends are computed during data import and stored as pre-calculated values. Not all schools have trends (e.g., new schools, data suppression).

---

## Core Features

### 1. School Search
- Full-text search across school names, cities, and districts
- Powered by SQLite FTS5 for fast, ranked results
- Results show: school name, city, district, type
- Click through to detailed school pages

### 2. School Detail Pages
- Complete school information and metrics:
  - Basic info: name, city, district, county, grades served
  - Enrollment with historical trends
  - ACT scores (ELA, Math, Science, Overall composite)
  - Demographics (English Learner %, Low Income %)
  - Diversity breakdown (8 racial/ethnic categories)
  - Historical trends (1-year, 3-year, 5-year)

### 3. School Comparison
- Compare 2-5 schools side-by-side
- All metrics displayed in tabular format
- Supports cross-district comparisons
- Handles missing data gracefully (nulls shown as N/A)

### 4. Top Scores Leaderboard
- Browse top 100 Illinois schools by:
  - **ACT composite** (high schools only)
  - **IAR proficiency** (elementary/middle schools)
- Filter by school level (elementary, middle, high)
- Shows rank, score, enrollment, and location
- Click through to detailed school pages

---

## Data Model

### School Information
```typescript
{
  rcdts: string              // Unique identifier: "05-016-2140-17-0002"
  school_name: string        // "Elk Grove High School"
  city: string               // "Elk Grove Village"
  district: string | null    // "Township HSD 214"
  county: string | null      // "Cook"
  school_type: string | null // "High School"
  level: string              // "high" (normalized)
  grades_served: string | null // "9-12"
}
```

### Metrics
```typescript
{
  enrollment: number | null

  act: {                     // null for elementary schools
    ela_avg: number | null
    math_avg: number | null
    science_avg: number | null
    overall_avg: number | null  // Computed: (ela + math) / 2
  } | null

  demographics: {
    el_percentage: number | null      // English Learner %
    low_income_percentage: number | null
  }

  diversity: {
    white: number | null
    black: number | null
    hispanic: number | null
    asian: number | null
    pacific_islander: number | null
    native_american: number | null
    two_or_more: number | null
    mena: number | null  // Middle Eastern/North African
  }
}
```

**Important notes:**
- All percentages are 0-100 (not 0-1 decimals)
- `act.overall_avg` is computed from ELA and Math (not Science)
- `null` values indicate suppressed data
- Elementary schools have `act: null` (no ACT testing)

See [`backend/README.md`](backend/README.md) for complete API documentation and [`frontend/README.md`](frontend/README.md) for TypeScript types.

---

## API Endpoints (Quick Reference)

- `GET /api/search?q={query}&limit={limit}` - Search schools
- `GET /api/schools/{rcdts}` - Get school details
- `GET /api/schools/compare?rcdts={rcdts1},{rcdts2},...` - Compare 2-5 schools
- `GET /api/top-scores?assessment={act|iar}&level={high|middle|elementary}&limit={1-100}` - Top scores leaderboard
- `GET /health` - Health check

Full API documentation at `http://localhost:8000/docs` (Swagger UI)

See [`backend/README.md`](backend/README.md) for detailed endpoint documentation, request/response examples, and error handling.

---

## Frontend Patterns

### API Integration
- **TanStack Query hooks** for all API calls (see `frontend/src/lib/api/queries.ts`)
  - `useSearch(query, limit)`
  - `useSchoolDetail(rcdts)`
  - `useCompare(rcdtsList)`
  - `useTopScores(assessment, level, limit)`
- Automatic caching, loading states, and error handling
- Query keys for cache invalidation: `searchQueryKey()`, `schoolDetailQueryKey()`, etc.

### Component Patterns
- TypeScript for type safety
- ABOUTME comments at file top
- Proper loading/error/success state handling
- Unit tests (Vitest + React Testing Library)
- E2E tests (Playwright) for critical user flows

### Styling
- Tailwind CSS utility classes
- shadcn/ui component library
- Consistent design system with variants

See [`frontend/README.md`](frontend/README.md) for detailed component documentation, testing patterns, and adding new shadcn/ui components.

---

## Development Setup

### Backend
```bash
cd backend
uv sync --all-extras
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for complete setup instructions, testing commands, and troubleshooting.

---

## Testing

### Backend (pytest)
- **Fast tests:** `uv run pytest -m "not slow"`
- **All tests:** `uv run pytest`
- **Coverage:** `uv run pytest --cov=app --cov-report=term-missing`
- In-memory SQLite database for isolated tests

### Frontend (Vitest + Playwright)
- **Unit tests:** `npm run test:run`
- **E2E tests:** `npm run test:e2e`
- **Watch mode:** `npm run test`
- 16 unit tests, 5 E2E tests covering critical user flows

---

## Important Conventions

### Git Commits
- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
- Max 50 chars, imperative mood, no period
- Example: `feat(search): add school type filter`

### Code Style
- **ABOUTME comments:** Every file starts with 2-line comment explaining purpose
- **Null handling:** Always check for null before displaying metrics
- **RCDTS validation:** Use RCDTS as the source of truth for school identity
- **Type safety:** Leverage TypeScript types matching Pydantic models

### Package Management
- **Backend:** Use `uv run` for all Python commands (NEVER use `pip` or `python` directly)
- **Frontend:** Use `npm` for all Node commands

See [`CLAUDE.md`](CLAUDE.md) for complete development guidelines, naming conventions, and testing requirements.

---

## Common Tasks

### Adding a new API endpoint
1. Define Pydantic response model in `backend/app/models.py`
2. Implement endpoint in `backend/app/api/`
3. Add database helper if needed in `backend/app/database.py`
4. Write tests in `backend/tests/`
5. Update TypeScript types in `frontend/src/lib/api/types.ts`
6. Create TanStack Query hook in `frontend/src/lib/api/queries.ts`

### Adding a new frontend component
1. Create component in `frontend/src/components/` (with ABOUTME comment)
2. Add TypeScript types/props
3. Write unit tests in same directory
4. Add E2E test if it's a critical user flow
5. Import and use in route component

### Importing new data
```bash
cd backend
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
```

**Important:** Drop `data/schools.db` before re-importing if schema changed (trend columns, new fields, etc.)

See [`backend/README.md`](backend/README.md) for database operations and troubleshooting.

---

## Key Files to Know

### Backend
- `backend/app/main.py` - FastAPI app, CORS, exception handlers
- `backend/app/database.py` - SQLAlchemy models, FTS5 search, DB helpers
- `backend/app/models.py` - Pydantic response models
- `backend/app/utils/import_data.py` - Excel → SQLite import with trend calculations
- `backend/tests/conftest.py` - Test fixtures (test_db, client)

### Frontend
- `frontend/src/lib/api/client.ts` - Axios API client
- `frontend/src/lib/api/types.ts` - TypeScript types matching backend
- `frontend/src/lib/api/queries.ts` - TanStack Query hooks
- `frontend/src/routes/` - Page components
- `frontend/src/components/ui/` - shadcn/ui components

### Documentation
- `CLAUDE.md` - Development guidelines and rules (READ THIS FIRST)
- `backend/README.md` - Complete backend API reference
- `frontend/README.md` - Complete frontend component reference
- `docs/trend-data-workflow.md` - Historical data import process

---

## Questions? Start Here

1. **Backend/API questions:** See [`backend/README.md`](backend/README.md)
2. **Frontend/React questions:** See [`frontend/README.md`](frontend/README.md)
3. **Development rules:** See [`CLAUDE.md`](CLAUDE.md)
4. **Historical trends:** See `docs/trend-data-workflow.md`
