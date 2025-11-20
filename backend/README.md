# ABOUTME: Comprehensive backend documentation for API endpoints, setup, and architecture
# ABOUTME: Primary reference for Claude Code sessions working with the backend

# Illinois School Explorer - Backend API

FastAPI REST API for searching and retrieving Illinois school data. Provides endpoints for full-text search, detailed school information, and multi-school comparison.

**Database:** 3,827 Illinois schools from 2025 Report Card dataset
**Search:** SQLite FTS5 full-text search
**Status:** Phase 2 complete, ready for frontend integration

---

## Quick Start

```bash
# Navigate to backend
cd backend

# Install dependencies
uv sync --all-extras

# Import school data (requires historical files for trends)
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx

> **Schema note:** The importer now writes `*_trend_{1,3,5}yr` columns (enrollment, demographics, diversity, ACT). Drop `data/schools.db` or run a migration before re-importing so SQLite picks up the added fields.

# Start development server
uv run uvicorn app.main:app --reload --port 8000

# Access API documentation
open http://localhost:8000/docs
```

---

## Historical Report Card Sources

Historical trend calculations pull from local files under `data/historical-report-cards/`. Place the raw Report Card downloads in that folder so the importer can build per-school time series without hitting external APIs.

| Year | Filename | Path | Metrics available |
| --- | --- | --- | --- |
| 2019 | `2019-Report-Card-Public-Data-Set.xlsx` | `data/historical-report-cards/2019-Report-Card-Public-Data-Set.xlsx` | Enrollment, low-income %, EL %, race/ethnicity %, SAT composite |
| 2020 | `2020-Report-Card-Public-Data-Set.xlsx` | `data/historical-report-cards/2020-Report-Card-Public-Data-Set.xlsx` | Enrollment, low-income %, EL %, race/ethnicity %, SAT composite |
| 2022 | `2022-Report-Card-Public-Data-Set.xlsx` | `data/historical-report-cards/2022-Report-Card-Public-Data-Set.xlsx` | Enrollment, low-income %, EL %, race/ethnicity %, SAT composite |
| 2023 | `23-RC-Pub-Data-Set.xlsx` | `data/historical-report-cards/23-RC-Pub-Data-Set.xlsx` | Enrollment, low-income %, EL %, race/ethnicity %, SAT composite |
| 2024 | `24-RC-Pub-Data-Set.xlsx` | `data/historical-report-cards/24-RC-Pub-Data-Set.xlsx` | Enrollment, low-income %, EL %, race/ethnicity %, SAT composite |
| 2015 | `rc15-assessment.txt` | `data/historical-report-cards/rc15-assessment.txt` | ACT composite (ELA, Math, Science, Overall) |
| 2016 | `rc16_assessment.txt` | `data/historical-report-cards/rc16_assessment.txt` | ACT composite (ELA, Math, Science, Overall) |
| 2017 | `rc17_assessment.txt` | `data/historical-report-cards/rc17_assessment.txt` | ACT composite (ELA, Math, Science, Overall) |

*Notes*
- Excel files share the same schema as the current 2025 dataset, so importer field mappings apply directly.
- TXT assessment files are pipe-delimited exports that only carry ACT scores; they do not include demographics.
- Add more years to this folder following the same naming pattern to extend the trend range.
- See `docs/trend-data-workflow.md` for importer instructions and verification steps.

---

## API Endpoints

**For complete API documentation, see [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md)**

