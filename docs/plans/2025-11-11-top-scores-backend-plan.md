# Top Scores Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose `/api/top-scores` that returns the top 100 Illinois schools ranked by ACT or IAR scores, with data sourced and normalized directly from the Report Card dataset.

**Architecture:** Extend the existing `School` model/import pipeline with normalized level metadata plus ACT/IAR aggregates, add a service layer that runs sorted queries with filtering, and expose a dedicated FastAPI router/response schema. All business logic (ranking, validation, filtering) lives server-side; the frontend simply requests the list for a given assessment/level.

**Tech Stack:** FastAPI, SQLAlchemy ORM, SQLite, Pydantic v2, pytest.

---

### Task 1: Add IAR fields and normalized levels to import pipeline

**Files:**
- Modify: `backend/tests/test_import_data.py`
- Modify: `backend/app/database.py`
- Modify: `backend/app/utils/import_data.py`

**Step 1: Write the failing test**

Append to `backend/tests/test_import_data.py`:

```python
def test_prepare_school_records_includes_iar_fields():
    """prepare_school_records should emit normalized level + IAR rates."""
    from app.utils.import_data import prepare_school_records
    import pandas as pd

    merged_df = pd.DataFrame([
        {
            "RCDTS": "11-111-1111-11-0001",
            "School Name": "Sample Elementary",
            "District": "Unit 5",
            "City": "Normal",
            "County": "McLean",
            "School Type": "Elementary School",
            "Level": "School",
            "Grades Served": "K-5",
            "# Student Enrollment": "450",
            "% Student Enrollment - EL": "12.5%",
            "% Student Enrollment - Low Income": "40%",
            "ACT ELA Average Score - Grade 11": None,
            "ACT Math Average Score - Grade 11": None,
            "ACT Science Average Score - Grade 11": None,
            "IAR ELA Proficiency Rate - Total": "55.4%",
            "IAR Math Proficiency Rate - Total": "48.1%",
        }
    ])

    records = prepare_school_records(merged_df)
    assert records[0]["level"] == "elementary"
    assert records[0]["iar_ela_proficiency_pct"] == 55.4
    assert records[0]["iar_math_proficiency_pct"] == 48.1
    assert records[0]["iar_overall_proficiency_pct"] == 51.75
```

**Step 2: Run the test to verify it fails**

Run: `uv run pytest backend/tests/test_import_data.py::test_prepare_school_records_includes_iar_fields -vv`

Expected: FAIL because the keys/normalization do not exist yet.

**Step 3: Implement minimal code changes**

1. In `backend/app/database.py`, add new nullable columns on the `School` model:

```python
    iar_ela_proficiency_pct = Column(Float)
    iar_math_proficiency_pct = Column(Float)
    iar_overall_proficiency_pct = Column(Float)
```

2. In `backend/app/utils/import_data.py`:
   - Extend `merge_school_data` to include the two IAR proficiency columns by merging the `IAR` sheet (similar to how ACT data is merged). Fetch only the columns needed for now.
   - Add a helper `def normalize_level(school_type: Optional[str]) -> str:` that returns `'high'`, `'middle'`, `'elementary'`, or `'other'` based on substring matches (`"Middle"`, `"Junior High"`, etc.).
   - Update `prepare_school_records` to:
     * call `normalize_level(row.get("School Type"))` and assign the string to the `"level"` field
     * populate the three new IAR keys using `clean_percentage` and compute `iar_overall_proficiency_pct` as the average of ELA and Math rates when both exist.

**Step 4: Re-run the focused test**

Run: `uv run pytest backend/tests/test_import_data.py::test_prepare_school_records_includes_iar_fields -vv`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/database.py backend/app/utils/import_data.py backend/tests/test_import_data.py
git commit -m "feat(data): capture IAR proficiency metrics"
```

---

### Task 2: Persist and expose IAR data through models

**Files:**
- Modify: `backend/tests/test_models.py`
- Modify: `backend/app/models.py`
- Modify: `backend/app/api/schools.py`

**Step 1: Write failing tests**

In `backend/tests/test_models.py`, add assertions to `test_school_detail_schema` (or create a new test) verifying that `SchoolDetail.metrics` includes the `iar_overall_proficiency_pct` field once we wire it. Example snippet:

```python
def test_school_detail_includes_iar_metrics():
    from app.models import SchoolDetail, SchoolMetrics

    detail = SchoolDetail(
        id=1,
        rcdts="11",
        school_name="Sample",
        city="Normal",
        metrics=SchoolMetrics(
            enrollment=400,
            act=None,
            demographics=None,
            diversity=None,
            iar_overall_proficiency_pct=51.75,
        ),
    )
    assert detail.metrics.iar_overall_proficiency_pct == 51.75
