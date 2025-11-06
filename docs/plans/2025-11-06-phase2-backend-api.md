# Phase 2: Backend API Implementation Plan

> REQUIRED SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build FastAPI REST API with 3 endpoints for searching schools, retrieving school details, and comparing multiple schools.

**Architecture:** FastAPI application with Pydantic validation models, using existing SQLAlchemy database layer and FTS5 search from Phase 1. Three-layer architecture: API routes → database functions → SQLite with FTS5.

**Tech Stack:** FastAPI 0.104+, Pydantic 2.0+, SQLAlchemy 2.0, pytest + httpx (TestClient)

**Prerequisites:**
- Phase 1 complete (database.py with School model, FTS5 search, fixtures)
- Working directory: `/Users/kyle.pfister/IllinoisSchoolData/backend`
- Python commands: Use `uv run python`, `uv run pytest`

---

## Task 1: Pydantic Response Models

**Goal:** Create Pydantic schemas for API responses with proper validation and serialization.

**Files:**
- Create: `app/models.py`

### Step 1: Write failing test for SchoolSearchResult model

Create: `tests/test_models.py`

```python
# ABOUTME: Tests for Pydantic models used in API request/response validation
# ABOUTME: Validates serialization and field validation for all schema models

from app.models import SchoolSearchResult


def test_school_search_result_serialization():
    """SchoolSearchResult serializes all fields correctly."""
    data = {
        "id": 123,
        "rcdts": "05-016-2140-17-0002",
        "school_name": "Elk Grove High School",
        "city": "Elk Grove Village",
        "district": "Township HSD 214",
        "school_type": "High School",
    }

    result = SchoolSearchResult(**data)

    assert result.id == 123
    assert result.rcdts == "05-016-2140-17-0002"
    assert result.school_name == "Elk Grove High School"
    assert result.city == "Elk Grove Village"
    assert result.district == "Township HSD 214"
    assert result.school_type == "High School"
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_models.py::test_school_search_result_serialization -v
```

**Expected output:** `FAILED` with `ModuleNotFoundError: No module named 'app.models'`

### Step 3: Implement SchoolSearchResult model

Create: `app/models.py`

```python
# ABOUTME: Pydantic models for API request/response validation
# ABOUTME: Defines schemas for search results, school details, and comparison responses

from typing import Optional
from pydantic import BaseModel, Field


class SchoolSearchResult(BaseModel):
    """Search result item with basic school information."""

    id: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    school_type: Optional[str] = None

    class Config:
        from_attributes = True
```

### Step 4: Run test to verify it passes

```bash
uv run pytest tests/test_models.py::test_school_search_result_serialization -v
```

**Expected output:** `PASSED`

### Step 5: Write failing test for ACTScores nested model

Add to: `tests/test_models.py`

```python
from app.models import ACTScores


def test_act_scores_with_overall_avg():
    """ACTScores calculates overall_avg from ela and math."""
    scores = ACTScores(
        ela_avg=17.7,
        math_avg=18.2,
        science_avg=18.9
    )

    assert scores.ela_avg == 17.7
    assert scores.math_avg == 18.2
    assert scores.science_avg == 18.9
    assert scores.overall_avg == 17.95  # (17.7 + 18.2) / 2


def test_act_scores_with_none_values():
    """ACTScores handles None values for suppressed data."""
    scores = ACTScores(
        ela_avg=None,
        math_avg=None,
        science_avg=None
    )

    assert scores.ela_avg is None
    assert scores.math_avg is None
    assert scores.science_avg is None
    assert scores.overall_avg is None
```

### Step 6: Run test to verify it fails

```bash
uv run pytest tests/test_models.py::test_act_scores_with_overall_avg -v
uv run pytest tests/test_models.py::test_act_scores_with_none_values -v
```

**Expected output:** `FAILED` with `NameError: name 'ACTScores' is not defined`

### Step 7: Implement ACTScores model with computed overall_avg

Add to: `app/models.py`

```python
from pydantic import computed_field


class ACTScores(BaseModel):
    """ACT score averages with computed overall average."""

    ela_avg: Optional[float] = None
    math_avg: Optional[float] = None
    science_avg: Optional[float] = None

    @computed_field
    @property
    def overall_avg(self) -> Optional[float]:
        """Compute average of ELA and Math scores."""
        if self.ela_avg is not None and self.math_avg is not None:
            return round((self.ela_avg + self.math_avg) / 2, 2)
        return None
```

### Step 8: Run tests to verify they pass

```bash
uv run pytest tests/test_models.py -v
```

**Expected output:** All tests `PASSED`

### Step 9: Write failing tests for Demographics and Diversity models

Add to: `tests/test_models.py`

```python
from app.models import Demographics, Diversity


def test_demographics_model():
    """Demographics model holds EL and low income percentages."""
    demo = Demographics(el_percentage=29.0, low_income_percentage=38.4)

    assert demo.el_percentage == 29.0
    assert demo.low_income_percentage == 38.4


def test_diversity_model():
    """Diversity model holds all racial/ethnic percentages."""
    diversity = Diversity(
        white=36.8,
        black=1.9,
        hispanic=48.3,
        asian=8.7,
        pacific_islander=None,
        native_american=None,
        two_or_more=3.0,
        mena=None
    )

    assert diversity.white == 36.8
    assert diversity.black == 1.9
    assert diversity.hispanic == 48.3
    assert diversity.asian == 8.7
    assert diversity.pacific_islander is None
```

