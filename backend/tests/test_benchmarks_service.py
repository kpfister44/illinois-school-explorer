# ABOUTME: Tests for the benchmark service: state and district averages, percentiles, similar schools
# ABOUTME: Real figures are re-derived with SQL from the committed schools.db; matching rules use small made-up sets

import math

import pytest
from sqlalchemy import text

from app.database import School
from app.services.benchmarks import Benchmarks

ELK_GROVE = "05-016-2140-17-0002"
ALWOOD_6_TO_12 = "28-037-2250-26-0001"
A_C_CENTRAL_ELEMENTARY = "01-009-2620-26-2001"
SEYMOUR_HIGH = "01-001-0010-26-0001"
ELEMENTARY_WITHOUT_LOW_INCOME = "34-049-1060-02-2001"

ACT = "(act_ela_avg + act_math_avg) / 2"


@pytest.fixture
def benchmarks(committed_db) -> Benchmarks:
    return Benchmarks(committed_db)


def scalar(db, sql: str, **params):
    return db.execute(text(sql), params).scalar()


def test_state_average_is_the_mean_of_same_level_schools_reporting_the_metric(
    benchmarks, committed_db
):
    act = benchmarks.for_school(ELK_GROVE).act

    assert act.level == "high"
    assert act.state_schools == scalar(
        committed_db, f"SELECT COUNT({ACT}) FROM schools WHERE level = 'high'"
    )
    assert act.state_average == pytest.approx(
        scalar(committed_db, f"SELECT AVG({ACT}) FROM schools WHERE level = 'high'"), abs=0.005
    )
    assert round(act.state_average, 1) == 17.6


def test_district_average_covers_same_level_schools_in_the_district(benchmarks, committed_db):
    act = benchmarks.for_school(ELK_GROVE).act

    assert act.district_schools == 6
    assert act.district_average == pytest.approx(
        scalar(
            committed_db,
            f"SELECT AVG({ACT}) FROM schools WHERE level = 'high' AND rcdts LIKE '05-016-2140-17-%'",
        ),
        abs=0.005,
    )
    assert round(act.district_average, 1) == 20.5


def test_district_average_needs_three_schools(benchmarks):
    act = benchmarks.for_school(SEYMOUR_HIGH).act

    assert act.district_schools == 1
    assert act.district_average is None


def test_percentile_is_the_share_of_same_level_schools_with_a_lower_value(
    benchmarks, committed_db
):
    act = benchmarks.for_school(ELK_GROVE).act

    lower = scalar(
        committed_db,
        f"SELECT COUNT(*) FROM schools WHERE level = 'high' AND {ACT} < "
        f"(SELECT {ACT} FROM schools WHERE rcdts = :rcdts)",
        rcdts=ELK_GROVE,
    )
    assert act.percentile == round(100 * lower / act.state_schools)
    assert act.percentile == 64


def test_demographics_get_averages_but_no_percentile_or_similar_schools(benchmarks, committed_db):
    school = benchmarks.for_school(ELK_GROVE)

    assert school.el.state_average == pytest.approx(
        scalar(committed_db, "SELECT AVG(el_percentage) FROM schools WHERE level = 'high'"),
        abs=0.005,
    )
    assert school.low_income.state_average == pytest.approx(
        scalar(
            committed_db, "SELECT AVG(low_income_percentage) FROM schools WHERE level = 'high'"
        ),
        abs=0.005,
    )
    for demographic in (school.el, school.low_income):
        assert demographic.level == "high"
        assert demographic.percentile is None
        assert demographic.similar_average is None


def test_suppressed_demographic_still_gets_the_state_average(benchmarks):
    school = benchmarks.for_school(A_C_CENTRAL_ELEMENTARY)

    assert school.el.level == "elementary"
    assert school.el.state_average is not None


def test_school_without_a_test_gets_no_benchmark_for_it(benchmarks):
    school = benchmarks.for_school(A_C_CENTRAL_ELEMENTARY)

    assert school.act is None
    assert school.iar.level == "elementary"


