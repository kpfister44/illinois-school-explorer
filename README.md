# Illinois School Explorer

A full-stack web application for searching and comparing Illinois K-12 schools using official 2025 Report Card data from the Illinois State Board of Education.

**Live Data:** 3,827 schools with enrollment, test scores, demographics, diversity, trends, and 7 years of historical data (2019-2025).

---

## Quick Start

**Documentation:**
- 📖 **[Project Overview](PROJECT_OVERVIEW.md)** - High-level context for new sessions
- 🗄️ **[Backend README](backend/README.md)** - API setup and development
- 🎨 **[Frontend README](frontend/README.md)** - UI components and integration

**Running the App:**

```bash
# Backend (terminal 1)
cd backend
uv sync --all-extras
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
uv run uvicorn app.main:app --reload

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

---

## Features

✅ **Search & Discovery**
- Full-text search across 3,827 Illinois schools
- Search by school name, city, or district
- Autocomplete with keyboard navigation

✅ **School Details**
- Complete metrics: enrollment, ACT/IAR scores, demographics, diversity
- Historical data visualization (2019-2025)
- Trend analysis (1, 3, and 5-year windows)

✅ **Comparison**
- Side-by-side comparison of 2-5 schools
- Persistent comparison basket across pages
- Multi-metric comparison tables

✅ **Leaderboards**
- Top 100 schools by ACT composite or IAR proficiency
- Filter by school level (elementary, middle, high)
- Ranked with tie-breaking

---

## Tech Stack

**Backend:**
- **FastAPI** - REST API with auto-generated docs
- **SQLite + FTS5** - Database with full-text search
- **SQLAlchemy 2.0** - ORM with modern query syntax
- **Pydantic** - Request/response validation
- **pytest** - Testing framework (13 test files)

**Frontend:**
- **React 18 + TypeScript** - UI library with type safety
- **Vite 5** - Build tool and dev server
- **TanStack Query** - Server state management
- **shadcn/ui + Tailwind CSS** - Component library and styling
- **React Router v7** - Client-side routing
- **Vitest + Playwright** - Unit and E2E testing (23 unit, 6 E2E)

---

## Project Structure

```
illinois-school-explorer/
├── backend/                    # FastAPI REST API
│   ├── app/
│   │   ├── api/               # Endpoint implementations
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Data import scripts
│   │   ├── database.py        # SQLAlchemy models
│   │   ├── models.py          # Pydantic schemas
│   │   └── main.py            # FastAPI app
│   ├── docs/
│   │   ├── API_ENDPOINTS.md   # Complete API reference
│   │   └── DATABASE_SCHEMA.md # Schema documentation
│   ├── tests/                 # 13 test files
│   └── README.md              # Backend setup & development
├── frontend/                   # React + TypeScript UI
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── routes/            # Page components
│   │   ├── lib/api/           # API client & TanStack Query hooks
│   │   └── App.tsx            # Root component
│   ├── tests/e2e/             # Playwright E2E tests
│   └── README.md              # Frontend setup & development
├── data/
│   ├── 2025-Report-Card-Public-Data-Set.xlsx
│   └── historical-report-cards/  # Historical data (2019-2024)
├── PROJECT_OVERVIEW.md         # High-level app overview
├── CLAUDE.md                   # Development guidelines
└── README.md                   # This file
```

---

## Key Concepts

**RCDTS Identifiers:** Every Illinois school has a unique RCDTS code (e.g., `05-016-2140-17-0002`) used throughout the app.

**School Levels:** Normalized categories for filtering - `elementary`, `middle`, `high`, `other`.

**Suppressed Data:** Metrics with `null` indicate privacy-protected data (student count < 10) or not applicable for that school type.

**Historical Trends:** Multi-year percentage changes calculated from historical Report Card data (2019-2025).

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for complete details.

---

## API Endpoints

**Base URL:** http://localhost:8000
**Interactive Docs:** http://localhost:8000/docs

| Endpoint | Description |
|----------|-------------|
| `GET /api/search` | Search schools by name, city, or district |
| `GET /api/schools/{rcdts}` | Get complete school details |
| `GET /api/schools/compare` | Compare 2-5 schools side-by-side |
| `GET /api/top-scores` | Ranked leaderboard by ACT or IAR |

See [backend/docs/API_ENDPOINTS.md](backend/docs/API_ENDPOINTS.md) for complete API documentation.

---

## Data Sources

**Primary Dataset:**
- **File:** `2025-Report-Card-Public-Data-Set.xlsx` (39MB, 681 columns)
- **Records:** 3,827 Illinois schools (filtered to `Level == 'School'`)
- **Source:** Illinois State Board of Education

**Historical Data:**
- Excel files (2019-2024): Demographics, enrollment, diversity
- TXT assessment files (2015-2017): ACT scores
- Location: `data/historical-report-cards/`

**Import Process:**
```bash
cd backend
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
```

---

## Testing

**Backend (pytest):**
```bash
cd backend
uv run pytest                    # All tests
uv run pytest -m "not slow"      # Fast tests only
uv run pytest --cov=app          # With coverage
```

**Frontend (Vitest + Playwright):**
```bash
cd frontend
npm run test:run                 # Unit tests
npm run test:e2e                 # E2E tests
```

**Coverage:**
- Backend: >90% overall, >95% API modules
- Frontend: 23 unit test files, 6 E2E test files

---

## Development Workflow

**Test-Driven Development (TDD):**
1. Write failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor while keeping tests green (Refactor)

**Git Workflow:**
- Commit frequently throughout development
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, etc.
- Never skip pre-commit hooks

See [CLAUDE.md](CLAUDE.md) for complete development guidelines.

---

## Architecture

**Backend (FastAPI):**
- REST API with Pydantic validation
- SQLite database with FTS5 full-text search
- Denormalized schema for performance
- CORS enabled for local development

**Frontend (React):**
- TanStack Query for server state management
- React Context for comparison basket state
- Type-safe API integration matching backend models
- Responsive design with shadcn/ui components

**Communication:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:8000` (uvicorn)
- API responses validated against TypeScript types

---

## Future Enhancements

**Data:**
- Add graduation rates, teacher statistics
- Disceplenary data (suspension, expulsions)
- School ratings and designations

**Features:**
- Advanced filtering and sorting
- Map view with geographic search
- Export comparisons to PDF/CSV
- User accounts and saved comparisons

**Infrastructure:**
- Deploy to production (Vercel + Railway/Render)
- API authentication and rate limiting
- Performance monitoring

---

## License

[Add your license here]

---

**Questions?** See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) or the backend/frontend READMEs for detailed documentation.
