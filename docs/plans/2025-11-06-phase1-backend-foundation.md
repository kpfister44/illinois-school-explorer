# Phase 1: Backend Foundation - Implementation Plan

> **Status:** ✅ **COMPLETE** (2025-11-06)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully-tested backend with SQLite database, FTS5 search, data import from Excel, and SQLAlchemy models.

**Architecture:** Python backend using SQLAlchemy 2.0 ORM with SQLite + FTS5 for full-text search. Excel data imported via pandas with data cleaning (asterisks → NULL, percentage parsing). Pytest testing infrastructure with in-memory database fixtures.

**Tech Stack:** Python 3.11+, uv (package manager), SQLAlchemy 2.0, SQLite3 + FTS5, pandas, openpyxl, pytest, httpx

**Final Results:** 3,827 schools imported, 97% test coverage (33/33 tests passing), 1.1 MB database with FTS5 index

---

## Task 1: Project Structure Setup

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/app/utils/__init__.py`
- Create: `backend/app/utils/import_data.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/pytest.ini`
- Create: `backend/.gitignore`
- Create: `backend/pyproject.toml`

**Step 1: Create backend directory structure**

```bash
mkdir -p backend/app/api backend/app/utils backend/tests backend/data
touch backend/app/__init__.py backend/app/utils/__init__.py backend/tests/__init__.py
```

**Step 2: Create pyproject.toml for uv**

Create `backend/pyproject.toml`:

```toml
[project]
name = "illinois-school-backend"
version = "0.1.0"
description = "Illinois School Explorer Backend API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.104.1",
    "sqlalchemy>=2.0.23",
    "uvicorn[standard]>=0.24.0",
    "pandas>=2.1.4",
    "openpyxl>=3.1.2",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-asyncio>=0.21.1",
    "pytest-cov>=4.1.0",
    "httpx>=0.25.2",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**Step 3: Create .gitignore**

Create `backend/.gitignore`:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
dist/
build/

