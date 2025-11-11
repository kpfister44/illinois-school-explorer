# ABOUTME: Tests for top score ranking service logic
# ABOUTME: Validates ranking, filtering, and scoring for ACT/IAR queries

from app.database import School
from app.services.top_scores import fetch_top_scores


def seed_school(**overrides):
    defaults = dict(
        rcdts="11-111-1111-11-{idx:04d}".format(idx=overrides.pop("idx", 1)),
        school_name="Test School",
        city="Normal",
        district="District",
        level="high",
        school_type="High School",
        student_enrollment=800,
        act_ela_avg=20.0,
        act_math_avg=21.0,
        iar_overall_proficiency_pct=None,
    )
    defaults.update(overrides)
    return School(**defaults)


def test_fetch_top_scores_orders_by_metric(test_db):
    schools = [
        seed_school(idx=1, act_ela_avg=18, act_math_avg=18),
        seed_school(idx=2, act_ela_avg=25, act_math_avg=25),
        seed_school(idx=3, act_ela_avg=22, act_math_avg=22),
    ]
    test_db.add_all(schools)
    test_db.commit()

    results = fetch_top_scores(test_db, assessment="act", level="high", limit=2)

    assert [row.rank for row in results] == [1, 2]
    assert results[0].school_name == schools[1].school_name
    assert results[0].score == 25.0


def test_fetch_top_scores_filters_by_level_and_null_scores(test_db):
    test_db.add_all(
        [
            seed_school(idx=1, level="high", act_ela_avg=24, act_math_avg=24),
            seed_school(
                idx=2,
                level="middle",
                school_type="Middle School",
                act_ela_avg=None,
                act_math_avg=None,
                iar_overall_proficiency_pct=60.0,
            ),
        ]
    )
    test_db.commit()

    results = fetch_top_scores(test_db, assessment="iar", level="middle", limit=5)

    assert len(results) == 1
    assert results[0].level == "middle"
    assert results[0].score == 60.0
