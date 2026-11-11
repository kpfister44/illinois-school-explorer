# ABOUTME: Tests for /api/search endpoint with FTS5 full-text search
# ABOUTME: Validates search functionality, pagination, and error handling

from sqlalchemy import text

from app.database import School


def test_search_endpoint_returns_results(client, test_db):
    """GET /api/search returns matching schools."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        school_type="High School",
        level="School",
        student_enrollment=1775
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/search?q=elk+grove")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["results"]) == 1
    assert data["results"][0]["school_name"] == "Elk Grove High School"
    assert data["results"][0]["city"] == "Elk Grove Village"

def test_search_requires_query_parameter(client):
    """GET /api/search without query parameter returns 422."""
    response = client.get("/api/search")

    assert response.status_code == 422
    assert "field required" in response.text.lower() or "missing" in response.text.lower()

def test_search_respects_limit_parameter(client, test_db):
    """GET /api/search respects limit parameter."""
    for i in range(15):
        school = School(
            rcdts=f"05-016-2140-17-{i:04d}",
            school_name=f"Test High School {i}",
            city="Chicago",
            district="Test District",
            school_type="High School",
            level="School"
        )
        test_db.add(school)
    test_db.commit()

    response = client.get("/api/search?q=test&limit=5")

    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 5
    assert data["total"] == 5


def test_search_enforces_max_limit(client, test_db):
    """GET /api/search enforces maximum limit of 50."""
    response = client.get("/api/search?q=school&limit=100")

    assert response.status_code == 422

def test_search_returns_empty_when_no_matches(client, test_db):
    """GET /api/search returns empty results for non-matching query."""
    school = School(
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        level="School"
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/search?q=nonexistent")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["results"] == []

def test_search_finds_schools_by_city(client, test_db):
    """GET /api/search finds schools by city name."""
    school1 = School(
        rcdts="05-016-2140-17-0001",
        school_name="Springfield High School",
        city="Springfield",
        level="School"
    )
    school2 = School(
        rcdts="05-016-2140-17-0002",
        school_name="Lincoln Elementary",
        city="Springfield",
        level="School"
    )
    test_db.add_all([school1, school2])
    test_db.commit()

    response = client.get("/api/search?q=springfield")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2


def test_search_handles_special_characters(client, test_db):
    """GET /api/search handles special characters in query."""
    school = School(
        rcdts="05-016-2140-17-0001",
        school_name="St. Mary's School",
        city="O'Fallon",
        level="School",
    )
    test_db.add(school)
    test_db.commit()

    response = client.get("/api/search?q=o'fallon")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_search_matches_display_name_and_official_name(client, test_db):
    """GET /api/search finds a school by its spelled-out name and by its official name."""
    school = School(
        rcdts="05-016-0590-04-2003",
        school_name="Clearmont Elem School",
        display_name="Clearmont Elementary School",
        city="Elk Grove Village",
        district="Comm Cons SD 59",
        school_type="Elementary School",
        level="elementary",
    )
    test_db.add(school)
    test_db.commit()

    for query in ("clearmont elementary", "clearmont elem"):
        response = client.get("/api/search", params={"q": query})
        names = [result["school_name"] for result in response.json()["results"]]
        assert names == ["Clearmont Elem School"], query


def test_search_follows_display_name_updates(client, test_db):
    """The search index tracks changes to a school's display name."""
    school = School(
        rcdts="05-016-0590-04-2003",
        school_name="Clearmont Elem School",
        city="Elk Grove Village",
        level="elementary",
    )
    test_db.add(school)
    test_db.commit()
    assert client.get("/api/search", params={"q": "elementary"}).json()["total"] == 0

    school.display_name = "Clearmont Elementary School"
    test_db.commit()

    assert client.get("/api/search", params={"q": "elementary"}).json()["total"] == 1


def test_search_forgets_deleted_schools(client, test_db):
    """The search index drops a school when it is deleted and stays usable afterwards."""
    school = School(
        rcdts="05-016-0590-04-2003",
        school_name="Clearmont Elem School",
        city="Elk Grove Village",
        level="elementary",
    )
    test_db.add(school)
    test_db.commit()

    test_db.delete(school)
    test_db.commit()
    assert client.get("/api/search", params={"q": "clearmont"}).json()["total"] == 0

    test_db.add(
        School(
            rcdts="05-016-2140-17-0002",
            school_name="Elk Grove High School",
            city="Elk Grove Village",
            level="high",
        )
    )
    test_db.commit()
    assert client.get("/api/search", params={"q": "clearmont"}).json()["total"] == 0
    assert client.get("/api/search", params={"q": "elk grove"}).json()["total"] == 1
    integrity = test_db.execute(
        text("INSERT INTO schools_fts(schools_fts, rank) VALUES('integrity-check', 1)")
    )
    assert integrity is not None
