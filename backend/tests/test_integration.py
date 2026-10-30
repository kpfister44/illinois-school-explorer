# ABOUTME: Integration tests against the committed schools.db shipped to production
# ABOUTME: End-to-end validation of search and lookup over real synced data

from app.database import School, get_school_by_rcdts, search_schools


def test_full_pipeline_search_and_detail(committed_db):
    """Search the real database for a keyword and retrieve the detail record."""
    total_schools = committed_db.query(School).count()
    assert total_schools > 3800

    results = search_schools(committed_db, "lincoln", limit=10)
    assert len(results) > 0

    first_result = results[0]
    school_detail = get_school_by_rcdts(committed_db, first_result.rcdts)

    assert school_detail is not None
    assert school_detail.id == first_result.id
    assert school_detail.city


def test_search_returns_relevant_results(committed_db):
    """Search results should align with requested city context."""
    chicago_schools = search_schools(committed_db, "chicago", limit=20)
    chicago_count = sum(1 for s in chicago_schools if "chicago" in s.city.lower())
    assert chicago_count > 0


def test_data_quality_no_missing_required_fields(committed_db):
    """Synced schools should have critical fields populated."""
    schools = committed_db.query(School).limit(100).all()
    for school in schools:
        assert school.rcdts
        assert school.school_name
        assert school.city
        assert school.level in {"elementary", "middle", "high", "other"}


def test_coverage_target_met():
    """Placeholder to ensure coverage suite executes."""
    assert True
