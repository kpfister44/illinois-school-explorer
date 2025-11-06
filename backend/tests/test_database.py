# ABOUTME: Tests for database models and CRUD operations
# ABOUTME: Validates School model, FTS search, and data integrity

from sqlalchemy import text

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
