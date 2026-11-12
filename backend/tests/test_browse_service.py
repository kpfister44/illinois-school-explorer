# ABOUTME: Tests for the browse service against the committed schools.db
# ABOUTME: Re-derives list totals, district figures and place counts with SQL from the real data

import pytest
from sqlalchemy import text

from app.services.benchmarks import Benchmarks
from app.services.browse import (
    SchoolFilters,
    district_detail,
    list_cities,
    list_districts,
    list_schools,
)

HSD_214 = "05-016-2140-17"
CHICAGO_299 = "15-016-2990-25"

ACT = "(act_ela_avg + act_math_avg) / 2"


@pytest.fixture
def benchmarks(committed_db) -> Benchmarks:
    return Benchmarks(committed_db)


def scalar(db, sql: str, **params):
    return db.execute(text(sql), params).scalar()


def test_unfiltered_list_counts_every_school(benchmarks, committed_db):
    page = list_schools(benchmarks, SchoolFilters(), sort=None, descending=False, limit=25, offset=0)

    assert page.total == scalar(committed_db, "SELECT COUNT(*) FROM schools")
    assert len(page.results) == 25


def test_city_filter_matches_the_schools_of_that_city(benchmarks, committed_db):
    page = list_schools(
        benchmarks,
        SchoolFilters(city="Elk Grove Village"),
        sort=None,
        descending=False,
        limit=100,
        offset=0,
    )

    assert page.total == scalar(
        committed_db, "SELECT COUNT(*) FROM schools WHERE lower(city) = 'elk grove village'"
    )
    elk_grove = next(row for row in page.results if row.rcdts == f"{HSD_214}-0002")
    assert (elk_grove.assessment, round(elk_grove.score, 1)) == ("act", 18.1)
    assert elk_grove.grades_served == "9 - 12"
    assert elk_grove.designation == "Approaching Exemplary"


def test_range_and_designation_filters_match_sql(benchmarks, committed_db):
    page = list_schools(
        benchmarks,
        SchoolFilters(
            level="elementary",
            county="Cook",
            designation="Exemplary",
            enrollment_min=300,
            low_income_max=20,
        ),
        sort="score",
        descending=True,
        limit=100,
        offset=0,
    )

    assert page.total == scalar(
        committed_db,
        """
        SELECT COUNT(*) FROM schools
        WHERE level = 'elementary' AND county = 'Cook' AND designation = 'Exemplary'
          AND student_enrollment >= 300 AND low_income_percentage <= 20
        """,
    )
    scores = [row.score for row in page.results if row.score is not None]
    assert scores == sorted(scores, reverse=True)


def test_district_summary_and_averages_for_a_high_school_district(benchmarks, committed_db):
    district = district_detail(benchmarks, HSD_214)

    assert district.name == "Township HSD 214"
    assert district.county == "Cook"
    assert district.school_count == scalar(
        committed_db, "SELECT COUNT(*) FROM schools WHERE rcdts LIKE :code", code=f"{HSD_214}-%"
    )
    assert district.enrollment == scalar(
        committed_db,
        "SELECT SUM(student_enrollment) FROM schools WHERE rcdts LIKE :code",
        code=f"{HSD_214}-%",
    )
    high = next(level for level in district.levels if level.level == "high")
    assert high.assessment == "act"
    assert round(high.district_average, 1) == 20.5
    assert round(high.state_average, 1) == 17.6
    assert high.schools[0].display_name == "John Hersey High School"


def test_district_averages_match_the_benchmarks_on_its_schools(benchmarks):
    district = district_detail(benchmarks, HSD_214)
    high = next(level for level in district.levels if level.level == "high")
    act = benchmarks.for_school(f"{HSD_214}-0002").act

    assert high.district_average == act.district_average
    assert high.state_average == act.state_average


def test_largest_district_lists_every_school_once(benchmarks, committed_db):
    district = district_detail(benchmarks, CHICAGO_299)
    listed = [school.rcdts for level in district.levels for school in level.schools]

    assert len(listed) == len(set(listed)) == district.school_count
    assert district.school_count == scalar(
        committed_db, "SELECT COUNT(*) FROM schools WHERE rcdts LIKE :code", code=f"{CHICAGO_299}-%"
    )


def test_district_and_city_lists_match_the_stats_counts(benchmarks, committed_db):
    districts = list_districts(benchmarks)
    cities = list_cities(benchmarks)

    assert len(districts) == scalar(
        committed_db, "SELECT COUNT(DISTINCT substr(rcdts, 1, 14)) FROM schools"
    )
    assert len(cities) == scalar(
        committed_db, "SELECT COUNT(DISTINCT lower(trim(city))) FROM schools"
    )
    total = scalar(committed_db, "SELECT COUNT(*) FROM schools")
    assert sum(district.school_count for district in districts) == total
    assert sum(city.school_count for city in cities) == total