### Base URL
- **Development:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs` (Swagger UI)

### Quick Reference

| Endpoint | Method | Description | Details |
|----------|--------|-------------|---------|
| `/health` | GET | Health check | [→](docs/API_ENDPOINTS.md#health-check) |
| `/api/search` | GET | Search schools by name, city, or district | [→](docs/API_ENDPOINTS.md#search-schools) |
| `/api/schools/{rcdts}` | GET | Get complete school information | [→](docs/API_ENDPOINTS.md#get-school-detail) |
| `/api/schools/compare` | GET | Compare 2-5 schools side-by-side | [→](docs/API_ENDPOINTS.md#compare-schools) |
| `/api/top-scores` | GET | Ranked list of top schools by assessment | [→](docs/API_ENDPOINTS.md#get-top-scores) |

### Common Examples

#### Search Schools

```http
GET /api/search?q=elk+grove&limit=5
```

Quick search with FTS5 full-text indexing. See [full documentation](docs/API_ENDPOINTS.md#search-schools).

#### Get School Detail

```http
GET /api/schools/05-016-2140-17-0002
```

Returns complete school data including metrics, trends, and historical data. See [full documentation](docs/API_ENDPOINTS.md#get-school-detail).

#### Compare Schools

```http
GET /api/schools/compare?rcdts=05-016-2140-17-0001,05-016-2140-17-0002
```

Side-by-side comparison of 2-5 schools. See [full documentation](docs/API_ENDPOINTS.md#compare-schools).

#### Top Scores Leaderboard

```http
GET /api/top-scores?assessment=act&level=high&limit=100
```

Ranked list of top schools by ACT or IAR. See [full documentation](docs/API_ENDPOINTS.md#get-top-scores)

---

## Data Models

**For complete database schema documentation, see [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)**

### School (Database Model)

**File:** `app/database.py`

```python
class School(Base):
    __tablename__ = "schools"

    # Primary Info
    id: int
    rcdts: str              # State school ID (unique)
    school_name: str
    city: str
    district: str
    county: str
    school_type: str        # "Elementary School", "High School", etc.
    level: str              # Normalized level: "elementary", "middle", "high", "other"
    grades_served: str      # "9-12", "K-8", etc.

    # Core Metrics
    student_enrollment: int
    el_percentage: float    # English Learner %
    low_income_percentage: float

    # ACT Scores
    act_ela_avg: float
    act_math_avg: float
    act_science_avg: float

    # IAR Proficiency Rates
    iar_ela_proficiency_pct: float
    iar_math_proficiency_pct: float
    iar_overall_proficiency_pct: float

    # Diversity Percentages
    pct_white: float
    pct_black: float
    pct_hispanic: float
    pct_asian: float
    pct_pacific_islander: float
    pct_native_american: float
    pct_two_or_more: float
    pct_mena: float         # Middle Eastern/North African

    # Trend Metrics (1/3/5/10/15 year deltas)
    enrollment_trend_1yr: float
    enrollment_trend_3yr: float
    enrollment_trend_5yr: float
    enrollment_trend_10yr: float
    enrollment_trend_15yr: float
    low_income_trend_1yr: float
    low_income_trend_3yr: float
    low_income_trend_5yr: float
    low_income_trend_10yr: float
    low_income_trend_15yr: float
    el_trend_1yr: float
    el_trend_3yr: float
    el_trend_5yr: float
    el_trend_10yr: float
    el_trend_15yr: float
    white_trend_1yr: float
    white_trend_3yr: float
    white_trend_5yr: float
    white_trend_10yr: float
    white_trend_15yr: float
    black_trend_1yr: float
    black_trend_3yr: float
    black_trend_5yr: float
    black_trend_10yr: float
    black_trend_15yr: float
    hispanic_trend_1yr: float
    hispanic_trend_3yr: float
    hispanic_trend_5yr: float
    hispanic_trend_10yr: float
    hispanic_trend_15yr: float
    asian_trend_1yr: float
    asian_trend_3yr: float
    asian_trend_5yr: float
    asian_trend_10yr: float
    asian_trend_15yr: float
    pacific_islander_trend_1yr: float
    pacific_islander_trend_3yr: float
    pacific_islander_trend_5yr: float
    pacific_islander_trend_10yr: float
    pacific_islander_trend_15yr: float
    native_american_trend_1yr: float
    native_american_trend_3yr: float
    native_american_trend_5yr: float
    native_american_trend_10yr: float
    native_american_trend_15yr: float
    two_or_more_trend_1yr: float
    two_or_more_trend_3yr: float
    two_or_more_trend_5yr: float
    two_or_more_trend_10yr: float
    two_or_more_trend_15yr: float
    mena_trend_1yr: float
    mena_trend_3yr: float
    mena_trend_5yr: float
    mena_trend_10yr: float
    mena_trend_15yr: float
    act_trend_1yr: float
    act_trend_3yr: float
    act_trend_5yr: float
    act_trend_10yr: float
    act_trend_15yr: float

    # Historical Yearly Data (2019-2025)
    # Enrollment by year
    enrollment_hist_2025: int
    enrollment_hist_2024: int
    enrollment_hist_2023: int
    enrollment_hist_2022: int
    enrollment_hist_2021: int
    enrollment_hist_2020: int
    enrollment_hist_2019: int

    # ACT composite by year
    act_hist_2025: float
    act_hist_2024: float
    act_hist_2023: float
    act_hist_2022: float
    act_hist_2021: float
    act_hist_2020: float
    act_hist_2019: float

    # ACT ELA by year
    act_ela_hist_2025: float
    act_ela_hist_2024: float
    act_ela_hist_2023: float
    act_ela_hist_2022: float
    act_ela_hist_2021: float
    act_ela_hist_2020: float
    act_ela_hist_2019: float

    # ACT Math by year
    act_math_hist_2025: float
    act_math_hist_2024: float
    act_math_hist_2023: float
    act_math_hist_2022: float
    act_math_hist_2021: float
    act_math_hist_2020: float
    act_math_hist_2019: float

    # ACT Science by year
    act_science_hist_2025: float
    act_science_hist_2024: float
    act_science_hist_2023: float
    act_science_hist_2022: float
    act_science_hist_2021: float
    act_science_hist_2020: float
    act_science_hist_2019: float

    # English Learners by year
    el_hist_2025: float
    el_hist_2024: float
    el_hist_2023: float
    el_hist_2022: float
    el_hist_2021: float
    el_hist_2020: float
    el_hist_2019: float

    # Low Income by year
    low_income_hist_2025: float
    low_income_hist_2024: float
    low_income_hist_2023: float
    low_income_hist_2022: float
    low_income_hist_2021: float
    low_income_hist_2020: float
    low_income_hist_2019: float

    # Diversity percentages by year (White, Black, Hispanic, Asian, Pacific Islander, Native American, Two or More, MENA)
    # Each diversity category has *_hist_2025 through *_hist_2019
    # (119 total historical columns across all metrics)

    created_at: datetime
