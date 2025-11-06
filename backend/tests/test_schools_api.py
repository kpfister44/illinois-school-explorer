# ABOUTME: Tests for /api/schools endpoints (detail and compare)
# ABOUTME: Validates school retrieval, metrics formatting, and error handling

from unittest.mock import patch

from sqlalchemy.exc import OperationalError

from app.database import School


def test_get_school_detail_returns_full_info(client, test_db):
    """GET /api/schools/{rcdts} returns complete school details."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        county="Cook",
        school_type="High School",
        level="School",
        grades_served="9-12",
        student_enrollment=1775,
        el_percentage=29.0,
        low_income_percentage=38.4,
        act_ela_avg=17.7,
        act_math_avg=18.2,
        act_science_avg=18.9,
        pct_white=36.8,
        pct_hispanic=48.3,
        pct_asian=8.7,
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0002")

    assert response.status_code == 200
    data = response.json()
    assert data["school_name"] == "Elk Grove High School"
    assert data["grades_served"] == "9-12"
    assert data["metrics"]["enrollment"] == 1775
    assert data["metrics"]["act"]["ela_avg"] == 17.7
    assert data["metrics"]["act"]["overall_avg"] == 17.95
    assert data["metrics"]["demographics"]["el_percentage"] == 29.0
    assert data["metrics"]["diversity"]["white"] == 36.8


def test_get_school_detail_returns_404_when_not_found(client):
    """GET /api/schools/{rcdts} returns 404 for non-existent school."""
    response = client.get("/api/schools/99-999-9999-99-9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "School not found"


def test_get_school_detail_handles_null_act_scores(client, test_db):
    """GET /api/schools/{rcdts} handles schools with no ACT data."""
    school = School(
        rcdts="05-016-2140-17-0003",
        school_name="Elementary School",
        city="Chicago",
        level="School",
        student_enrollment=500,
        act_ela_avg=None,
        act_math_avg=None,
        act_science_avg=None,
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0003")

    assert response.status_code == 200
    data = response.json()
    assert data["metrics"]["act"] is None


def test_get_school_detail_shows_null_for_suppressed_data(client, test_db):
    """GET /api/schools/{rcdts} returns null for suppressed metrics."""
    school = School(
        rcdts="05-016-2140-17-0004",
        school_name="Small School",
        city="Rural Town",
        level="School",
        student_enrollment=25,
        pct_white=None,
        pct_black=None,
        pct_hispanic=None,
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/schools/05-016-2140-17-0004")

    assert response.status_code == 200
    data = response.json()
    assert data["metrics"]["diversity"]["white"] is None
    assert data["metrics"]["diversity"]["black"] is None


def test_compare_schools_returns_multiple_schools(client, test_db):
    """GET /api/schools/compare returns details for multiple schools."""
    school1 = School(
        rcdts="05-016-2140-17-0001",
        school_name="School A",
        city="Chicago",
        level="School",
        student_enrollment=1000,
        act_ela_avg=20.0,
        act_math_avg=21.0,
    )
    school2 = School(
        rcdts="05-016-2140-17-0002",
        school_name="School B",
        city="Springfield",
        level="School",
        student_enrollment=500,
        act_ela_avg=18.0,
        act_math_avg=19.0,
    )
    test_db.add_all([school1, school2])
    test_db.commit()

    response = client.get(
        "/api/schools/compare?rcdts=05-016-2140-17-0001,05-016-2140-17-0002"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 2
    assert data["schools"][0]["school_name"] == "School A"
    assert data["schools"][1]["school_name"] == "School B"
    assert data["schools"][0]["metrics"]["enrollment"] == 1000
    assert data["schools"][1]["metrics"]["act"]["overall_avg"] == 18.5


def test_compare_schools_requires_2_to_5_schools(client):
    """GET /api/schools/compare validates 2-5 school requirement."""
    response = client.get("/api/schools/compare?rcdts=05-016-2140-17-0001")
    assert response.status_code == 400
    assert "2-5" in response.json()["detail"]

    rcdts_codes = ",".join([f"05-016-2140-17-{i:04d}" for i in range(6)])
    response = client.get(f"/api/schools/compare?rcdts={rcdts_codes}")
    assert response.status_code == 400
    assert "2-5" in response.json()["detail"]


def test_compare_schools_skips_nonexistent_schools(client, test_db):
    """GET /api/schools/compare skips schools that don't exist."""
    school = School(
        rcdts="05-016-2140-17-0001",
        school_name="Real School",
        city="Chicago",
        level="School",
    )
    test_db.add(school)
    test_db.commit()

    response = client.get(
        "/api/schools/compare?rcdts=05-016-2140-17-0001,99-999-9999-99-9999"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 1
    assert data["schools"][0]["school_name"] == "Real School"


def test_compare_schools_handles_three_schools(client, test_db):
    """GET /api/schools/compare works with 3 schools."""
    schools = [
        School(
            rcdts=f"05-016-2140-17-{i:04d}",
            school_name=f"School {i}",
            city="Chicago",
            level="School",
            student_enrollment=100 * i,
        )
        for i in range(1, 4)
    ]
    test_db.add_all(schools)
    test_db.commit()

    rcdts_codes = ",".join([f"05-016-2140-17-{i:04d}" for i in range(1, 4)])
    response = client.get(f"/api/schools/compare?rcdts={rcdts_codes}")

    assert response.status_code == 200
    data = response.json()
    assert len(data["schools"]) == 3
    assert data["schools"][0]["metrics"]["enrollment"] == 100
    assert data["schools"][2]["metrics"]["enrollment"] == 300


def test_get_school_handles_database_error(client):
    """GET /api/schools/{rcdts} returns 503 on database error."""
    with patch("app.api.schools.get_school_by_rcdts") as mock_get:
        mock_get.side_effect = OperationalError("statement", {}, "error")

        response = client.get("/api/schools/05-016-2140-17-0001")

        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()


def test_compare_schools_handles_malformed_rcdts(client):
    """GET /api/schools/compare handles malformed RCDTS gracefully."""
    response = client.get("/api/schools/compare?rcdts=invalid,,extra-comma")

    assert response.status_code in [200, 400]
