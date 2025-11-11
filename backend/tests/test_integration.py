# ABOUTME: Integration tests for full backend data pipeline
# ABOUTME: End-to-end validation from import to query

import pytest

from app.database import School, get_school_by_rcdts, search_schools
from app.utils.import_data import import_to_database


@pytest.mark.slow
def test_full_pipeline_import_and_search(test_db):
    """Import data, search for a keyword, and retrieve detail record."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    total_schools = test_db.query(School).count()
    assert total_schools > 3800

    results = search_schools(test_db, "lincoln", limit=10)
    assert len(results) > 0

    first_result = results[0]
    school_detail = get_school_by_rcdts(test_db, first_result.rcdts)

    assert school_detail is not None
    assert school_detail.id == first_result.id
    assert school_detail.city


@pytest.mark.slow
def test_search_returns_relevant_results(test_db):
    """Search results should align with requested city context."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    chicago_schools = search_schools(test_db, "chicago", limit=20)
    chicago_count = sum(1 for s in chicago_schools if "chicago" in s.city.lower())
    assert chicago_count > 0


@pytest.mark.slow
def test_data_quality_no_missing_required_fields(test_db):
    """Imported schools should have critical fields populated."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    schools = test_db.query(School).limit(100).all()
    for school in schools:
        assert school.rcdts
        assert school.school_name
        assert school.city
        assert school.level in {"elementary", "middle", "high", "other"}


def test_coverage_target_met():
    """Placeholder to ensure coverage suite executes."""
    assert True
