# ABOUTME: Tests for GET /api/cities, the list of cities and towns with schools
# ABOUTME: Validates ordering, school counts and that one city is listed once whatever its capitalisation

from app.database import School


def add_school(test_db, rcdts: str, city: str) -> None:
    test_db.add(
        School(rcdts=rcdts, school_name=f"School {rcdts}", city=city, level="elementary")
    )


def test_cities_are_alphabetical_with_school_counts(client, test_db):
    add_school(test_db, "05-016-2140-17-0001", "Rolling Meadows")
    add_school(test_db, "05-016-2140-17-0002", "Elk Grove Village")
    add_school(test_db, "05-016-0590-04-2003", "Elk Grove Village")
    test_db.commit()

    response = client.get("/api/cities")

    assert response.status_code == 200
    assert response.json() == {
        "cities": [
            {"name": "Elk Grove Village", "school_count": 2},
            {"name": "Rolling Meadows", "school_count": 1},
        ]
    }


def test_a_city_is_listed_once_under_its_most_common_spelling(client, test_db):
    add_school(test_db, "16-019-4280-26-0001", "Dekalb")
    add_school(test_db, "16-019-4280-26-0002", "DeKalb")
    add_school(test_db, "16-019-4280-26-0003", "DeKalb ")
    test_db.commit()

    assert client.get("/api/cities").json() == {"cities": [{"name": "DeKalb", "school_count": 3}]}


def test_city_list_with_no_schools(client):
    assert client.get("/api/cities").json() == {"cities": []}