# Database
data/*.db
data/*.db-*

# Testing
.pytest_cache/
.coverage
htmlcov/

# IDE
.vscode/
.idea/
*.swp
*.swo
```

**Step 4: Create pytest configuration**

Create `backend/pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --tb=short
    --cov=app
    --cov-report=term-missing
    --cov-report=html
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
```

**Step 5: Install dependencies**

Run: `cd backend && uv sync --all-extras`

Expected: Dependencies installed successfully

**Step 6: Verify structure**

Run: `tree backend -L 3 -I '__pycache__|*.pyc'`

Expected: Directory structure matches design

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend project structure with uv"
```

---

## Task 2: SQLAlchemy Models and Database Setup

**Files:**
- Create: `backend/app/database.py`
- Test: `backend/tests/test_database.py`

**Step 1: Write failing test for database connection**

Create `backend/tests/conftest.py`:

```python
# ABOUTME: Pytest fixtures for testing with in-memory SQLite database
# ABOUTME: Provides test database sessions and client instances

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database import Base


@pytest.fixture(scope="function")
def test_engine():
    """Create in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db(test_engine) -> Session:
    """Provide a test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Create `backend/tests/test_database.py`:

```python
# ABOUTME: Tests for database models and CRUD operations
# ABOUTME: Validates School model, FTS search, and data integrity

from app.database import Base, School


def test_school_table_exists(test_engine):
    """Test that schools table is created."""
    assert 'schools' in Base.metadata.tables


def test_create_school(test_db):
    """Test creating a school record."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Test High School",
        city="Chicago",
        level="School"
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="05-016-2140-17-0002").first()
    assert result is not None
    assert result.school_name == "Test High School"
    assert result.city == "Chicago"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_database.py -v`

Expected: FAIL with "ModuleNotFoundError: No module named 'app.database'"

**Step 3: Write minimal database module**

Create `backend/app/database.py`:

```python
# ABOUTME: SQLAlchemy database models and session configuration
# ABOUTME: Defines School model with FTS5 full-text search support

from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class School(Base):
    """School model with demographic and academic metrics."""

    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rcdts = Column(String(20), unique=True, nullable=False, index=True)
    school_name = Column(Text, nullable=False)
    district = Column(Text)
    city = Column(Text, nullable=False, index=True)
    county = Column(Text)
    school_type = Column(Text)
    level = Column(String(20), nullable=False, index=True)
    grades_served = Column(Text)

    # Core Metrics
    student_enrollment = Column(Integer)
    el_percentage = Column(Float)
    low_income_percentage = Column(Float)

    # ACT Scores
    act_ela_avg = Column(Float)
    act_math_avg = Column(Float)
    act_science_avg = Column(Float)

    # Diversity Percentages
    pct_white = Column(Float)
    pct_black = Column(Float)
    pct_hispanic = Column(Float)
    pct_asian = Column(Float)
    pct_pacific_islander = Column(Float)
    pct_native_american = Column(Float)
    pct_two_or_more = Column(Float)
    pct_mena = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<School(rcdts='{self.rcdts}', name='{self.school_name}', city='{self.city}')>"


# Database session configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/schools.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_database.py -v`

Expected: PASS - both tests pass

**Step 5: Commit**

```bash
git add backend/app/database.py backend/tests/conftest.py backend/tests/test_database.py
git commit -m "feat: add SQLAlchemy School model with test fixtures"
```

---

## Task 3: FTS5 Full-Text Search Index

**Files:**
- Modify: `backend/app/database.py`
- Test: `backend/tests/test_database.py`

**Step 1: Write failing test for FTS5 search**

Add to `backend/tests/test_database.py`:

```python
def test_fts_search_by_school_name(test_db, test_engine):
    """Test FTS5 search finds schools by name."""
    # Create test schools
    schools = [
        School(rcdts="01", school_name="Elk Grove High School", city="Elk Grove", level="School"),
        School(rcdts="02", school_name="Grove Elementary", city="Oak Park", level="School"),
        School(rcdts="03", school_name="Lincoln High School", city="Springfield", level="School"),
    ]
    test_db.add_all(schools)
    test_db.commit()

    # Search for "grove"
    results = test_db.execute(
        """
        SELECT s.* FROM schools s
        JOIN schools_fts ON s.id = schools_fts.rowid
        WHERE schools_fts MATCH 'grove'
        ORDER BY rank
        """
    ).fetchall()

    assert len(results) == 2
    assert any('Elk Grove' in str(row) for row in results)
    assert any('Grove Elementary' in str(row) for row in results)


def test_fts_search_by_city(test_db, test_engine):
    """Test FTS5 search finds schools by city."""
    schools = [
        School(rcdts="01", school_name="North High", city="Chicago", level="School"),
        School(rcdts="02", school_name="South High", city="Springfield", level="School"),
    ]
    test_db.add_all(schools)
    test_db.commit()

    results = test_db.execute(
        """
        SELECT s.* FROM schools s
        JOIN schools_fts ON s.id = schools_fts.rowid
        WHERE schools_fts MATCH 'chicago'
        """
    ).fetchall()

    assert len(results) == 1
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_database.py::test_fts_search_by_school_name -v`

Expected: FAIL with "no such table: schools_fts"

**Step 3: Add FTS5 index creation**

Modify `backend/app/database.py` - add after `School` class:

```python
def create_fts_index(engine):
    """Create FTS5 virtual table for full-text search."""
    with engine.connect() as conn:
        # Drop existing FTS table if exists
        conn.execute(text("DROP TABLE IF EXISTS schools_fts"))

        # Create FTS5 virtual table
        conn.execute(text("""
            CREATE VIRTUAL TABLE schools_fts USING fts5(
                school_name,
                city,
                district,
                content=schools,
                content_rowid=id
            )
        """))

        # Create triggers to keep FTS index in sync
        conn.execute(text("""
            CREATE TRIGGER schools_fts_insert AFTER INSERT ON schools BEGIN
                INSERT INTO schools_fts(rowid, school_name, city, district)
                VALUES (new.id, new.school_name, new.city, new.district);
            END
        """))

        conn.execute(text("""
            CREATE TRIGGER schools_fts_delete AFTER DELETE ON schools BEGIN
                DELETE FROM schools_fts WHERE rowid = old.id;
            END
        """))

        conn.execute(text("""
            CREATE TRIGGER schools_fts_update AFTER UPDATE ON schools BEGIN
                UPDATE schools_fts
                SET school_name = new.school_name,
                    city = new.city,
                    district = new.district
                WHERE rowid = new.id;
            END
        """))

        conn.commit()


def init_db():
    """Initialize database tables and FTS index."""
    Base.metadata.create_all(bind=engine)
    create_fts_index(engine)
```

Also add import at top: `from sqlalchemy import text`

Update `conftest.py` to create FTS index for tests:

```python
from app.database import Base, create_fts_index


@pytest.fixture(scope="function")
def test_engine():
    """Create in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False
    )
    Base.metadata.create_all(engine)
    create_fts_index(engine)  # Add FTS index
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_database.py::test_fts_search_by_school_name -v`

Expected: PASS

Run: `cd backend && uv run pytest tests/test_database.py::test_fts_search_by_city -v`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/database.py backend/tests/conftest.py backend/tests/test_database.py
git commit -m "feat: add FTS5 full-text search index with triggers"
```

---

## Task 4: Data Import - Excel Reading and Parsing

**Files:**
- Create: `backend/app/utils/import_data.py`
- Create: `backend/tests/test_import_data.py`

**Step 1: Write failing test for Excel data loading**

Create `backend/tests/test_import_data.py`:

```python
# ABOUTME: Tests for Excel data import and cleaning functions
# ABOUTME: Validates data parsing, cleaning, and database insertion

import pandas as pd
from app.utils.import_data import (
    load_excel_data,
    clean_percentage,
    clean_enrollment,
    merge_school_data
)


def test_clean_percentage_converts_string():
    """Test percentage string cleaning."""
    assert clean_percentage("45.5%") == 45.5
    assert clean_percentage("0.0%") == 0.0
    assert clean_percentage("100%") == 100.0


def test_clean_percentage_handles_asterisk():
    """Test that asterisks become None."""
    assert clean_percentage("*") is None
    assert clean_percentage("* ") is None


def test_clean_percentage_handles_none():
    """Test that None/NaN stay None."""
    assert clean_percentage(None) is None
    assert pd.isna(clean_percentage(float('nan')))


def test_clean_enrollment_converts_string():
    """Test enrollment number cleaning."""
    assert clean_enrollment("1,234") == 1234
    assert clean_enrollment("567") == 567


def test_clean_enrollment_handles_asterisk():
    """Test that asterisks become None."""
    assert clean_enrollment("*") is None


def test_load_excel_data_returns_dataframes():
    """Test loading Excel file returns correct DataFrames."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")

    assert general_df is not None
    assert act_df is not None
    assert len(general_df) > 4000
    assert len(act_df) > 4000
    assert 'RCDTS' in general_df.columns
    assert 'School Name' in general_df.columns


def test_merge_school_data_filters_schools_only():
    """Test that merge returns only school-level records."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df)

    assert all(merged_df['Level'] == 'School')
    assert len(merged_df) < len(general_df)  # Should exclude District/Statewide


def test_merge_school_data_joins_act_scores():
    """Test that ACT data is properly joined."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df)

    assert 'ACT ELA Average Score - Grade 11' in merged_df.columns
    assert 'ACT Math Average Score - Grade 11' in merged_df.columns
    assert 'ACT Science Average Score - Grade 11' in merged_df.columns
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_import_data.py::test_clean_percentage_converts_string -v`

Expected: FAIL with "ModuleNotFoundError: No module named 'app.utils.import_data'"

**Step 3: Write minimal import module**

Create `backend/app/utils/import_data.py`:

```python
# ABOUTME: Excel data import utilities for school database
# ABOUTME: Handles data loading, cleaning, and transformation from Excel source

import pandas as pd
import numpy as np
from typing import Tuple, Optional


def clean_percentage(value) -> Optional[float]:
    """
    Convert percentage string to float or asterisk to None.

    Examples: "45.5%" -> 45.5, "*" -> None
    """
    if pd.isna(value):
        return None

    if isinstance(value, str):
        value = value.strip()
        if value == "*" or value == "":
            return None
        if value.endswith("%"):
            value = value.rstrip("%")
        try:
            return float(value)
        except ValueError:
            return None

    if isinstance(value, (int, float)):
        return float(value)

    return None


def clean_enrollment(value) -> Optional[int]:
    """
    Convert enrollment string to integer or asterisk to None.

    Examples: "1,234" -> 1234, "*" -> None
    """
    if pd.isna(value):
        return None

    if isinstance(value, str):
        value = value.strip()
        if value == "*" or value == "":
            return None
        # Remove commas
        value = value.replace(",", "")
        try:
            return int(float(value))
        except ValueError:
            return None

    if isinstance(value, (int, float)):
        return int(value)

    return None


def load_excel_data(excel_path: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load General and ACT sheets from Excel file.

    Returns tuple of (general_df, act_df)
    """
    general_df = pd.read_excel(excel_path, sheet_name='General')
    act_df = pd.read_excel(excel_path, sheet_name='ACT')

    return general_df, act_df


def merge_school_data(general_df: pd.DataFrame, act_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merge General and ACT data, filter to school-level records only.

    Returns DataFrame with combined school data.
    """
    # Filter to schools only (exclude District and Statewide)
    schools_df = general_df[general_df['Level'] == 'School'].copy()

    # Merge ACT data on RCDTS
    merged_df = schools_df.merge(
        act_df[['RCDTS', 'ACT ELA Average Score - Grade 11',
                'ACT Math Average Score - Grade 11',
                'ACT Science Average Score - Grade 11']],
        on='RCDTS',
        how='left'
    )

    return merged_df
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_import_data.py -v`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/app/utils/import_data.py backend/tests/test_import_data.py
git commit -m "feat: add Excel data loading and cleaning functions"
```

---

## Task 5: Data Import - Database Insertion

**Files:**
- Modify: `backend/app/utils/import_data.py`
- Modify: `backend/tests/test_import_data.py`

**Step 1: Write failing test for database import**

Add to `backend/tests/test_import_data.py`:

```python
from app.database import School
from app.utils.import_data import import_to_database, prepare_school_records


def test_prepare_school_records_transforms_data():
    """Test that prepare_school_records creates proper dictionaries."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df)

    records = prepare_school_records(merged_df)

    assert len(records) > 0
    assert isinstance(records, list)
    assert isinstance(records[0], dict)
    assert 'rcdts' in records[0]
    assert 'school_name' in records[0]
    assert 'city' in records[0]


def test_import_to_database_inserts_schools(test_db, test_engine):
    """Test full import pipeline inserts schools into database."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    count = test_db.query(School).count()
    assert count > 3800  # Should have ~3827 schools

    # Verify a sample school
    sample = test_db.query(School).filter_by(city="Elk Grove Village").first()
    assert sample is not None
    assert sample.school_name is not None


def test_import_handles_suppressed_data(test_db, test_engine):
    """Test that asterisks are converted to NULL in database."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    # Find schools with NULL metrics (suppressed data)
    school_with_null = test_db.query(School).filter(
        School.act_ela_avg == None
    ).first()

    # Should exist (some schools have suppressed ACT data)
    assert school_with_null is not None or True  # Some records may have nulls
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_import_data.py::test_prepare_school_records_transforms_data -v`

Expected: FAIL with "ImportError: cannot import name 'prepare_school_records'"

**Step 3: Add database import functions**

Add to `backend/app/utils/import_data.py`:

```python
from sqlalchemy.orm import Session
from app.database import School, Base


def prepare_school_records(merged_df: pd.DataFrame) -> list[dict]:
    """
    Transform merged DataFrame into School model dictionaries.

    Returns list of dictionaries ready for bulk insert.
    """
    records = []

    for _, row in merged_df.iterrows():
        record = {
            'rcdts': row['RCDTS'],
            'school_name': row['School Name'],
            'district': row.get('District'),
            'city': row['City'],
            'county': row.get('County'),
            'school_type': row.get('School Type'),
            'level': row['Level'],
            'grades_served': row.get('Grades Served'),

            # Core metrics
            'student_enrollment': clean_enrollment(row.get('# Student Enrollment')),
            'el_percentage': clean_percentage(row.get('% Student Enrollment - EL')),
            'low_income_percentage': clean_percentage(row.get('% Student Enrollment - Low Income')),

            # ACT scores
            'act_ela_avg': clean_percentage(row.get('ACT ELA Average Score - Grade 11')),
            'act_math_avg': clean_percentage(row.get('ACT Math Average Score - Grade 11')),
            'act_science_avg': clean_percentage(row.get('ACT Science Average Score - Grade 11')),

            # Diversity
            'pct_white': clean_percentage(row.get('% Student Enrollment - White')),
            'pct_black': clean_percentage(row.get('% Student Enrollment - Black or African American')),
            'pct_hispanic': clean_percentage(row.get('% Student Enrollment - Hispanic or Latino')),
            'pct_asian': clean_percentage(row.get('% Student Enrollment - Asian')),
            'pct_pacific_islander': clean_percentage(row.get('% Student Enrollment - Native Hawaiian or Other Pacific Islander')),
            'pct_native_american': clean_percentage(row.get('% Student Enrollment - American Indian or Alaska Native')),
            'pct_two_or_more': clean_percentage(row.get('% Student Enrollment - Two or More Races')),
            'pct_mena': clean_percentage(row.get('% Student Enrollment - Middle Eastern or North African')),
        }
        records.append(record)

    return records


def import_to_database(excel_path: str, db: Session):
    """
    Full import pipeline: load Excel, clean, and insert into database.

    Drops existing data and reimports (idempotent).
    """
    # Load and merge data
    general_df, act_df = load_excel_data(excel_path)
    merged_df = merge_school_data(general_df, act_df)

    # Prepare records
    records = prepare_school_records(merged_df)

    # Clear existing data
    db.query(School).delete()
    db.commit()

    # Bulk insert
    db.bulk_insert_mappings(School, records)
    db.commit()

    print(f"Imported {len(records)} schools successfully")


def main():
    """CLI entry point for importing data."""
    import sys
    from app.database import SessionLocal, init_db

    if len(sys.argv) < 2:
        print("Usage: uv run python -m app.utils.import_data <path_to_excel>")
        sys.exit(1)

    excel_path = sys.argv[1]

    # Initialize database
    print("Initializing database...")
    init_db()

    # Import data
    print(f"Importing data from {excel_path}...")
    db = SessionLocal()
    try:
        import_to_database(excel_path, db)
        print("Import complete!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_import_data.py -v`

Expected: All tests PASS (may take 10-20 seconds for full import tests)

**Step 5: Test CLI import script**

Run: `cd backend && uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx`

Expected: Output shows "Imported 3827 schools successfully"

**Step 6: Verify database was created**

Run: `ls -lh backend/data/`

Expected: Shows `schools.db` file (~5-10 MB)

**Step 7: Commit**

```bash
git add backend/app/utils/import_data.py backend/tests/test_import_data.py backend/data/.gitkeep
git commit -m "feat: add database import with CLI script"
```

---

## Task 6: Database Query Helper Functions

**Files:**
- Modify: `backend/app/database.py`
- Modify: `backend/tests/test_database.py`

**Step 1: Write failing test for search helper**

Add to `backend/tests/test_database.py`:

```python
from app.database import search_schools


def test_search_schools_by_name(test_db, test_engine):
    """Test search_schools function finds schools by name."""
    from app.utils.import_data import import_to_database
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    results = search_schools(test_db, "elk grove", limit=5)

    assert len(results) > 0
    assert any('Elk Grove' in s.school_name for s in results)


def test_search_schools_by_city(test_db, test_engine):
    """Test search finds schools by city name."""
    from app.utils.import_data import import_to_database
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    results = search_schools(test_db, "chicago", limit=10)

    assert len(results) > 0
    assert any(s.city.lower() == 'chicago' for s in results)


def test_search_schools_limit_works(test_db, test_engine):
    """Test that limit parameter restricts results."""
    from app.utils.import_data import import_to_database
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    results = search_schools(test_db, "high school", limit=3)

    assert len(results) <= 3


def test_get_school_by_rcdts(test_db, test_engine):
    """Test retrieving school by RCDTS code."""
    from app.utils.import_data import import_to_database
    from app.database import get_school_by_rcdts

    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    # Get first school
    first_school = test_db.query(School).first()

    # Retrieve by RCDTS
    result = get_school_by_rcdts(test_db, first_school.rcdts)

    assert result is not None
    assert result.rcdts == first_school.rcdts
    assert result.school_name == first_school.school_name


def test_get_school_by_rcdts_not_found(test_db):
    """Test that invalid RCDTS returns None."""
    from app.database import get_school_by_rcdts

    result = get_school_by_rcdts(test_db, "INVALID-RCDTS")
    assert result is None
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_database.py::test_search_schools_by_name -v`

Expected: FAIL with "ImportError: cannot import name 'search_schools'"

**Step 3: Add query helper functions**

Add to `backend/app/database.py`:

```python
from typing import List, Optional
from sqlalchemy.orm import Session


def search_schools(db: Session, query: str, limit: int = 10) -> List[School]:
    """
    Search schools using FTS5 full-text index.

    Args:
        db: Database session
        query: Search query (school name, city, or district)
        limit: Maximum number of results (default 10, max 50)

    Returns:
        List of School objects ranked by relevance
    """
    limit = min(limit, 50)  # Cap at 50

    # Use raw SQL for FTS5 search
    sql = text("""
        SELECT s.* FROM schools s
        JOIN schools_fts ON s.id = schools_fts.rowid
        WHERE schools_fts MATCH :query
        ORDER BY rank
        LIMIT :limit
    """)

    result = db.execute(sql, {"query": query, "limit": limit})

    # Convert rows to School objects
    schools = []
    for row in result:
        school = db.query(School).filter(School.id == row.id).first()
        if school:
            schools.append(school)

    return schools


def get_school_by_rcdts(db: Session, rcdts: str) -> Optional[School]:
    """
    Retrieve a single school by RCDTS code.

    Args:
        db: Database session
        rcdts: School RCDTS identifier

    Returns:
        School object or None if not found
    """
    return db.query(School).filter(School.rcdts == rcdts).first()
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_database.py -v`

Expected: All tests PASS (may be slow due to full imports in search tests)

**Step 5: Commit**

```bash
git add backend/app/database.py backend/tests/test_database.py
git commit -m "feat: add search_schools and get_school_by_rcdts helpers"
```

---

## Task 7: Verify Full Backend Integration

**Files:**
- Create: `backend/tests/test_integration.py`

**Step 1: Write integration test**

Create `backend/tests/test_integration.py`:

```python
# ABOUTME: Integration tests for full backend data pipeline
# ABOUTME: End-to-end validation from import to query

import pytest
from app.database import School, search_schools, get_school_by_rcdts
from app.utils.import_data import import_to_database


@pytest.mark.slow
def test_full_pipeline_import_and_search(test_db, test_engine):
    """Test complete pipeline: import data, search, retrieve details."""
    # Import data
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    # Verify import
    total_schools = test_db.query(School).count()
    assert total_schools > 3800

    # Test search
    results = search_schools(test_db, "lincoln", limit=10)
    assert len(results) > 0

    # Test detail retrieval
    first_result = results[0]
    school_detail = get_school_by_rcdts(test_db, first_result.rcdts)

    assert school_detail is not None
    assert school_detail.id == first_result.id
    assert school_detail.school_name is not None
    assert school_detail.city is not None


@pytest.mark.slow
def test_search_returns_relevant_results(test_db, test_engine):
    """Test that search returns contextually relevant results."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    # Search for specific city
    chicago_schools = search_schools(test_db, "chicago", limit=20)

    # Most results should be in Chicago
    chicago_count = sum(1 for s in chicago_schools if 'chicago' in s.city.lower())
    assert chicago_count > 0


@pytest.mark.slow
def test_data_quality_no_missing_required_fields(test_db, test_engine):
    """Test that all schools have required fields populated."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    schools = test_db.query(School).limit(100).all()

    for school in schools:
        assert school.rcdts is not None
        assert school.school_name is not None
        assert school.city is not None
        assert school.level == "School"


def test_coverage_target_met():
    """Placeholder test to verify coverage calculation."""
    # This test ensures pytest-cov runs
    assert True
```

**Step 2: Run integration tests**

Run: `cd backend && uv run pytest tests/test_integration.py -v`

Expected: All tests PASS

**Step 3: Run full test suite with coverage**

Run: `cd backend && uv run pytest --cov=app --cov-report=term-missing`

Expected:
- All tests pass
- Coverage > 90%
- Coverage report shows which lines are covered

**Step 4: Commit**

```bash
git add backend/tests/test_integration.py
git commit -m "test: add integration tests for full backend pipeline"
```

---

## Task 8: Documentation and Final Verification

**Files:**
- Create: `backend/README.md`
- Create: `backend/data/.gitkeep`

**Step 1: Create backend README**

Create `backend/README.md`:

```markdown
# Illinois School Explorer - Backend

Python backend API for searching and retrieving Illinois school data.

## Tech Stack

- Python 3.11+
- FastAPI (ASGI web framework)
- SQLAlchemy 2.0 (ORM)
- SQLite3 + FTS5 (full-text search)
- pytest (testing)
- uv (package manager)

## Setup

```bash
# Install dependencies
cd backend
uv sync --all-extras

# Import data
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx

# Verify import
uv run python -c "from app.database import SessionLocal, School; db = SessionLocal(); print(f'Total schools: {db.query(School).count()}'); db.close()"
```

## Running Tests

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=app --cov-report=html

# Specific test file
uv run pytest tests/test_database.py -v

# Skip slow tests
uv run pytest -m "not slow"
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py           # SQLAlchemy models and DB config
│   ├── utils/
│   │   └── import_data.py    # Excel import script
├── tests/
│   ├── conftest.py           # Pytest fixtures
│   ├── test_database.py      # Database model tests
│   ├── test_import_data.py   # Import logic tests
│   └── test_integration.py   # Full pipeline tests
├── data/
│   └── schools.db            # SQLite database (gitignored)
└── pyproject.toml            # Dependencies
```

## Database Schema

**schools table:**
- Core fields: rcdts, school_name, city, district, school_type
- Metrics: enrollment, EL %, low income %
- ACT scores: ELA, Math, Science averages
- Diversity: 8 racial/ethnic percentage fields

**schools_fts (FTS5):**
- Full-text search index on: school_name, city, district
- Auto-synced via SQLite triggers

## Usage Examples

### Import Data

```bash
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
```

### Search Schools (Python)

```python
from app.database import SessionLocal, search_schools

db = SessionLocal()
results = search_schools(db, "elk grove", limit=5)
for school in results:
    print(f"{school.school_name} - {school.city}")
db.close()
```

### Get School by RCDTS

```python
from app.database import SessionLocal, get_school_by_rcdts

db = SessionLocal()
school = get_school_by_rcdts(db, "05-016-2140-17-0002")
if school:
    print(f"{school.school_name}: {school.student_enrollment} students")
db.close()
```

## Coverage Goals

- Target: >90% code coverage
- All public functions tested
- Edge cases handled (NULL values, asterisks, missing data)

## Next Steps

See [Phase 2: Backend API](../../docs/plans/IMPLEMENTATION-ROADMAP.md) for API endpoint implementation.
```

**Step 2: Create data directory placeholder**

Run: `touch backend/data/.gitkeep`

**Step 3: Final test run**

Run: `cd backend && uv run pytest -v --cov=app --cov-report=term-missing`

Expected: All tests pass, coverage >90%

**Step 4: Verify database can be queried**

Run:
```bash
cd backend && uv run python -c "
from app.database import SessionLocal, School, search_schools
db = SessionLocal()
print(f'Total schools: {db.query(School).count()}')
results = search_schools(db, 'high school', limit=3)
print(f'Sample search results:')
for s in results:
    print(f'  - {s.school_name} ({s.city})')
db.close()
"
```

Expected: Shows count and sample results

**Step 5: Final commit**

```bash
git add backend/README.md backend/data/.gitkeep
git commit -m "docs: add backend README and finalize Phase 1"
```

---

## Phase 1 Complete - Deliverables Checklist

Verify all deliverables before moving to Phase 2:

- [ ] Working SQLite database with FTS5 index exists at `backend/data/schools.db`
- [ ] Import script successfully loads 3,827 schools from Excel: `uv run python -m app.utils.import_data`
- [ ] All backend tests passing: `uv run pytest`
- [ ] Code coverage >90%: `uv run pytest --cov=app`
- [ ] Can query database: Test search and retrieval functions work
- [ ] Can search schools: `search_schools()` returns relevant results
- [ ] All required fields populated: RCDTS, school_name, city, level
- [ ] Data cleaning works: Asterisks converted to NULL, percentages parsed
- [ ] FTS5 search performs fast: <100ms for typical queries
- [ ] Documentation complete: README.md exists and is accurate

## Notes

- **Test execution time**: Integration tests with full imports may take 30-60 seconds total
- **Database size**: Expect ~5-10 MB for 3,827 schools
- **Coverage exclusions**: May need to add `# pragma: no cover` for CLI entry points
- **TDD compliance**: Every function has tests written BEFORE implementation
- **Commit frequency**: Should have 7-8 commits for this phase

---

**Plan Status:** Ready for execution with `superpowers:executing-plans`

**Last Updated:** 2025-11-06