```

**Note:** Historical yearly data columns exist for all diversity categories (white, black, hispanic, asian, pacific_islander, native_american, two_or_more, mena) following the same pattern as shown above for enrollment and ACT scores.

**Full Schema:** See [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) for complete column listing, data types, constraints, indexes, and relationships.

### Pydantic Response Models

**File:** `app/models.py`

All API responses use Pydantic models for validation and serialization:

**Search & Basic Info:**
- `SchoolSearchResult`: Search endpoint results (basic info only)
- `SearchResponse`: Wrapper for search results + total count
- `CompareResponse`: Wrapper for array of school details

**School Details:**
- `SchoolDetail`: Full school information with nested metrics
- `SchoolMetrics`: Container for all metric categories

**Current Metrics:**
- `ACTScores`: ACT scores with computed `overall_avg` property
- `Demographics`: EL and low-income percentages
- `Diversity`: Racial/ethnic diversity breakdown

**Trend Data:**
- `TrendWindow`: Contains 1/3/5/10/15 year trend deltas for a single metric
- `TrendMetrics`: Collection of trend windows for all metrics (enrollment, demographics, diversity, ACT)

**Historical Data:**
- `HistoricalYearlyData`: Yearly values 2019-2025 for a single metric
- `HistoricalMetrics`: Historical yearly data for all metrics

**Top Scores:**
- `TopScoreEntry`: Single ranked school entry with rank, score, and basic info
- `TopScoresResponse`: Wrapper for top scores results array

---

## Database

### Connection

**File:** `app/database.py`

```python
# Database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/schools.db"

# Get database session (dependency injection)
from app.database import get_db

def my_route(db: Session = Depends(get_db)):
    # db is automatically managed
    pass
```

### Full-Text Search

FTS5 virtual table for fast search. See [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md#full-text-search-fts5) for complete details.

```sql
CREATE VIRTUAL TABLE schools_fts USING fts5(
    school_name,
    city,
    district,
    content=schools,
    content_rowid=id
);
```

**Search Function:**
```python
from app.database import search_schools

# Returns list of School objects
results = search_schools(db, query="chicago", limit=10)
```

**Features:**
- Auto-triggered inserts/updates/deletes
- Ranked by relevance
- Query sanitization (strips special characters)
- Limit clamped to 1-50

### Helper Functions

```python
from app.database import get_school_by_rcdts

