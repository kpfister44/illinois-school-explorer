# ABOUTME: Tests for /api/top-scores endpoint behavior
# ABOUTME: Validates ranking response and query validation for top scores API

from app.database import School


def create_school(idx: int, **overrides) -> School:
    defaults = dict(
        rcdts=f"11-111-1111-11-{idx:04d}",
        school_name=f"School {idx}",
        city="Chicago",
        district="District",
        school_type="High School",
        level="high",
        student_enrollment=900,
        act_ela_avg=22.0 + idx,
        act_math_avg=23.0 + idx,
        iar_overall_proficiency_pct=60.0 + idx,
    )
    defaults.update(overrides)
    return School(**defaults)


def test_top_scores_returns_ranked_list(client, test_db):
    test_db.add_all([create_school(1), create_school(2), create_school(3)])
    test_db.commit()

    response = client.get("/api/top-scores?assessment=act&level=high&limit=2")
    assert response.status_code == 200

    payload = response.json()
    assert len(payload["results"]) == 2
    assert payload["results"][0]["rank"] == 1
    assert payload["results"][0]["score"] > payload["results"][1]["score"]
    assert "act_ela_avg" in payload["results"][0]
    assert "act_math_avg" in payload["results"][0]


def test_top_scores_validates_query_params(client):
    response = client.get("/api/top-scores?assessment=act")
    assert response.status_code == 422

    response = client.get("/api/top-scores?assessment=sat&level=high")
    assert response.status_code == 422


def test_top_scores_counts_ranked_schools_and_carries_context(client, test_db):
    test_db.add_all(
        [
            create_school(1, low_income_percentage=40.0, designation="Commendable"),
            create_school(2),
            create_school(3),
        ]
    )
    test_db.commit()

    payload = client.get("/api/top-scores?assessment=act&level=high&limit=1").json()

    assert payload["total"] == 3
    assert payload["school"] is None
    last = client.get("/api/top-scores?assessment=act&level=high").json()["results"][-1]
    assert last["display_name"] == "School 1"
    assert last["low_income_percentage"] == 40.0
    assert last["designation"] == "Commendable"
    assert last["district_id"] == "11-111-1111-11"


def test_top_scores_narrows_to_a_county_or_district(client, test_db):
    test_db.add_all(
        [
            create_school(1, county="Cook"),
            create_school(2, county="Lake"),
            create_school(3, rcdts="22-222-2222-22-0003", county="Lake"),
        ]
    )
    test_db.commit()

    by_county = client.get("/api/top-scores?assessment=act&level=high&county=Lake").json()
    by_district = client.get(
        "/api/top-scores?assessment=act&level=high&district=11-111-1111-11"
    ).json()

    assert [row["rcdts"] for row in by_county["results"]] == [
        "22-222-2222-22-0003",
        "11-111-1111-11-0002",
    ]
    assert [row["rank"] for row in by_county["results"]] == [1, 2]
    assert by_district["total"] == 2


def test_top_scores_looks_up_one_school(client, test_db):
    test_db.add_all([create_school(1), create_school(2), create_school(3)])
    test_db.commit()

    payload = client.get(
        "/api/top-scores?assessment=act&level=high&limit=1&school=11-111-1111-11-0001"
    ).json()

    assert payload["school"]["rcdts"] == "11-111-1111-11-0001"
    assert payload["school"]["rank"] == 3
