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

# Import school data
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx

# Start development server
uv run uvicorn app.main:app --reload --port 8000

# Access API documentation
open http://localhost:8000/docs
```

---

## API Endpoints

### Base URL
- **Development:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs` (Swagger UI)

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### 2. Search Schools

```http
GET /api/search?q={query}&limit={limit}
```

**Description:** Full-text search across school names, cities, and districts using SQLite FTS5.

**Query Parameters:**
- `q` (required): Search query string (min length: 1)
- `limit` (optional): Max results (default: 10, max: 50)

**Example Request:**
```bash
curl "http://localhost:8000/api/search?q=elk+grove&limit=5"
```

**Example Response:**
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

**Search Behavior:**
- Case-insensitive
- Searches: school name, city, district
- Results ranked by relevance
- Special characters automatically sanitized
- Returns empty array if no matches

**Error Responses:**
- `422`: Missing or invalid query parameter

---

### 3. Get School Detail

```http
GET /api/schools/{rcdts}
```

**Description:** Retrieve complete school information including all metrics.

**Path Parameters:**
- `rcdts` (required): School RCDTS identifier (e.g., `05-016-2140-17-0002`)

**Example Request:**
```bash
curl "http://localhost:8000/api/schools/05-016-2140-17-0002"
```

**Example Response:**
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

**Metrics Details:**
- `enrollment`: Total student count
- `act.overall_avg`: Computed as `(ela_avg + math_avg) / 2`
- `null` values: Suppressed data (asterisks in source file)
- `act` field: `null` for elementary schools without ACT data

**Error Responses:**
- `404`: School not found
- `503`: Database unavailable

---

### 4. Compare Schools

```http
GET /api/schools/compare?rcdts={rcdts1},{rcdts2},{rcdts3}
```

**Description:** Compare 2-5 schools side-by-side.

**Query Parameters:**
- `rcdts` (required): Comma-separated RCDTS codes (2-5 schools)

**Example Request:**
```bash
curl "http://localhost:8000/api/schools/compare?rcdts=05-016-2140-17-0001,05-016-2140-17-0002"
```

**Example Response:**
```json
{
  "schools": [
    {
      "id": 1,
      "rcdts": "05-016-2140-17-0001",
      "school_name": "School A",
      "city": "Chicago",
      "metrics": { /* full metrics object */ }
    },
    {
      "id": 2,
      "rcdts": "05-016-2140-17-0002",
      "school_name": "School B",
      "city": "Springfield",
      "metrics": { /* full metrics object */ }
    }
  ]
}
```

**Behavior:**
- Validates 2-5 RCDTS codes
- Silently skips non-existent schools
- Returns found schools in request order
- Each school has full detail structure

**Error Responses:**
- `400`: Less than 2 or more than 5 RCDTS codes provided

---

## Data Models

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
    level: str              # "School", "District", "Statewide"
    grades_served: str      # "9-12", "K-8", etc.

    # Core Metrics
    student_enrollment: int
    el_percentage: float    # English Learner %
    low_income_percentage: float

    # ACT Scores
    act_ela_avg: float
    act_math_avg: float
    act_science_avg: float

    # Diversity Percentages
    pct_white: float
    pct_black: float
    pct_hispanic: float
    pct_asian: float
    pct_pacific_islander: float
    pct_native_american: float
    pct_two_or_more: float
    pct_mena: float         # Middle Eastern/North African

    created_at: datetime
```

### Pydantic Response Models

**File:** `app/models.py`

All API responses use Pydantic models for validation and serialization:

- `SchoolSearchResult`: Search endpoint results (basic info only)
- `SchoolDetail`: Full school information with nested metrics
- `SchoolMetrics`: Container for all metric categories
- `ACTScores`: ACT scores with computed `overall_avg` property
- `Demographics`: EL and low-income percentages
- `Diversity`: Racial/ethnic diversity breakdown
- `SearchResponse`: Wrapper for search results + total count
- `CompareResponse`: Wrapper for array of school details

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

FTS5 virtual table for fast search:

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
│   │   └── schools.py       # GET /api/schools/{rcdts}, /compare
│   └── utils/
│       ├── __init__.py
│       └── import_data.py   # Excel → SQLite import script
├── tests/
│   ├── conftest.py          # Pytest fixtures (test_db, client)
│   ├── test_database.py     # Database layer tests
│   ├── test_import_data.py  # Data import tests
│   ├── test_main.py         # FastAPI app tests
│   ├── test_models.py       # Pydantic model tests
│   ├── test_search_api.py   # Search endpoint tests
│   ├── test_schools_api.py  # School detail & compare tests
│   └── test_integration.py  # End-to-end integration tests
├── data/
│   └── schools.db           # SQLite database (gitignored)
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**For frontend development:**
- Frontend runs on `http://localhost:5173` (Vite default)
- Backend runs on `http://localhost:8000`
- CORS pre-configured for local development

---

## Error Handling

### Global Exception Handlers

**Database errors** (connection failures):
```json
{
  "detail": "Service temporarily unavailable"
}
```
HTTP Status: `503`

### Endpoint-Specific Errors

**Search endpoint:**
- `422`: Missing or invalid `q` parameter
- `422`: `limit` out of range (1-50)

**School detail endpoint:**
- `404`: School not found (invalid RCDTS)
- `503`: Database connection error

**Compare endpoint:**
- `400`: Less than 2 or more than 5 RCDTS codes
- `503`: Database connection error

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

**API Tests:**
- `test_main.py`: App initialization, CORS, health check
- `test_search_api.py`: Search endpoint, pagination, validation
- `test_schools_api.py`: Detail & compare endpoints, error cases

**Integration Tests:**
- `test_integration.py`: Full pipeline, end-to-end flows (marked `@pytest.mark.slow`)

### Coverage Targets

- Phase 2 API modules: 100%
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
