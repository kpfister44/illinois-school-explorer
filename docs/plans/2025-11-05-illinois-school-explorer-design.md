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