### Step 10: Run tests to verify they fail

```bash
uv run pytest tests/test_models.py::test_demographics_model -v
uv run pytest tests/test_models.py::test_diversity_model -v
```

**Expected output:** `FAILED` with `NameError`

### Step 11: Implement Demographics and Diversity models

Add to: `app/models.py`

```python
class Demographics(BaseModel):
    """Demographic statistics for a school."""

    el_percentage: Optional[float] = None
    low_income_percentage: Optional[float] = None


class Diversity(BaseModel):
    """Racial and ethnic diversity percentages."""

    white: Optional[float] = None
    black: Optional[float] = None
    hispanic: Optional[float] = None
    asian: Optional[float] = None
    pacific_islander: Optional[float] = None
    native_american: Optional[float] = None
    two_or_more: Optional[float] = None
    mena: Optional[float] = None
```

### Step 12: Run tests to verify they pass

```bash
uv run pytest tests/test_models.py -v
```

**Expected output:** All tests `PASSED`

### Step 13: Write failing test for SchoolMetrics composite model

Add to: `tests/test_models.py`

```python
from app.models import SchoolMetrics


def test_school_metrics_composition():
    """SchoolMetrics composes enrollment, ACT, demographics, and diversity."""
    metrics = SchoolMetrics(
        enrollment=1775,
        act=ACTScores(ela_avg=17.7, math_avg=18.2, science_avg=18.9),
        demographics=Demographics(el_percentage=29.0, low_income_percentage=38.4),
        diversity=Diversity(white=36.8, hispanic=48.3, asian=8.7)
    )

    assert metrics.enrollment == 1775
    assert metrics.act.overall_avg == 17.95
    assert metrics.demographics.el_percentage == 29.0
    assert metrics.diversity.white == 36.8
```

### Step 14: Run test to verify it fails

```bash
uv run pytest tests/test_models.py::test_school_metrics_composition -v
```

**Expected output:** `FAILED` with `NameError: name 'SchoolMetrics' is not defined`

### Step 15: Implement SchoolMetrics composite model

Add to: `app/models.py`

```python
class SchoolMetrics(BaseModel):
    """Composite metrics for a school including all categories."""

    enrollment: Optional[int] = None
    act: Optional[ACTScores] = None
    demographics: Optional[Demographics] = None
    diversity: Optional[Diversity] = None
```

### Step 16: Run test to verify it passes

```bash
uv run pytest tests/test_models.py::test_school_metrics_composition -v
```

**Expected output:** `PASSED`

### Step 17: Write failing test for SchoolDetail model

Add to: `tests/test_models.py`

```python
from app.models import SchoolDetail


def test_school_detail_full_model():
    """SchoolDetail includes all school information and metrics."""
    detail = SchoolDetail(
        id=123,
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        county="Cook",
        school_type="High School",
        grades_served="9-12",
        metrics=SchoolMetrics(
            enrollment=1775,
            act=ACTScores(ela_avg=17.7, math_avg=18.2, science_avg=18.9),
            demographics=Demographics(el_percentage=29.0, low_income_percentage=38.4),
            diversity=Diversity(white=36.8, hispanic=48.3)
        )
    )

    assert detail.school_name == "Elk Grove High School"
    assert detail.grades_served == "9-12"
    assert detail.metrics.enrollment == 1775
    assert detail.metrics.act.overall_avg == 17.95
```

### Step 18: Run test to verify it fails

```bash
uv run pytest tests/test_models.py::test_school_detail_full_model -v
```

**Expected output:** `FAILED` with `NameError: name 'SchoolDetail' is not defined`

### Step 19: Implement SchoolDetail model

Add to: `app/models.py`

```python
class SchoolDetail(BaseModel):
    """Complete school information with all metrics."""

    id: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    county: Optional[str] = None
    school_type: Optional[str] = None
    grades_served: Optional[str] = None
    metrics: SchoolMetrics

    class Config:
        from_attributes = True
```

### Step 20: Run test to verify it passes

```bash
uv run pytest tests/test_models.py::test_school_detail_full_model -v
```

**Expected output:** `PASSED`

### Step 21: Write failing tests for response wrapper models

Add to: `tests/test_models.py`

```python
from app.models import SearchResponse, CompareResponse


def test_search_response_wrapper():
    """SearchResponse wraps results list and total count."""
    response = SearchResponse(
        results=[
            SchoolSearchResult(
                id=1,
                rcdts="05-016-2140-17-0002",
                school_name="Test School",
                city="Chicago",
                district="Test District",
                school_type="High School"
            )
        ],
        total=1
    )

    assert len(response.results) == 1
    assert response.total == 1
    assert response.results[0].school_name == "Test School"


def test_compare_response_wrapper():
    """CompareResponse wraps list of school details."""
    response = CompareResponse(
        schools=[
            SchoolDetail(
                id=1,
                rcdts="05-016-2140-17-0002",
                school_name="School A",
                city="Chicago",
                metrics=SchoolMetrics(enrollment=1000)
            ),
            SchoolDetail(
                id=2,
                rcdts="05-016-2140-17-0003",
                school_name="School B",
                city="Springfield",
                metrics=SchoolMetrics(enrollment=500)
            )
        ]
    )

    assert len(response.schools) == 2
    assert response.schools[0].school_name == "School A"
    assert response.schools[1].metrics.enrollment == 500
```

