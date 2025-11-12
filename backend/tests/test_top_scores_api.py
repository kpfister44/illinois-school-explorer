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