# Get single school by RCDTS
school = get_school_by_rcdts(db, "05-016-2140-17-0002")
# Returns School object or None
```

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, exception handlers
│   ├── database.py          # SQLAlchemy models, FTS5, DB helpers
│   ├── models.py            # Pydantic response models
│   ├── api/
│   │   ├── __init__.py
│   │   ├── search.py        # GET /api/search
│   │   ├── schools.py       # GET /api/schools/{rcdts}, /compare
│   │   └── top_scores.py    # GET /api/top-scores
│   ├── services/
│   │   ├── __init__.py
│   │   └── top_scores.py    # Top scores business logic
│   └── utils/
│       ├── __init__.py
│       └── import_data.py   # Excel → SQLite import script
├── tests/
│   ├── conftest.py                      # Pytest fixtures (test_db, client)
│   ├── test_database.py                 # Database layer tests
│   ├── test_import_data.py              # Data import tests
│   ├── test_main.py                     # FastAPI app tests
│   ├── test_models.py                   # Pydantic model tests
│   ├── test_search_api.py               # Search endpoint tests
│   ├── test_schools_api.py              # School detail & compare tests
│   ├── test_top_scores_api.py           # Top scores endpoint tests
│   ├── test_top_scores_service.py       # Top scores service tests
│   ├── test_historical_loader.py        # Historical data loading tests
│   ├── test_historical_yearly_data.py   # Historical yearly data tests
│   ├── test_import_historical_yearly_data.py  # Historical import tests
│   └── test_integration.py              # End-to-end integration tests
├── data/
│   ├── schools.db                       # SQLite database (gitignored)
│   └── historical-report-cards/         # Historical Excel/TXT files (gitignored)
├── pyproject.toml           # uv project config
├── pytest.ini               # pytest configuration
└── README.md                # This file
```

---

## Development Workflow

### Starting Development Server

```bash
# Standard mode
uv run uvicorn app.main:app --reload --port 8000

# With auto-reload on code changes
uv run uvicorn app.main:app --reload

# Access interactive docs
open http://localhost:8000/docs
```

### Running Tests

```bash
# All tests (fast + slow)
uv run pytest

# Fast tests only (skip slow integration tests)
uv run pytest -m "not slow"

# Specific test file
uv run pytest tests/test_search_api.py -v

# With coverage report
uv run pytest --cov=app --cov-report=term-missing

# Coverage HTML report (open htmlcov/index.html)
uv run pytest --cov=app --cov-report=html
```

### Database Operations

```bash
# Import fresh data
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx

# Count schools
uv run python -c "from app.database import SessionLocal, School; db = SessionLocal(); print(f'Total schools: {db.query(School).count()}'); db.close()"

# Rebuild FTS5 index (if search seems broken)
uv run python -c "from app.database import engine; from sqlalchemy import text; engine.connect().execute(text(\"INSERT INTO schools_fts(schools_fts) VALUES('rebuild')\"))"

# Test search manually
uv run python -c "from app.database import SessionLocal, search_schools; db = SessionLocal(); results = search_schools(db, 'chicago', 5); print(f'Found {len(results)} schools'); db.close()"
```

---

## CORS Configuration

**File:** `app/main.py`

```python
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**For frontend development:**
- Frontend runs on `http://localhost:5173` or `http://127.0.0.1:5173` (Vite dev server)
- Backend runs on `http://localhost:8000`
- CORS pre-configured for local development with both localhost and 127.0.0.1

---

## Error Handling

All endpoints return consistent error formats. See [`docs/API_ENDPOINTS.md#error-handling`](docs/API_ENDPOINTS.md#common-patterns) for complete error documentation including:
- Validation errors (422)
- Business logic errors (400, 404)
- Server errors (503)
- Endpoint-specific error codes

**Global Exception Handler:**
Database connection errors return `503 Service Unavailable` across all endpoints.

---

## Testing

### Test Fixtures

**File:** `tests/conftest.py`

```python
# In-memory test database (fresh for each test)
def test_db() -> Session:
    # Auto-created SQLite in-memory DB with FTS5

# FastAPI test client with test database
def client(test_db):
    # TestClient for making requests
```

### Test Categories

**Unit Tests:**
- `test_database.py`: Database models, search, FTS5
- `test_models.py`: Pydantic model serialization
- `test_import_data.py`: Data cleaning and import
- `test_historical_loader.py`: Historical data loading logic
- `test_historical_yearly_data.py`: Historical yearly data model tests
- `test_import_historical_yearly_data.py`: Historical data import tests

**API Tests:**
- `test_main.py`: App initialization, CORS, health check
- `test_search_api.py`: Search endpoint, pagination, validation
- `test_schools_api.py`: Detail & compare endpoints, error cases
- `test_top_scores_api.py`: Top scores endpoint, filters, ranking

**Service Tests:**
- `test_top_scores_service.py`: Top scores business logic, ranking algorithms

**Integration Tests:**
- `test_integration.py`: Full pipeline, end-to-end flows (marked `@pytest.mark.slow`)

**Total:** 13 test files with comprehensive coverage

### Coverage Targets

- All API modules: >95%
- Overall: >90%

---

## Common Frontend Integration Tasks

### Making API Requests from Frontend

```typescript
// Search schools
const response = await fetch(
  `http://localhost:8000/api/search?q=${encodeURIComponent(query)}&limit=10`
);
const data = await response.json();
// data.results = SchoolSearchResult[]
// data.total = number