### Step 22: Run tests to verify they fail

```bash
uv run pytest tests/test_models.py::test_search_response_wrapper -v
uv run pytest tests/test_models.py::test_compare_response_wrapper -v
```

**Expected output:** `FAILED` with `NameError`

### Step 23: Implement response wrapper models

Add to: `app/models.py`

```python
from typing import List


class SearchResponse(BaseModel):
    """Response wrapper for search endpoint."""

    results: List[SchoolSearchResult]
    total: int


class CompareResponse(BaseModel):
    """Response wrapper for compare endpoint."""

    schools: List[SchoolDetail]
```

### Step 24: Run all model tests to verify they pass

```bash
uv run pytest tests/test_models.py -v
```

**Expected output:** All tests `PASSED` (11 tests)

### Step 25: Commit Pydantic models

```bash
git add app/models.py tests/test_models.py
git commit -m "feat(api): add Pydantic models for API validation

- Add SchoolSearchResult for search endpoint responses
- Add SchoolDetail with nested metrics (ACT, demographics, diversity)
- Add ACTScores with computed overall_avg field
- Add response wrappers (SearchResponse, CompareResponse)
- All models tested with 11 passing tests"
```

---

## Task 2: FastAPI Application Setup

**Goal:** Create FastAPI application with CORS configuration and health check endpoint.

**Files:**
- Create: `app/main.py`
- Modify: `tests/conftest.py` (add TestClient fixture)

### Step 1: Write failing test for FastAPI app initialization

Create: `tests/test_main.py`

```python
# ABOUTME: Tests for FastAPI application initialization and configuration
# ABOUTME: Validates app setup, CORS, and health check endpoint

from fastapi.testclient import TestClient


def test_app_exists():
    """FastAPI app instance is importable."""
    from app.main import app

    assert app is not None
    assert app.title == "Illinois School Explorer API"
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_main.py::test_app_exists -v
```

**Expected output:** `FAILED` with `ModuleNotFoundError: No module named 'app.main'`

### Step 3: Implement minimal FastAPI app

Create: `app/main.py`

```python
# ABOUTME: FastAPI application entry point with CORS and route configuration
# ABOUTME: Initializes app, registers routers, and configures middleware

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Illinois School Explorer API",
    description="REST API for searching and comparing Illinois schools",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 4: Run test to verify it passes

```bash
uv run pytest tests/test_main.py::test_app_exists -v
```

**Expected output:** `PASSED`

### Step 5: Write failing test for health check endpoint

Add to: `tests/test_main.py`

```python
def test_health_check(client):
    """GET /health returns 200 with status ok."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

### Step 6: Add TestClient fixture to conftest.py

Add to: `tests/conftest.py`

```python
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db


@pytest.fixture
def client(test_db):
    """Provide FastAPI TestClient with test database."""
    app.dependency_overrides[get_db] = lambda: test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

### Step 7: Run test to verify it fails

```bash
uv run pytest tests/test_main.py::test_health_check -v
```

**Expected output:** `FAILED` with `404 Not Found` (endpoint doesn't exist)

### Step 8: Implement health check endpoint

Add to: `app/main.py`

```python
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
```

### Step 9: Run test to verify it passes

```bash
uv run pytest tests/test_main.py::test_health_check -v
```

**Expected output:** `PASSED`

### Step 10: Write failing test for CORS headers

Add to: `tests/test_main.py`

```python
def test_cors_headers_present(client):
    """CORS middleware adds appropriate headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
```

### Step 11: Run test to verify it passes

```bash
uv run pytest tests/test_main.py::test_cors_headers_present -v
```

**Expected output:** `PASSED` (CORS already configured)

### Step 12: Commit FastAPI application setup

```bash
git add app/main.py tests/test_main.py tests/conftest.py
git commit -m "feat(api): initialize FastAPI app with CORS

- Create FastAPI application with metadata
- Add CORS middleware for localhost:5173
- Add /health endpoint for health checks
- Add TestClient fixture to conftest
- All setup tests passing (3 tests)"
```

---

## Task 3: Search Endpoint

**Goal:** Implement `/api/search` endpoint with FTS5 integration and query validation.

**Files:**
- Create: `app/api/__init__.py`
- Create: `app/api/search.py`
- Modify: `app/main.py` (register router)

### Step 1: Write failing test for basic search

Create: `tests/test_search_api.py`

```python
# ABOUTME: Tests for /api/search endpoint with FTS5 full-text search
# ABOUTME: Validates search functionality, pagination, and error handling

from app.database import School


def test_search_endpoint_returns_results(client, test_db):
    """GET /api/search returns matching schools."""
    # Insert test data
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        school_type="High School",
        level="School",
        student_enrollment=1775
    )
    test_db.add(school)
    test_db.commit()

    # Search for school
    response = client.get("/api/search?q=elk+grove")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["results"]) == 1
    assert data["results"][0]["school_name"] == "Elk Grove High School"
    assert data["results"][0]["city"] == "Elk Grove Village"
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_search_api.py::test_search_endpoint_returns_results -v
```

**Expected output:** `FAILED` with `404 Not Found`

### Step 3: Create search router with basic endpoint

Create: `app/api/__init__.py`

```python
# ABOUTME: API router initialization for modular endpoint organization
# ABOUTME: Empty init file to make api directory a Python package
```

Create: `app/api/search.py`

```python
# ABOUTME: Search endpoint implementation using FTS5 full-text search
# ABOUTME: Handles query validation, pagination, and result formatting

