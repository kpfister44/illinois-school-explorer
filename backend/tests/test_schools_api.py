# ABOUTME: Tests for /api/schools endpoints (detail and compare)
# ABOUTME: Validates school retrieval, metrics formatting, and error handling

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