def test_iar_at_a_high_school_is_compared_with_middle_schools(benchmarks, committed_db):
    school = benchmarks.for_school(ALWOOD_6_TO_12)

    assert school.act.level == "high"
    assert school.iar.level == "middle"
    assert school.iar.state_schools == scalar(
        committed_db,
        "SELECT COUNT(iar_overall_proficiency_pct) FROM schools WHERE level = 'middle'",
    )
    lower = scalar(
        committed_db,
        "SELECT COUNT(*) FROM schools WHERE level = 'middle' AND iar_overall_proficiency_pct < "
        "(SELECT iar_overall_proficiency_pct FROM schools WHERE rcdts = :rcdts)",
        rcdts=ALWOOD_6_TO_12,
    )
    assert school.iar.percentile == round(100 * lower / school.iar.state_schools)


def test_unknown_school_has_no_benchmarks(benchmarks):
    assert benchmarks.for_school("99-999-9999-99-9999") is None
    assert benchmarks.similar("99-999-9999-99-9999", "act") is None


def test_similar_schools_are_25_other_schools_of_the_compared_level(benchmarks, committed_db):
    similar = benchmarks.similar(ELK_GROVE, "act")

    assert similar.assessment == "act"
    assert similar.level == "high"
    assert len(similar.schools) == 25
    rcdts_codes = [school.rcdts for school in similar.schools]
    assert ELK_GROVE not in rcdts_codes
    assert len(set(rcdts_codes)) == 25
    for school in similar.schools:
        level = scalar(
            committed_db, "SELECT level FROM schools WHERE rcdts = :rcdts", rcdts=school.rcdts
        )
        assert level == "high"
        assert school.score is not None


def test_similar_average_is_the_mean_score_of_the_similar_schools(benchmarks):
    similar = benchmarks.similar(ELK_GROVE, "act")
    mean = sum(school.score for school in similar.schools) / len(similar.schools)

    assert similar.average == pytest.approx(mean, abs=0.01)
    assert benchmarks.for_school(ELK_GROVE).act.similar_average == similar.average


def test_similar_schools_for_iar_at_a_high_school_are_middle_schools(benchmarks, committed_db):
    similar = benchmarks.similar(ALWOOD_6_TO_12, "iar")

    assert similar.level == "middle"
    assert len(similar.schools) == 25
    for school in similar.schools:
        level = scalar(
            committed_db, "SELECT level FROM schools WHERE rcdts = :rcdts", rcdts=school.rcdts
        )
        assert level == "middle"


def test_school_without_low_income_share_has_no_similar_schools(benchmarks):
    similar = benchmarks.similar(ELEMENTARY_WITHOUT_LOW_INCOME, "iar")

    assert similar.schools == []
    assert similar.average is None
    assert benchmarks.for_school(ELEMENTARY_WITHOUT_LOW_INCOME).iar.similar_average is None


def test_state_series_averages_each_year_and_skips_years_without_data(benchmarks, committed_db):
    state = benchmarks.state("act", "high")
    by_year = {point.year: point for point in state.years}

    assert 2018 not in by_year
    assert 2020 not in by_year
    assert by_year[2015].average == pytest.approx(
        scalar(committed_db, "SELECT AVG(act_hist_2015) FROM schools WHERE level = 'high'"),
        abs=0.005,
    )
    assert by_year[2015].schools == scalar(
        committed_db, "SELECT COUNT(act_hist_2015) FROM schools WHERE level = 'high'"
    )
    assert [point.year for point in state.years] == sorted(by_year)


def test_state_series_ends_on_the_average_shown_on_the_school(benchmarks):
    state = benchmarks.state("act", "high")
    act = benchmarks.for_school(ELK_GROVE).act

    assert state.years[-1].year == 2026
    assert state.years[-1].average == act.state_average
    assert state.schools == act.state_schools


def test_state_band_runs_from_the_10th_to_the_90th_percentile(benchmarks):
    state = benchmarks.state("act", "high")

    assert state.band_low == pytest.approx(14.2, abs=0.05)
    assert state.band_high == pytest.approx(20.7, abs=0.05)