```

This will fail because `SchoolMetrics` lacks that attribute.

**Step 2: Run failing tests**

Run: `uv run pytest backend/tests/test_models.py::test_school_detail_includes_iar_metrics -vv`

Expected: FAIL (unexpected keyword argument).

**Step 3: Implement minimal code**

1. Update `backend/app/models.py`:
   - Extend `SchoolMetrics` with optional floats `iar_ela_proficiency_pct`, `iar_math_proficiency_pct`, and `iar_overall_proficiency_pct`.
2. Update `backend/app/api/schools.py` `build_school_detail` to set these values on the `SchoolMetrics` instance using the ORM fields we added in Task 1.

**Step 4: Re-run models test + existing school API tests**

Run: `uv run pytest backend/tests/test_models.py::test_school_detail_includes_iar_metrics -vv`
Run: `uv run pytest backend/tests/test_schools_api.py -vv`

Expected: Both PASS (the second ensures serialization didn’t regress).

**Step 5: Commit**

```bash
git add backend/app/models.py backend/app/api/schools.py backend/tests/test_models.py
git commit -m "feat(api): expose IAR metrics in school detail"
```

---

### Task 3: Implement top-score query service

**Files:**
- Create: `backend/app/services/top_scores.py`
- Create: `backend/tests/test_top_scores_service.py`

**Step 1: Write failing service tests**

Create `backend/tests/test_top_scores_service.py`:

```python
from app.database import School
from app.services.top_scores import fetch_top_scores


def seed_school(**overrides):
    defaults = dict(
        rcdts="11-111-1111-11-{:04d}".format(overrides.pop("idx", 1)),
        school_name="Test School",
        city="Normal",
        level="high",
        school_type="High School",
        student_enrollment=800,
        act_ela_avg=20.0,
        act_math_avg=21.0,
    )
    defaults.update(overrides)
    return School(**defaults)


def test_fetch_top_scores_orders_by_metric(test_db):
    schools = [
        seed_school(idx=1, act_ela_avg=18, act_math_avg=18),
        seed_school(idx=2, act_ela_avg=25, act_math_avg=25),
        seed_school(idx=3, act_ela_avg=22, act_math_avg=22),
    ]
    test_db.add_all(schools)
    test_db.commit()

    results = fetch_top_scores(test_db, assessment="act", level="high", limit=2)
    assert [row.rank for row in results] == [1, 2]
    assert results[0].school_name == schools[1].school_name
    assert results[0].score == 25.0


def test_fetch_top_scores_filters_by_level_and_null_scores(test_db):
    test_db.add_all([
        seed_school(idx=1, level="high", act_ela_avg=24, act_math_avg=24),
        seed_school(idx=2, level="middle", iar_overall_proficiency_pct=60.0,
                    act_ela_avg=None, act_math_avg=None),
    ])
    test_db.commit()

    results = fetch_top_scores(test_db, assessment="iar", level="middle", limit=5)
    assert len(results) == 1
    assert results[0].level == "middle"
    assert results[0].score == 60.0
```

Expect failure because `fetch_top_scores` doesn’t exist.

**Step 2: Run tests to confirm failure**

Run: `uv run pytest backend/tests/test_top_scores_service.py -vv`

Expected: FAIL (ImportError / AttributeError).

**Step 3: Implement the service**

Create `backend/app/services/top_scores.py`:

```python
from dataclasses import dataclass
from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import School

@dataclass
class RankedSchool:
    rank: int
    rcdts: str
    school_name: str
    city: str
    district: str | None
    school_type: str | None
    level: str
    enrollment: int | None
    score: float


def fetch_top_scores(db: Session, assessment: str, level: str, limit: int = 100) -> List[RankedSchool]:
    metric_column = {
        "act": func.avg(School.act_ela_avg, School.act_math_avg),
        "iar": School.iar_overall_proficiency_pct,
    }[assessment]

    query = (
        select(
            School.rcdts,
            School.school_name,
            School.city,
            School.district,
            School.school_type,
            School.level,
            School.student_enrollment,
            metric_column.label("score"),
        )
        .where(School.level == level)
        .where(metric_column.isnot(None))
        .order_by(metric_column.desc(), School.school_name.asc())
        .limit(limit)
    )

    rows = db.execute(query).all()
    return [
        RankedSchool(
            rank=idx + 1,
            rcdts=row.rcdts,
            school_name=row.school_name,
            city=row.city,
            district=row.district,
            school_type=row.school_type,
            level=row.level,
            enrollment=row.student_enrollment,
            score=round(row.score, 2),
        )
        for idx, row in enumerate(rows)
    ]
```

(Adjust imports/types if needed.)

**Step 4: Re-run service tests**

Run: `uv run pytest backend/tests/test_top_scores_service.py -vv`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/services/top_scores.py backend/tests/test_top_scores_service.py
```

