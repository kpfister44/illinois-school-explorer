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
