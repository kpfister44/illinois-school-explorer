# ABOUTME: Tests for GET /api/districts and GET /api/districts/{id}
# ABOUTME: Validates the district list, a district's summary, its schools by level and its averages

from app.database import School

UNIT_DISTRICT = "41-057-0070-26"
OTHER_DISTRICT = "05-016-0590-04"


def school(code: str, name: str, level: str, district: str = UNIT_DISTRICT, **figures) -> School:
    return School(
        rcdts=f"{district}-{code}",
        school_name=name,
        display_name=name,
        city="Edwardsville",
        county="Madison" if district == UNIT_DISTRICT else "Cook",
        district="Edwardsville CUSD 7" if district == UNIT_DISTRICT else "Comm Cons SD 59",
        level=level,
        **figures,
    )


def add_schools(test_db) -> None:
    test_db.add_all(
        [
            school("0001", "Edwardsville High School", "high", student_enrollment=2300,
                   act_ela_avg=20.0, act_math_avg=21.0),
            school("1001", "Liberty Middle School", "middle", student_enrollment=800,
                   iar_overall_proficiency_pct=50.0),
            school("2001", "Cassens Elementary School", "elementary", student_enrollment=400,
                   iar_overall_proficiency_pct=60.0),
            school("2002", "Goshen Elementary School", "elementary", student_enrollment=500,
                   iar_overall_proficiency_pct=45.0),
            school("2003", "Nelson Elementary School", "elementary", student_enrollment=300,
                   iar_overall_proficiency_pct=30.0),
            school("2004", "Midway Elementary School", "elementary"),
            school("2005", "Clearmont Elementary School", "elementary", district=OTHER_DISTRICT,
                   student_enrollment=388, iar_overall_proficiency_pct=25.0),
        ]
    )
    test_db.commit()


def test_district_summary(client, test_db):
    add_schools(test_db)

    response = client.get(f"/api/districts/{UNIT_DISTRICT}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == UNIT_DISTRICT
    assert data["name"] == "Edwardsville CUSD 7"
    assert data["county"] == "Madison"
    assert data["school_count"] == 6
    assert data["enrollment"] == 4300


def test_district_schools_are_grouped_by_level_from_elementary_up(client, test_db):
    add_schools(test_db)

    levels = client.get(f"/api/districts/{UNIT_DISTRICT}").json()["levels"]

    assert [(level["level"], level["assessment"]) for level in levels] == [
        ("elementary", "iar"),
        ("middle", "iar"),
        ("high", "act"),
    ]
    assert [len(level["schools"]) for level in levels] == [4, 1, 1]


def test_district_schools_run_from_the_highest_score_with_unscored_schools_last(client, test_db):
    add_schools(test_db)

    elementary = client.get(f"/api/districts/{UNIT_DISTRICT}").json()["levels"][0]

    assert [(row["display_name"], row["score"]) for row in elementary["schools"]] == [
        ("Cassens Elementary School", 60.0),
        ("Goshen Elementary School", 45.0),
        ("Nelson Elementary School", 30.0),
        ("Midway Elementary School", None),
    ]
    assert elementary["schools"][0]["district_id"] == UNIT_DISTRICT


def test_district_average_needs_three_schools_with_a_score(client, test_db):
    add_schools(test_db)

    elementary, middle, high = client.get(f"/api/districts/{UNIT_DISTRICT}").json()["levels"]

    assert elementary["district_average"] == 45.0
    assert middle["district_average"] is None
    assert high["district_average"] is None


def test_state_average_covers_every_school_of_the_level(client, test_db):
    add_schools(test_db)

    elementary, middle, high = client.get(f"/api/districts/{UNIT_DISTRICT}").json()["levels"]

    assert elementary["state_average"] == 40.0
    assert middle["state_average"] == 50.0
    assert high["state_average"] == 20.5


def test_state_average_is_missing_when_no_school_of_the_level_has_a_score(client, test_db):
    test_db.add(school("3001", "Day School", "other"))
    test_db.commit()

    level = client.get(f"/api/districts/{UNIT_DISTRICT}").json()["levels"][0]

    assert level["level"] == "other"
    assert level["state_average"] is None
    assert level["district_average"] is None


def test_unknown_district_is_not_found(client, test_db):
    add_schools(test_db)

    response = client.get("/api/districts/99-999-9999-99")

    assert response.status_code == 404
    assert response.json()["detail"] == "District not found"


def test_district_list_is_alphabetical_with_county_and_school_count(client, test_db):
    add_schools(test_db)

    response = client.get("/api/districts")

    assert response.status_code == 200
    assert response.json() == {
        "districts": [
            {"id": OTHER_DISTRICT, "name": "Comm Cons SD 59", "county": "Cook", "school_count": 1},
            {
                "id": UNIT_DISTRICT,
                "name": "Edwardsville CUSD 7",
                "county": "Madison",
                "school_count": 6,
            },
        ]
    }


def test_districts_sharing_a_name_are_listed_separately(client, test_db):
    test_db.add_all(
        [
            School(rcdts="05-016-0010-04-2001", school_name="A", city="X", county="Cook",
                   district="Central SD 1", level="elementary"),
            School(rcdts="41-057-0010-26-2001", school_name="B", city="Y", county="Madison",
                   district="Central SD 1", level="elementary"),
        ]
    )
    test_db.commit()

    districts = client.get("/api/districts").json()["districts"]

    assert [(district["name"], district["county"]) for district in districts] == [
        ("Central SD 1", "Cook"),
        ("Central SD 1", "Madison"),
    ]


def test_district_list_with_no_schools(client):
    assert client.get("/api/districts").json() == {"districts": []}