// Get school detail
const response = await fetch(
  `http://localhost:8000/api/schools/${rcdts}`
);
const school = await response.json();
// school = SchoolDetail

// Compare schools
const rcdtsList = ["05-016-2140-17-0001", "05-016-2140-17-0002"];
const response = await fetch(
  `http://localhost:8000/api/schools/compare?rcdts=${rcdtsList.join(",")}`
);
const data = await response.json();
// data.schools = SchoolDetail[]
```

### TypeScript Types (Frontend)

```typescript
interface SchoolSearchResult {
  id: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  school_type: string | null;
}

interface SearchResponse {
  results: SchoolSearchResult[];
  total: number;
}

interface ACTScores {
  ela_avg: number | null;
  math_avg: number | null;
  science_avg: number | null;
  overall_avg: number | null;
}

interface Demographics {
  el_percentage: number | null;
  low_income_percentage: number | null;
}

interface Diversity {
  white: number | null;
  black: number | null;
  hispanic: number | null;
  asian: number | null;
  pacific_islander: number | null;
  native_american: number | null;
  two_or_more: number | null;
  mena: number | null;
}

interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores | null;
  demographics: Demographics;
  diversity: Diversity;
}

interface SchoolDetail {
  id: number;
  rcdts: string;
  school_name: string;
  city: string;
  district: string | null;
  county: string | null;
  school_type: string | null;
  grades_served: string | null;
  metrics: SchoolMetrics;
}

interface CompareResponse {
  schools: SchoolDetail[];
}
```

---

## Troubleshooting

### Search returns no results

```bash
# Rebuild FTS5 index
uv run python -c "from app.database import engine; from sqlalchemy import text; conn = engine.connect(); conn.execute(text(\"INSERT INTO schools_fts(schools_fts) VALUES('rebuild')\")).close(); conn.close()"
```

### Database connection errors

- Ensure `data/schools.db` exists
- Re-run import: `uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx`

### CORS errors in frontend

- Verify frontend is running on `http://localhost:5173`
- Check `app/main.py` CORS origins
- Backend must be running on `http://localhost:8000`

### Tests failing

```bash
# Clear pytest cache
rm -rf .pytest_cache

# Run with verbose output
uv run pytest -vv

# Run single failing test
uv run pytest tests/test_search_api.py::test_name -vv
```

---

## Tech Stack Details

- **Python:** 3.11+ (required for modern type hints)
- **FastAPI:** 0.104+ (ASGI framework, auto-generated docs)
- **SQLAlchemy:** 2.0 (ORM with modern query syntax)
- **SQLite3:** Built-in (no external database required)
- **FTS5:** Full-text search extension (built into SQLite 3.9+)
- **Pydantic:** 2.0+ (data validation, serialization)
- **uvicorn:** ASGI server (development & production)
- **pytest:** Testing framework
- **uv:** Fast Python package manager

---

## Data Source

**File:** `2025-Report-Card-Public-Data-Set.xlsx` (39MB, 681 columns)

**Sheets Used:**
- `General`: School demographics, enrollment, diversity
- `ACT`: ACT score averages for Grade 11

**Records:** 3,827 schools (filtered to `Level == 'School'`)

**Suppressed Data:** Asterisks (`*`) in Excel → `NULL` in database

---

## Next Steps (Phase 3)

Frontend integration:
1. React app with TypeScript
2. TanStack Query for API calls
3. shadcn/ui components
4. Search interface
5. School detail views
6. Comparison table

Backend is **complete and ready** for frontend development.