from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db, search_schools
from app.models import SearchResponse, SchoolSearchResult

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search_schools_endpoint(
    q: Annotated[str, Query(min_length=1, description="Search query")],
    limit: Annotated[int, Query(ge=1, le=50, description="Max results")] = 10,
    db: Session = Depends(get_db)
):
    """Search schools by name, city, or district using full-text search."""
    schools = search_schools(db, q, limit)

    results = [
        SchoolSearchResult(
            id=s.id,
            rcdts=s.rcdts,
            school_name=s.school_name,
            city=s.city,
            district=s.district,
            school_type=s.school_type
        )
        for s in schools
    ]

    return SearchResponse(results=results, total=len(results))
```

### Step 4: Register search router in main app

Add to: `app/main.py` (after CORS middleware)

```python
from app.api.search import router as search_router

app.include_router(search_router)
```

### Step 5: Run test to verify it passes

```bash
uv run pytest tests/test_search_api.py::test_search_endpoint_returns_results -v
```

**Expected output:** `PASSED`

### Step 6: Write failing test for empty query validation

Add to: `tests/test_search_api.py`

```python
def test_search_requires_query_parameter(client):
    """GET /api/search without query parameter returns 422."""
    response = client.get("/api/search")

    assert response.status_code == 422
    assert "field required" in response.text.lower() or "missing" in response.text.lower()
```

### Step 7: Run test to verify it passes

```bash
uv run pytest tests/test_search_api.py::test_search_requires_query_parameter -v
```

**Expected output:** `PASSED` (FastAPI validates automatically)

### Step 8: Write failing test for limit parameter

Add to: `tests/test_search_api.py`

```python
def test_search_respects_limit_parameter(client, test_db):
    """GET /api/search respects limit parameter."""
    # Insert 15 schools
    for i in range(15):
        school = School(
            rcdts=f"05-016-2140-17-{i:04d}",
            school_name=f"Test High School {i}",
            city="Chicago",
            district="Test District",
            school_type="High School",
            level="School"
        )
        test_db.add(school)
    test_db.commit()

    # Search with limit=5
    response = client.get("/api/search?q=test&limit=5")

    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 5
    assert data["total"] == 5


def test_search_enforces_max_limit(client, test_db):
    """GET /api/search enforces maximum limit of 50."""
    response = client.get("/api/search?q=school&limit=100")

    assert response.status_code == 422  # Validation error
```

### Step 9: Run tests to verify they pass

```bash
uv run pytest tests/test_search_api.py::test_search_respects_limit_parameter -v
uv run pytest tests/test_search_api.py::test_search_enforces_max_limit -v
```

**Expected output:** Both `PASSED` (already implemented in search.py)

### Step 10: Write failing test for no results case

Add to: `tests/test_search_api.py`

```python
def test_search_returns_empty_when_no_matches(client, test_db):
    """GET /api/search returns empty results for non-matching query."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        level="School"
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/search?q=nonexistent")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["results"] == []
```

### Step 11: Run test to verify it passes

```bash
uv run pytest tests/test_search_api.py::test_search_returns_empty_when_no_matches -v
```

**Expected output:** `PASSED` (already handles empty results)

### Step 12: Write failing test for city search

Add to: `tests/test_search_api.py`

```python
def test_search_finds_schools_by_city(client, test_db):
    """GET /api/search finds schools by city name."""
    school1 = School(
        rcdts="05-016-2140-17-0001",
        school_name="Springfield High School",
        city="Springfield",
        level="School"
    )
    school2 = School(
        rcdts="05-016-2140-17-0002",
        school_name="Lincoln Elementary",
        city="Springfield",
        level="School"
    )
    test_db.add_all([school1, school2])
    test_db.commit()

    response = client.get("/api/search?q=springfield")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
```

### Step 13: Run test to verify it passes

```bash
uv run pytest tests/test_search_api.py::test_search_finds_schools_by_city -v
```

**Expected output:** `PASSED` (FTS5 already searches city field)

### Step 14: Run all search tests

```bash
uv run pytest tests/test_search_api.py -v
```

**Expected output:** All tests `PASSED` (6 tests)

### Step 15: Commit search endpoint

```bash
git add app/api/__init__.py app/api/search.py app/main.py tests/test_search_api.py
git commit -m "feat(api): add /api/search endpoint with FTS5

- Implement search endpoint with query and limit parameters
- Integrate with existing FTS5 full-text search
- Add query validation (min length, max limit)
- Return SearchResponse with results and total count
- All search tests passing (6 tests)"
```

---

## Task 4: School Detail Endpoint

**Goal:** Implement `/api/schools/{rcdts}` endpoint to retrieve full school details with metrics.

**Files:**
- Create: `app/api/schools.py`
- Modify: `app/main.py` (register router)

### Step 1: Write failing test for get school by RCDTS

Create: `tests/test_schools_api.py`

```python
# ABOUTME: Tests for /api/schools endpoints (detail and compare)
# ABOUTME: Validates school retrieval, metrics formatting, and error handling

from app.database import School


def test_get_school_detail_returns_full_info(client, test_db):
    """GET /api/schools/{rcdts} returns complete school details."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        county="Cook",
        school_type="High School",
        level="School",
        grades_served="9-12",
        student_enrollment=1775,
        el_percentage=29.0,
        low_income_percentage=38.4,
        act_ela_avg=17.7,
        act_math_avg=18.2,
        act_science_avg=18.9,
        pct_white=36.8,
        pct_hispanic=48.3,
        pct_asian=8.7
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0002")

    assert response.status_code == 200
    data = response.json()
    assert data["school_name"] == "Elk Grove High School"
    assert data["grades_served"] == "9-12"
    assert data["metrics"]["enrollment"] == 1775
    assert data["metrics"]["act"]["ela_avg"] == 17.7
    assert data["metrics"]["act"]["overall_avg"] == 17.95
    assert data["metrics"]["demographics"]["el_percentage"] == 29.0
    assert data["metrics"]["diversity"]["white"] == 36.8
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_schools_api.py::test_get_school_detail_returns_full_info -v
```

**Expected output:** `FAILED` with `404 Not Found`

### Step 3: Create schools router with detail endpoint

Create: `app/api/schools.py`

```python
# ABOUTME: School detail and comparison endpoints
# ABOUTME: Retrieves individual school data and multi-school comparisons

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db, get_school_by_rcdts
from app.models import (
    SchoolDetail,
    SchoolMetrics,
    ACTScores,
    Demographics,
    Diversity
)

