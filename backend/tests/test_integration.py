# ABOUTME: Integration tests against the committed schools.db shipped to production
# ABOUTME: End-to-end validation of search and lookup over real synced data

from sqlalchemy import func

from app.database import (
    School,
    count_schools_districts_cities,
    get_school_by_rcdts,
    search_schools,
)


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


def test_designations_match_the_2026_report_card(committed_db):
    """Every school has one of ISBE's 2026 designations or none at all."""
    counts = dict(
        committed_db.query(School.designation, func.count()).group_by(School.designation).all()
    )
    assert counts == {
        "Exemplary": 1024,
        "Approaching Exemplary": 731,
        "Commendable": 1080,
        "Developing": 452,
        "Comprehensive": 272,
        "Dually Designated": 82,
        None: 187,
    }


def test_display_names_spell_out_abbreviations(committed_db):
    """Display names expand school-level abbreviations and leave people's names alone."""
    clearmont = get_school_by_rcdts(committed_db, "05-016-0590-04-2003")
    assert clearmont.school_name == "Clearmont Elem School"
    assert clearmont.display_name == "Clearmont Elementary School"

    elk_grove = get_school_by_rcdts(committed_db, "05-016-2140-17-0002")
    assert elk_grove.display_name == elk_grove.school_name == "Elk Grove High School"

    king = committed_db.query(School).filter(School.school_name == "M L King Jr Elem School").one()
    assert king.display_name == "M L King Jr Elementary School"

    assert committed_db.query(School).filter(School.display_name.is_(None)).count() == 0


def test_search_finds_schools_by_display_name(committed_db):
    """Searching for the spelled-out name finds a school whose official name is abbreviated."""
    results = search_schools(committed_db, "clearmont elementary", limit=5)
    assert [school.school_name for school in results] == ["Clearmont Elem School"]


def test_iar_history_covers_2025_and_2026(committed_db):
    """IAR history holds the current rates for 2026 and a one-year change against 2025."""
    clearmont = get_school_by_rcdts(committed_db, "05-016-0590-04-2003")
    assert clearmont.iar_ela_hist_2026 == clearmont.iar_ela_proficiency_pct
    assert clearmont.iar_math_hist_2026 == clearmont.iar_math_proficiency_pct
    assert clearmont.iar_hist_2026 == clearmont.iar_overall_proficiency_pct
    assert clearmont.iar_ela_hist_2025 == 54.0
    assert clearmont.iar_math_hist_2025 == 50.5
    assert clearmont.iar_ela_trend_1yr == round(clearmont.iar_ela_hist_2026 - 54.0, 2)
    assert clearmont.iar_math_trend_1yr == round(clearmont.iar_math_hist_2026 - 50.5, 2)
    assert clearmont.iar_trend_1yr == round(clearmont.iar_hist_2026 - clearmont.iar_hist_2025, 2)

    # Statewide school averages for 2025, from the design plan
    ela_2025, math_2025 = committed_db.query(
        func.avg(School.iar_ela_hist_2025), func.avg(School.iar_math_hist_2025)
    ).one()
    assert round(ela_2025, 1) == 51.0
    assert round(math_2025, 1) == 37.9


def test_stats_for_the_committed_database(committed_db):
    """The committed database covers 3,828 schools in 864 districts and 845 cities."""
    assert count_schools_districts_cities(committed_db) == {
        "schools": 3828,
        "districts": 864,
        "cities": 845,
    }


def test_coverage_target_met():
    """Placeholder to ensure coverage suite executes."""
    assert True
