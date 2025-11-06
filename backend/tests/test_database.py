# ABOUTME: Tests for database models and CRUD operations
# ABOUTME: Validates School model, FTS search, and data integrity

from pathlib import Path

import pytest
from sqlalchemy import text

from app.database import Base, School, get_db, init_db, engine


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


def test_fts_search_by_school_name(test_db, test_engine):
    """Test FTS5 search finds schools by name."""
    schools = [
        School(rcdts="01", school_name="Elk Grove High School", city="Elk Grove", level="School"),
        School(rcdts="02", school_name="Grove Elementary", city="Oak Park", level="School"),
        School(rcdts="03", school_name="Lincoln High School", city="Springfield", level="School"),
    ]
    test_db.add_all(schools)
    test_db.commit()

    results = test_db.execute(
        text(
            """
            SELECT s.* FROM schools s
            JOIN schools_fts ON s.id = schools_fts.rowid
            WHERE schools_fts MATCH 'grove'
            ORDER BY rank
            """
        )
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
        text(
            """
            SELECT s.* FROM schools s
            JOIN schools_fts ON s.id = schools_fts.rowid
            WHERE schools_fts MATCH 'chicago'
            """
        )
    ).fetchall()

    assert len(results) == 1


def test_school_repr():
    """Test School __repr__ includes key fields."""
    school = School(
        rcdts="TEST",
        school_name="Test School",
        city="Chicago",
        level="School"
    )

    representation = repr(school)

    assert "TEST" in representation
    assert "Test School" in representation
    assert "Chicago" in representation


def test_get_db_generator_closes_session(monkeypatch):
    """Test get_db yields a session and closes it after iteration."""

    class DummySession:
        def __init__(self):
            self.closed = False

        def close(self):
            self.closed = True

    dummy_session = DummySession()

    def dummy_sessionlocal():
        return dummy_session

    monkeypatch.setattr("app.database.SessionLocal", dummy_sessionlocal)

    db_generator = get_db()
    session = next(db_generator)

    assert session is dummy_session

    with pytest.raises(StopIteration):
        next(db_generator)

    assert dummy_session.closed


def test_init_db_creates_tables_and_fts(tmp_path):
    """Test init_db initializes tables and FTS index on disk database."""
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)

    init_db()

    with engine.connect() as conn:
        tables = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='schools'")
        ).fetchall()
        fts_tables = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='schools_fts'")
        ).fetchall()

    assert tables
    assert fts_tables