router = APIRouter(prefix="/api/schools", tags=["schools"])


def build_school_detail(school) -> SchoolDetail:
    """Convert School ORM model to SchoolDetail Pydantic model."""
    metrics = SchoolMetrics(
        enrollment=school.student_enrollment,
        act=ACTScores(
            ela_avg=school.act_ela_avg,
            math_avg=school.act_math_avg,
            science_avg=school.act_science_avg
        ) if any([school.act_ela_avg, school.act_math_avg, school.act_science_avg]) else None,
        demographics=Demographics(
            el_percentage=school.el_percentage,
            low_income_percentage=school.low_income_percentage
        ),
        diversity=Diversity(
            white=school.pct_white,
            black=school.pct_black,
            hispanic=school.pct_hispanic,
            asian=school.pct_asian,
            pacific_islander=school.pct_pacific_islander,
            native_american=school.pct_native_american,
            two_or_more=school.pct_two_or_more,
            mena=school.pct_mena
        )
    )

    return SchoolDetail(
        id=school.id,
        rcdts=school.rcdts,
        school_name=school.school_name,
        city=school.city,
        district=school.district,
        county=school.county,
        school_type=school.school_type,
        grades_served=school.grades_served,
        metrics=metrics
    )


@router.get("/{rcdts}", response_model=SchoolDetail)
def get_school_detail(
    rcdts: Annotated[str, Path(description="School RCDTS identifier")],
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific school by RCDTS."""
    school = get_school_by_rcdts(db, rcdts)

    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    return build_school_detail(school)
```

### Step 4: Register schools router in main app

Add to: `app/main.py`

```python
from app.api.schools import router as schools_router

app.include_router(schools_router)
```

### Step 5: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_get_school_detail_returns_full_info -v
```

**Expected output:** `PASSED`

### Step 6: Write failing test for school not found

Add to: `tests/test_schools_api.py`

```python
def test_get_school_detail_returns_404_when_not_found(client):
    """GET /api/schools/{rcdts} returns 404 for non-existent school."""
    response = client.get("/api/schools/99-999-9999-99-9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "School not found"
```

### Step 7: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_get_school_detail_returns_404_when_not_found -v
```

**Expected output:** `PASSED` (already implemented)

### Step 8: Write failing test for school with null ACT scores

Add to: `tests/test_schools_api.py`

```python
def test_get_school_detail_handles_null_act_scores(client, test_db):
    """GET /api/schools/{rcdts} handles schools with no ACT data."""
    school = School(
        rcdts="05-016-2140-17-0003",
        school_name="Elementary School",
        city="Chicago",
        level="School",
        student_enrollment=500,
        act_ela_avg=None,
        act_math_avg=None,
        act_science_avg=None
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0003")

    assert response.status_code == 200
    data = response.json()
    assert data["metrics"]["act"] is None  # No ACT data for elementary schools
```

### Step 9: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_get_school_detail_handles_null_act_scores -v
```

**Expected output:** `PASSED` (already handles None values)

### Step 10: Write failing test for suppressed data (asterisks)

Add to: `tests/test_schools_api.py`

```python
def test_get_school_detail_shows_null_for_suppressed_data(client, test_db):
    """GET /api/schools/{rcdts} returns null for suppressed metrics."""
    school = School(
        rcdts="05-016-2140-17-0004",
        school_name="Small School",
        city="Rural Town",
        level="School",
        student_enrollment=25,
        pct_white=None,  # Suppressed due to small numbers
        pct_black=None,
        pct_hispanic=None
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0004")

    assert response.status_code == 200
    data = response.json()
    assert data["metrics"]["diversity"]["white"] is None
    assert data["metrics"]["diversity"]["black"] is None
```

### Step 11: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_get_school_detail_shows_null_for_suppressed_data -v
```

**Expected output:** `PASSED`

### Step 12: Run all school detail tests

```bash
uv run pytest tests/test_schools_api.py -v -k "test_get_school_detail"
```

**Expected output:** All tests `PASSED` (4 tests)

### Step 13: Commit school detail endpoint

```bash
git add app/api/schools.py app/main.py tests/test_schools_api.py
git commit -m "feat(api): add /api/schools/{rcdts} endpoint

- Implement school detail endpoint with full metrics
- Add build_school_detail helper to convert ORM to Pydantic
- Handle 404 for non-existent schools
- Handle null/suppressed data gracefully
- Return nested ACT, demographics, and diversity data
- All detail tests passing (4 tests)"
```

---

## Task 5: Compare Endpoint

**Goal:** Implement `/api/schools/compare` endpoint for side-by-side school comparison.

**Files:**
- Modify: `app/api/schools.py`

### Step 1: Write failing test for basic comparison

Add to: `tests/test_schools_api.py`

```python
def test_compare_schools_returns_multiple_schools(client, test_db):
    """GET /api/schools/compare returns details for multiple schools."""
    school1 = School(
        rcdts="05-016-2140-17-0001",
        school_name="School A",
        city="Chicago",
        level="School",
        student_enrollment=1000,
        act_ela_avg=20.0,
        act_math_avg=21.0
    )
    school2 = School(
        rcdts="05-016-2140-17-0002",
        school_name="School B",
        city="Springfield",
        level="School",
        student_enrollment=500,
        act_ela_avg=18.0,
        act_math_avg=19.0
    )
    test_db.add_all([school1, school2])
    test_db.commit()

    response = client.get("/api/schools/compare?rcdts=05-016-2140-17-0001,05-016-2140-17-0002")

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 2
    assert data["schools"][0]["school_name"] == "School A"
    assert data["schools"][1]["school_name"] == "School B"
    assert data["schools"][0]["metrics"]["enrollment"] == 1000
    assert data["schools"][1]["metrics"]["act"]["overall_avg"] == 18.5
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_schools_api.py::test_compare_schools_returns_multiple_schools -v
```

**Expected output:** `FAILED` with `404 Not Found`

### Step 3: Implement compare endpoint

Add to: `app/api/schools.py`

```python
from typing import List
from fastapi import Query
from app.models import CompareResponse


@router.get("/compare", response_model=CompareResponse)
def compare_schools(
    rcdts: Annotated[str, Query(description="Comma-separated RCDTS codes (2-5)")],
    db: Session = Depends(get_db)
):
    """Compare multiple schools side-by-side."""
    rcdts_list = [code.strip() for code in rcdts.split(",")]

    if len(rcdts_list) < 2 or len(rcdts_list) > 5:
        raise HTTPException(
            status_code=400,
            detail="Must provide 2-5 school RCDTS codes"
        )

    schools: List[SchoolDetail] = []
    for rcdts_code in rcdts_list:
        school = get_school_by_rcdts(db, rcdts_code)
        if school:
            schools.append(build_school_detail(school))

    return CompareResponse(schools=schools)
```

### Step 4: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_compare_schools_returns_multiple_schools -v
```

**Expected output:** `PASSED`

### Step 5: Write failing test for validation errors

Add to: `tests/test_schools_api.py`

```python
def test_compare_schools_requires_2_to_5_schools(client):
    """GET /api/schools/compare validates 2-5 school requirement."""
    # Test with 1 school
    response = client.get("/api/schools/compare?rcdts=05-016-2140-17-0001")
    assert response.status_code == 400
    assert "2-5" in response.json()["detail"]

    # Test with 6 schools
    rcdts_codes = ",".join([f"05-016-2140-17-{i:04d}" for i in range(6)])
    response = client.get(f"/api/schools/compare?rcdts={rcdts_codes}")
    assert response.status_code == 400
    assert "2-5" in response.json()["detail"]


def test_compare_schools_skips_nonexistent_schools(client, test_db):
    """GET /api/schools/compare skips schools that don't exist."""
    school = School(
        rcdts="05-016-2140-17-0001",
        school_name="Real School",
        city="Chicago",
        level="School"
    )
    test_db.add(school)
    test_db.commit()

    # Request 2 schools but only 1 exists
    response = client.get("/api/schools/compare?rcdts=05-016-2140-17-0001,99-999-9999-99-9999")

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 1  # Only the existing school
    assert data["schools"][0]["school_name"] == "Real School"
```

### Step 6: Run tests to verify they pass

```bash
uv run pytest tests/test_schools_api.py::test_compare_schools_requires_2_to_5_schools -v
uv run pytest tests/test_schools_api.py::test_compare_schools_skips_nonexistent_schools -v
```

**Expected output:** Both `PASSED`

### Step 7: Write failing test for 3 school comparison

Add to: `tests/test_schools_api.py`

```python
def test_compare_schools_handles_three_schools(client, test_db):
    """GET /api/schools/compare works with 3 schools."""
    schools = [
        School(rcdts=f"05-016-2140-17-{i:04d}", school_name=f"School {i}",
               city="Chicago", level="School", student_enrollment=100 * i)
        for i in range(1, 4)
    ]
    test_db.add_all(schools)
    test_db.commit()

    rcdts_codes = ",".join([f"05-016-2140-17-{i:04d}" for i in range(1, 4)])
    response = client.get(f"/api/schools/compare?rcdts={rcdts_codes}")

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 3
    assert data["schools"][0]["metrics"]["enrollment"] == 100
    assert data["schools"][2]["metrics"]["enrollment"] == 300
```

### Step 8: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_compare_schools_handles_three_schools -v
```

**Expected output:** `PASSED`

### Step 9: Run all compare tests

```bash
uv run pytest tests/test_schools_api.py -v -k "compare"
```

**Expected output:** All tests `PASSED` (4 tests)

### Step 10: Run all schools API tests

```bash
uv run pytest tests/test_schools_api.py -v
```

**Expected output:** All tests `PASSED` (8 tests)

### Step 11: Commit compare endpoint

```bash
git add app/api/schools.py tests/test_schools_api.py
git commit -m "feat(api): add /api/schools/compare endpoint

- Implement comparison endpoint for 2-5 schools
- Validate RCDTS count (400 error if not 2-5)
- Skip non-existent schools gracefully
- Return CompareResponse with list of school details
- All comparison tests passing (4 tests)"
```

---

## Task 6: Error Handling & Edge Cases

**Goal:** Add comprehensive error handling for database failures and edge cases.

**Files:**
- Modify: `app/main.py`
- Add tests to: `tests/test_search_api.py`, `tests/test_schools_api.py`

### Step 1: Write failing test for database connection error

Add to: `tests/test_schools_api.py`

```python
import pytest
from unittest.mock import patch
from sqlalchemy.exc import OperationalError


def test_get_school_handles_database_error(client):
    """GET /api/schools/{rcdts} returns 503 on database error."""
    with patch("app.database.get_school_by_rcdts") as mock_get:
        mock_get.side_effect = OperationalError("statement", {}, "error")

        response = client.get("/api/schools/05-016-2140-17-0001")

        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()
```

### Step 2: Run test to verify it fails

```bash
uv run pytest tests/test_schools_api.py::test_get_school_handles_database_error -v
```

**Expected output:** `FAILED` (raises uncaught exception)

### Step 3: Add global exception handler for database errors

Add to: `app/main.py` (after middleware)

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError


@app.exception_handler(OperationalError)
async def database_exception_handler(request: Request, exc: OperationalError):
    """Handle database connection errors."""
    return JSONResponse(
        status_code=503,
        content={"detail": "Service temporarily unavailable"}
    )
```

### Step 4: Run test to verify it passes

```bash
uv run pytest tests/test_schools_api.py::test_get_school_handles_database_error -v
```

**Expected output:** `PASSED`

### Step 5: Write failing test for malformed RCDTS query

Add to: `tests/test_schools_api.py`

```python
def test_compare_schools_handles_malformed_rcdts(client):
    """GET /api/schools/compare handles malformed RCDTS gracefully."""
    response = client.get("/api/schools/compare?rcdts=invalid,,extra-comma")

    # Should validate or handle gracefully (200 with 0 results)
    assert response.status_code in [200, 400]
```

### Step 6: Run test to verify current behavior

```bash
uv run pytest tests/test_schools_api.py::test_compare_schools_handles_malformed_rcdts -v
```

**Expected output:** `PASSED` (already handles gracefully by skipping invalid codes)

### Step 7: Write failing test for special characters in search

Add to: `tests/test_search_api.py`

```python
def test_search_handles_special_characters(client, test_db):
    """GET /api/search handles special characters in query."""
    school = School(
        rcdts="05-016-2140-17-0001",
        school_name="St. Mary's School",
        city="O'Fallon",
        level="School"
    )
    test_db.add(school)
    test_db.commit()

    # Search with apostrophe
    response = client.get("/api/search?q=o'fallon")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
```

### Step 8: Run test to verify it passes

```bash
uv run pytest tests/test_search_api.py::test_search_handles_special_characters -v
```

**Expected output:** `PASSED` (FTS5 handles special characters)

### Step 9: Run all API tests together

```bash
uv run pytest tests/test_search_api.py tests/test_schools_api.py tests/test_main.py -v
```

**Expected output:** All tests `PASSED` (21 tests total)

### Step 10: Commit error handling improvements

```bash
git add app/main.py tests/test_search_api.py tests/test_schools_api.py
git commit -m "feat(api): add error handling for edge cases

- Add global exception handler for database errors (503)
- Test malformed RCDTS handling in compare endpoint
- Test special characters in search queries
- All error handling tests passing (3 new tests)"
```

---

## Task 7: API Documentation & Manual Testing

**Goal:** Verify API documentation is working and test endpoints manually.

**Files:**
- None (manual testing)

### Step 1: Start the development server

```bash
uv run uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Verify API documentation is accessible

Open browser to: `http://localhost:8000/docs`

**Expected result:**
- Swagger UI loads successfully
- See 4 endpoints listed:
  - GET /health
  - GET /api/search
  - GET /api/schools/{rcdts}
  - GET /api/schools/compare
- Can expand and view request/response schemas

### Step 3: Test health check via curl

```bash
curl http://localhost:8000/health
```

**Expected output:**
```json
{"status":"ok"}
```

### Step 4: Test search endpoint via curl

```bash
curl "http://localhost:8000/api/search?q=elk+grove&limit=5"
```

**Expected output:** JSON with results array and total count

### Step 5: Test school detail endpoint via curl

First, get a valid RCDTS from search results, then:

```bash
curl "http://localhost:8000/api/schools/05-016-2140-17-0002"
```

**Expected output:** JSON with full school details and nested metrics

### Step 6: Test compare endpoint via curl

```bash
curl "http://localhost:8000/api/schools/compare?rcdts=05-016-2140-17-0002,05-016-2140-17-0003"
```

**Expected output:** JSON with schools array containing 2 school details

### Step 7: Test error cases manually

Test 404:
```bash
curl -i "http://localhost:8000/api/schools/99-999-9999-99-9999"
```

**Expected output:** `404 Not Found` with error detail

Test 400:
```bash
curl -i "http://localhost:8000/api/schools/compare?rcdts=05-016-2140-17-0001"
```

**Expected output:** `400 Bad Request` with "2-5" message

Test 422:
```bash
curl -i "http://localhost:8000/api/search"
```

**Expected output:** `422 Unprocessable Entity` with validation error

### Step 8: Stop the server

Press `CTRL+C` in terminal where server is running

---

## Task 8: Final Verification & Coverage

**Goal:** Run full test suite and verify coverage meets requirements.

**Files:**
- None (verification only)

### Step 1: Run all tests with verbose output

```bash
uv run pytest -v
```

**Expected output:** All tests `PASSED` (33+ tests from Phase 1 + 24 new Phase 2 tests)

### Step 2: Run tests with coverage report

```bash
uv run pytest --cov=app --cov-report=term-missing
```

**Expected output:**
- Coverage > 90% for all modules
- app/main.py: 100%
- app/models.py: 100%
- app/api/search.py: 100%
- app/api/schools.py: 100%

### Step 3: Run only API tests to verify Phase 2

```bash
uv run pytest tests/test_main.py tests/test_search_api.py tests/test_schools_api.py tests/test_models.py -v
```

**Expected output:** All 24 Phase 2 tests `PASSED`

### Step 4: Check for any test warnings or deprecations

```bash
uv run pytest -v --tb=short
```

**Expected output:** No warnings, clean test run

### Step 5: Verify database still works after all changes

```bash
uv run python -c "from app.database import engine, School, SessionLocal; db = SessionLocal(); print(f'Schools in DB: {db.query(School).count()}'); db.close()"
```

**Expected output:** `Schools in DB: 3827` (or similar count from Phase 1 import)

### Step 6: Create Phase 2 completion summary

Create: `docs/plans/PHASE2-COMPLETION.md`

```markdown
# Phase 2: Backend API - Completion Summary

**Completed:** 2025-11-06
**Duration:** [Actual time taken]

## Deliverables ✅

- ✅ Working REST API with 3 endpoints
- ✅ Interactive API documentation at /docs
- ✅ All API tests passing (24 tests)
- ✅ Can query API via curl or Postman

## Test Coverage

- Total tests: 57 (33 Phase 1 + 24 Phase 2)
- Overall coverage: >90%
- All modules at 100% coverage

## Endpoints Implemented

1. **GET /api/search** - Full-text search with FTS5
   - Query validation (min length, max limit)
   - Returns ranked results with pagination
   - 7 tests covering all cases

2. **GET /api/schools/{rcdts}** - School detail with metrics
   - Returns complete school info with nested metrics
   - Handles 404 for non-existent schools
   - Handles null/suppressed data
   - 5 tests covering all cases

3. **GET /api/schools/compare** - Multi-school comparison
   - Validates 2-5 school requirement
   - Skips non-existent schools
   - Returns array of school details
   - 4 tests covering all cases

## Files Created

- app/main.py (FastAPI application)
- app/models.py (Pydantic schemas)
- app/api/__init__.py
- app/api/search.py
- app/api/schools.py
- tests/test_main.py
- tests/test_models.py
- tests/test_search_api.py
- tests/test_schools_api.py

## Ready for Phase 3

Backend API is complete and ready for frontend integration.
All endpoints tested and documented. Can proceed to Phase 3: Frontend Foundation.
```

### Step 7: Final commit

```bash
git add docs/plans/PHASE2-COMPLETION.md
git commit -m "docs: add Phase 2 completion summary

Phase 2: Backend API complete
- 3 REST endpoints implemented and tested
- 24 new tests, all passing
- >90% code coverage
- API documentation at /docs
- Ready for Phase 3: Frontend Foundation"
```

---

## Summary

**Total Tasks:** 8 major tasks
**Total Tests Added:** 24 tests across 4 test files

**Key Achievements:**
- ✅ FastAPI application with CORS configured
- ✅ Pydantic models with computed fields
- ✅ 3 REST endpoints fully tested
- ✅ Error handling for 404, 400, 503 cases
- ✅ Interactive API documentation
- ✅ >90% test coverage
- ✅ Manual testing verified via curl

**Next Phase:** Phase 3 - Frontend Foundation (React + TypeScript + Vite)

---

## Appendix: Quick Reference Commands

```bash
# Run all tests
uv run pytest -v

# Run specific test file
uv run pytest tests/test_search_api.py -v

# Run with coverage
uv run pytest --cov=app --cov-report=term-missing

# Run fast tests only
uv run pytest -m "not slow"

# Start development server
uv run uvicorn app.main:app --reload --port 8000

# Test endpoint manually
curl "http://localhost:8000/api/search?q=chicago&limit=5"
```