(Leave commit for Task 4 after API wiring to keep atomic changes grouped.)

---

### Task 4: Expose `/api/top-scores` endpoint

**Files:**
- Create: `backend/app/api/top_scores.py`
- Modify: `backend/app/models.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_top_scores_api.py`
- Modify: `backend/tests/test_main.py`

**Step 1: Write failing API tests**

Create `backend/tests/test_top_scores_api.py`:

```python
from app.database import School


def create_school(idx, **overrides):
    defaults = dict(
        rcdts=f"11-111-1111-11-{idx:04d}",
        school_name=f"School {idx}",
        city="Chicago",
        district="District",
        school_type="High School",
        level="high",
        student_enrollment=900,
        act_ela_avg=22.0 + idx,
        act_math_avg=23.0 + idx,
        iar_overall_proficiency_pct=60.0 + idx,
    )
    defaults.update(overrides)
    return School(**defaults)


def test_top_scores_returns_ranked_list(client, test_db):
    test_db.add_all([create_school(1), create_school(2), create_school(3)])
    test_db.commit()

    response = client.get("/api/top-scores?assessment=act&level=high&limit=2")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["results"]) == 2
    assert payload["results"][0]["rank"] == 1
    assert payload["results"][0]["score"] > payload["results"][1]["score"]


def test_top_scores_validates_query_params(client):
    response = client.get("/api/top-scores?assessment=act")
    assert response.status_code == 422

    response = client.get("/api/top-scores?assessment=sat&level=high")
    assert response.status_code == 422
```

Also update `backend/tests/test_main.py` to assert the router is mounted by hitting `/api/top-scores?...` if desired, or simply ensure no regression by verifying `app.openapi()` includes the new path.

**Step 2: Run the new tests (expect failure)**

Run: `uv run pytest backend/tests/test_top_scores_api.py -vv`

Expected: FAIL (404 / validation errors missing).

**Step 3: Implement endpoint + schemas**

1. In `backend/app/models.py`, add:

```python
class TopScoreEntry(BaseModel):
    rank: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    school_type: Optional[str] = None
    level: str
    enrollment: Optional[int] = None
    score: float


class TopScoresResponse(BaseModel):
    results: List[TopScoreEntry]
```

2. Create `backend/app/api/top_scores.py`:

```python
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TopScoresResponse, TopScoreEntry
from app.services.top_scores import fetch_top_scores

router = APIRouter(prefix="/api/top-scores", tags=["top-scores"])

VALID_ASSESSMENTS = {"act", "iar"}
VALID_LEVELS = {"high", "middle", "elementary"}

@router.get("", response_model=TopScoresResponse)
def get_top_scores(
    assessment: Annotated[str, Query(description="act or iar")],
    level: Annotated[str, Query(description="high, middle, elementary")],
    limit: Annotated[int, Query(le=100, ge=1, default=100)] = 100,
    db: Session = Depends(get_db),
) -> TopScoresResponse:
    if assessment not in VALID_ASSESSMENTS:
        raise HTTPException(status_code=422, detail="Invalid assessment")
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail="Invalid level")

    ranked = fetch_top_scores(db, assessment=assessment, level=level, limit=limit)
    return TopScoresResponse(results=[TopScoreEntry(**vars(row)) for row in ranked])
```

(Import `HTTPException`.)

3. Register the router in `backend/app/main.py` with `app.include_router(top_scores_router)` after other routers.

**Step 4: Re-run API tests + regression suite**

Run: `uv run pytest backend/tests/test_top_scores_api.py -vv`
Run: `uv run pytest backend/tests/test_main.py -vv`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/models.py backend/app/api/top_scores.py backend/app/main.py backend/tests/test_top_scores_api.py backend/tests/test_main.py backend/app/services/top_scores.py backend/tests/test_top_scores_service.py
```

```bash
git commit -m "feat(api): add /api/top-scores endpoint"
```

---

### Task 5: Update backend docs & verification

**Files:**
- Modify: `backend/README.md`

**Step 1: Document the endpoint**

Add a subsection under “API Endpoints” describing `GET /api/top-scores`, query parameters, sample request/response, and note that levels map to normalized `school_type` values.

**Step 2: Verify docs formatting**

Preview the section (e.g., `bat`/`cat`) to ensure ABOUTME header remains untouched.

**Step 3: Commit**

```bash
git add backend/README.md
git commit -m "docs(api): document top scores endpoint"
```

---

### Final Verification

1. Run full test suite: `uv run pytest -m "not slow"`
2. Optionally run slow import tests locally if time permits: `uv run pytest backend/tests/test_import_data.py -m slow`
3. `git status` should be clean.

---