def test_state_series_for_iar_covers_the_two_comparable_years(benchmarks):
    state = benchmarks.state("iar", "middle")

    assert [point.year for point in state.years] == [2025, 2026]


def test_state_benchmark_for_a_level_that_does_not_report_the_metric(benchmarks):
    state = benchmarks.state("iar", "other")

    assert state.schools == 0
    assert state.years == []
    assert state.band_low is None
    assert state.band_high is None


def high_school(idx: int, **overrides) -> School:
    values = dict(
        rcdts=f"11-111-{idx:04d}-11-0001",
        school_name=f"School {idx}",
        city="Normal",
        level="high",
        student_enrollment=1000,
        low_income_percentage=50.0,
        el_percentage=10.0,
        act_ela_avg=20.0,
        act_math_avg=20.0,
    )
    values.update(overrides)
    return School(**values)


def test_similar_schools_are_the_nearest_by_low_income_share(test_db):
    test_db.add_all(
        [high_school(0)]
        + [high_school(idx, low_income_percentage=50.0 + idx) for idx in range(1, 31)]
    )
    test_db.commit()

    similar = Benchmarks(test_db).similar("11-111-0000-11-0001", "act")

    assert [school.school_name for school in similar.schools] == [
        f"School {idx}" for idx in range(1, 26)
    ]


def test_similar_schools_treat_suppressed_english_learner_share_as_zero(test_db):
    test_db.add_all(
        [high_school(0, el_percentage=None)]
        + [high_school(idx, el_percentage=float(idx)) for idx in range(1, 31)]
    )
    test_db.commit()

    similar = Benchmarks(test_db).similar("11-111-0000-11-0001", "act")

    assert [school.school_name for school in similar.schools] == [
        f"School {idx}" for idx in range(1, 26)
    ]


def test_similar_schools_compare_enrollment_on_a_log_scale(test_db):
    """Half the size and double the size are equally far away; 500 more students is nearer."""
    test_db.add_all(
        [
            high_school(0, student_enrollment=1000),
            high_school(1, student_enrollment=1500),
            high_school(2, student_enrollment=2000),
            high_school(3, student_enrollment=400),
        ]
    )
    test_db.commit()

    similar = Benchmarks(test_db).similar("11-111-0000-11-0001", "act")

    assert math.log(1000 / 400) > math.log(2000 / 1000)
    assert [school.school_name for school in similar.schools] == [
        "School 1",
        "School 2",
        "School 3",
    ]


def test_similar_schools_weigh_each_factor_by_its_spread(test_db):
    """A 4-point gap counts for less where shares vary widely than where they barely vary."""
    test_db.add_all(
        [
            high_school(0, low_income_percentage=50.0, el_percentage=10.0),
            high_school(1, low_income_percentage=54.0, el_percentage=10.0),
            high_school(2, low_income_percentage=50.0, el_percentage=14.0),
            high_school(3, low_income_percentage=5.0, el_percentage=12.0),
            high_school(4, low_income_percentage=95.0, el_percentage=12.0),
        ]
    )
    test_db.commit()

    similar = Benchmarks(test_db).similar("11-111-0000-11-0001", "act")

    assert [school.school_name for school in similar.schools] == [
        "School 1",
        "School 3",
        "School 4",
        "School 2",
    ]


def test_similar_schools_leave_out_schools_without_a_score_or_of_another_level(test_db):
    test_db.add_all(
        [
            high_school(0),
            high_school(1, act_ela_avg=None, act_math_avg=None),
            high_school(2, level="middle"),
            high_school(3, low_income_percentage=None),
            high_school(4, low_income_percentage=70.0, act_ela_avg=18.0, act_math_avg=19.0),
        ]
    )
    test_db.commit()

    similar = Benchmarks(test_db).similar("11-111-0000-11-0001", "act")

    assert [school.school_name for school in similar.schools] == ["School 4"]
    assert similar.schools[0].score == 18.5
    assert similar.average == 18.5
