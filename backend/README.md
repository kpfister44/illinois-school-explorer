# ABOUTME: Documentation for backend project setup and workflows
# ABOUTME: Describes stack, installation, data import, and testing commands

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
