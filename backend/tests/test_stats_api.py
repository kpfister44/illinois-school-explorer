# ABOUTME: Tests for /api/stats endpoint
# ABOUTME: Validates the school, district and city counts shown on the home page

from app.database import School


def add_school(test_db, rcdts: str, city: str, district: str = "District") -> None:
    test_db.add(
        School(
            rcdts=rcdts,
            school_name=f"School {rcdts}",
            city=city,
            district=district,
            level="elementary",
        )
    )


def test_stats_counts_schools_districts_and_cities(client, test_db):
    add_school(test_db, "05-016-2140-17-0001", "Elk Grove Village", "Township HSD 214")
    add_school(test_db, "05-016-2140-17-0002", "Rolling Meadows", "Township HSD 214")
    add_school(test_db, "05-016-0590-04-2003", "Elk Grove Village", "Comm Cons SD 59")
    test_db.commit()

    response = client.get("/api/stats")

    assert response.status_code == 200
    assert response.json() == {"schools": 3, "districts": 2, "cities": 2}


def test_stats_counts_districts_by_code_not_name(client, test_db):
    add_school(test_db, "05-016-0590-04-2003", "Elk Grove Village", "Central SD 1")
    add_school(test_db, "41-057-0010-26-2001", "Edwardsville", "Central SD 1")
    test_db.commit()

    assert client.get("/api/stats").json()["districts"] == 2


def test_stats_counts_a_city_once_whatever_its_capitalisation(client, test_db):
    add_school(test_db, "16-019-4280-26-0001", "DeKalb")
    add_school(test_db, "16-019-4280-26-0002", "Dekalb")
    test_db.commit()

    assert client.get("/api/stats").json()["cities"] == 1


def test_stats_with_no_schools(client):
    assert client.get("/api/stats").json() == {"schools": 0, "districts": 0, "cities": 0}
