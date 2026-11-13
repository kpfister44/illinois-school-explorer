# ABOUTME: Tests for top score ranking service logic
# ABOUTME: Validates ranking, filtering, and scoring for ACT/IAR queries

from sqlalchemy import text

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

    results = fetch_top_scores(test_db, assessment="act", level="high", limit=2).results

    assert [row.rank for row in results] == [1, 2]
    assert results[0].school_name == schools[1].school_name
    assert results[0].score == 25.0
    assert results[0].act_ela_avg == 25
    assert results[0].act_math_avg == 25


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

    results = fetch_top_scores(test_db, assessment="iar", level="middle", limit=5).results

    assert len(results) == 1
    assert results[0].level == "middle"
    assert results[0].score == 60.0
    assert results[0].act_ela_avg is None
    assert results[0].act_math_avg is None


def test_tied_schools_share_a_rank_and_are_listed_by_name(test_db):
    test_db.add_all(
        [
            seed_school(idx=1, display_name="Delta High School", act_ela_avg=18, act_math_avg=18),
            seed_school(idx=2, display_name="Alpha High School", act_ela_avg=25, act_math_avg=25),
            seed_school(idx=3, display_name="Charlie High School", act_ela_avg=22, act_math_avg=22),
            seed_school(idx=4, display_name="Bravo High School", act_ela_avg=21, act_math_avg=23),
        ]
    )
    test_db.commit()

    ranking = fetch_top_scores(test_db, assessment="act", level="high")

    assert [(row.rank, row.display_name) for row in ranking.results] == [
        (1, "Alpha High School"),
        (2, "Bravo High School"),
        (2, "Charlie High School"),
        (4, "Delta High School"),
    ]


def test_total_counts_every_ranked_school_beyond_the_limit(test_db):
    test_db.add_all([seed_school(idx=idx, act_ela_avg=15 + idx) for idx in range(1, 6)])
    test_db.add(seed_school(idx=6, act_ela_avg=None))
    test_db.commit()

    ranking = fetch_top_scores(test_db, assessment="act", level="high", limit=2)

    assert len(ranking.results) == 2
    assert ranking.total == 5


def test_entries_carry_context_for_each_school(test_db):
    test_db.add(
        seed_school(
            idx=7,
            school_name="Test Elem Sch",
            display_name="Test Elementary School",
            county="Dupage",
            low_income_percentage=12.5,
            designation="Exemplary",
        )
    )
    test_db.commit()

    entry = fetch_top_scores(test_db, assessment="act", level="high").results[0]

    assert entry.display_name == "Test Elementary School"
    assert entry.county == "Dupage"
    assert entry.district_id == "11-111-1111-11"
    assert entry.low_income_percentage == 12.5
    assert entry.designation == "Exemplary"


def test_county_ranks_restart_within_the_county(test_db):
    test_db.add_all(
        [
            seed_school(idx=1, county="Cook", act_ela_avg=28, act_math_avg=28),
            seed_school(idx=2, county="Dupage", act_ela_avg=24, act_math_avg=24),
            seed_school(idx=3, county="Dupage", act_ela_avg=20, act_math_avg=20),
        ]
    )
    test_db.commit()

    ranking = fetch_top_scores(test_db, assessment="act", level="high", county=" dupage ")

    assert [(row.rank, row.rcdts) for row in ranking.results] == [
        (1, "11-111-1111-11-0002"),
        (2, "11-111-1111-11-0003"),
    ]
    assert ranking.total == 2


def test_district_is_the_district_portion_of_the_rcdts_code(test_db):
    test_db.add_all(
        [
            seed_school(idx=1, act_ela_avg=28, act_math_avg=28),
            seed_school(rcdts="22-222-2222-22-0001", act_ela_avg=26, act_math_avg=26),
        ]
    )
    test_db.commit()

    ranking = fetch_top_scores(
        test_db, assessment="act", level="high", district="22-222-2222-22"
    )

    assert [(row.rank, row.rcdts) for row in ranking.results] == [(1, "22-222-2222-22-0001")]


def test_looks_up_a_school_ranked_below_the_limit(test_db):
    test_db.add_all([seed_school(idx=idx, act_ela_avg=30 - idx) for idx in range(1, 6)])
    test_db.commit()

    ranking = fetch_top_scores(
        test_db, assessment="act", level="high", limit=2, school="11-111-1111-11-0004"
    )

    assert ranking.school is not None
    assert ranking.school.rank == 4
    assert ranking.school.rcdts == "11-111-1111-11-0004"


def test_lookup_of_a_school_outside_the_ranking_finds_nothing(test_db):
    test_db.add_all(
        [
            seed_school(idx=1, county="Cook"),
            seed_school(idx=2, county="Dupage"),
            seed_school(idx=3, act_ela_avg=None),
        ]
    )
    test_db.commit()

    in_other_county = fetch_top_scores(
        test_db, assessment="act", level="high", county="Cook", school="11-111-1111-11-0002"
    )
    without_score = fetch_top_scores(
        test_db, assessment="act", level="high", school="11-111-1111-11-0003"
    )
    not_asked = fetch_top_scores(test_db, assessment="act", level="high")

    assert in_other_county.school is None
    assert without_score.school is None
    assert not_asked.school is None


def test_elk_grove_rank_counts_the_high_schools_scoring_higher(committed_db):
    elk_grove = "05-016-2140-17-0002"
    score = "(act_ela_avg + act_math_avg) / 2"
    higher = committed_db.execute(
        text(
            f"SELECT COUNT(*) FROM schools WHERE level = 'high' AND {score} > "
            f"(SELECT ROUND({score}, 2) FROM schools WHERE rcdts = :rcdts) + 0.001"
        ),
        {"rcdts": elk_grove},
    ).scalar()
    ranked = committed_db.execute(
        text(f"SELECT COUNT({score}) FROM schools WHERE level = 'high'")
    ).scalar()

    ranking = fetch_top_scores(committed_db, assessment="act", level="high", school=elk_grove)

    assert ranking.school.rank == higher + 1
    assert ranking.total == ranked
