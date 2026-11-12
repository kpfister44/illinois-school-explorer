# ABOUTME: Tests for GET /api/schools, the filtered, sorted and paged list of schools
# ABOUTME: Validates each filter, the headline score per level, sorting, paging and search

from app.database import School, search_schools

HSD_214 = "05-016-2140-17"
SD_59 = "05-016-0590-04"
EDWARDSVILLE_7 = "41-057-0070-26"


def add_schools(test_db) -> None:
    test_db.add_all(
        [
            School(
                rcdts=f"{HSD_214}-0002",
                school_name="Elk Grove High School",
                display_name="Elk Grove High School",
                city="Elk Grove Village",
                county="Cook",
                district="Township HSD 214",
                level="high",
                grades_served="9 - 12",
                designation="Approaching Exemplary",
                student_enrollment=1721,
                low_income_percentage=35.2,
                act_ela_avg=17.6,
                act_math_avg=18.6,
                iar_overall_proficiency_pct=99.0,
            ),
            School(
                rcdts=f"{HSD_214}-0007",
                school_name="Rolling Meadows High School",
                display_name="Rolling Meadows High School",
                city="Rolling Meadows",
                county="Cook",
                district="Township HSD 214",
                level="high",
                grades_served="9 - 12",
                designation="Exemplary",
                student_enrollment=1800,
                low_income_percentage=27.5,
                act_ela_avg=19.4,
                act_math_avg=19.8,
            ),
            School(
                rcdts=f"{SD_59}-2003",
                school_name="Clearmont Elem School",
                display_name="Clearmont Elementary School",
                city="Elk Grove Village",
                county="Cook",
                district="Comm Cons SD 59",
                level="elementary",
                grades_served="K - 5",
                designation="Commendable",
                student_enrollment=388,
                low_income_percentage=30.0,
                iar_overall_proficiency_pct=56.6,
                act_ela_avg=30.0,
                act_math_avg=30.0,
            ),
            School(
                rcdts=f"{SD_59}-1001",
                school_name="Grove Jr High School",
                display_name="Grove Junior High School",
                city="ELK GROVE VILLAGE",
                county="Cook",
                district="Comm Cons SD 59",
                level="middle",
                grades_served="6 - 8",
                designation="Developing",
                student_enrollment=742,
                low_income_percentage=41.0,
                iar_overall_proficiency_pct=40.2,
            ),
            School(
                rcdts=f"{EDWARDSVILLE_7}-2001",
                school_name="Albert Cassens Elem School",
                display_name="Albert Cassens Elementary School",
                city="Glen Carbon",
                county="Madison",
                district="Edwardsville CUSD 7",
                level="elementary",
                grades_served="3 - 5",
            ),
        ]
    )
    test_db.commit()


def names(response) -> list[str]:
    assert response.status_code == 200
    return [school["display_name"] for school in response.json()["results"]]


def test_lists_every_school_by_name_with_the_total(client, test_db):
    add_schools(test_db)

    response = client.get("/api/schools")

    assert names(response) == [
        "Albert Cassens Elementary School",
        "Clearmont Elementary School",
        "Elk Grove High School",
        "Grove Junior High School",
        "Rolling Meadows High School",
    ]
    assert response.json()["total"] == 5


def test_row_carries_what_a_results_list_shows(client, test_db):
    add_schools(test_db)

    row = client.get("/api/schools?level=high&city=Elk Grove Village").json()["results"][0]

    assert row == {
        "rcdts": f"{HSD_214}-0002",
        "school_name": "Elk Grove High School",
        "display_name": "Elk Grove High School",
        "city": "Elk Grove Village",
        "county": "Cook",
        "district": "Township HSD 214",
        "district_id": HSD_214,
        "level": "high",
        "grades_served": "9 - 12",
        "enrollment": 1721,
        "low_income_percentage": 35.2,
        "designation": "Approaching Exemplary",
        "assessment": "act",
        "score": 18.1,
    }


def test_headline_score_is_the_act_for_high_schools_and_the_iar_for_the_rest(client, test_db):
    add_schools(test_db)

    rows = {row["display_name"]: row for row in client.get("/api/schools").json()["results"]}

    elk_grove = rows["Elk Grove High School"]
    assert (elk_grove["assessment"], elk_grove["score"]) == ("act", 18.1)
    clearmont = rows["Clearmont Elementary School"]
    assert (clearmont["assessment"], clearmont["score"]) == ("iar", 56.6)
    grove = rows["Grove Junior High School"]
    assert (grove["assessment"], grove["score"]) == ("iar", 40.2)


def test_school_without_a_score_or_other_figures_is_listed_with_nulls(client, test_db):
    add_schools(test_db)

    row = client.get("/api/schools?county=Madison").json()["results"][0]

    assert row["assessment"] == "iar"
    assert row["score"] is None
    assert row["enrollment"] is None
    assert row["low_income_percentage"] is None
    assert row["designation"] is None


def test_filters_by_level(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?level=high")) == [
        "Elk Grove High School",
        "Rolling Meadows High School",
    ]


def test_filters_by_county_and_city_whatever_the_capitalisation(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?county=madison")) == ["Albert Cassens Elementary School"]
    assert names(client.get("/api/schools?city=elk grove village")) == [
        "Clearmont Elementary School",
        "Elk Grove High School",
        "Grove Junior High School",
    ]


def test_filters_by_district_id(client, test_db):
    add_schools(test_db)

    assert names(client.get(f"/api/schools?district={SD_59}")) == [
        "Clearmont Elementary School",
        "Grove Junior High School",
    ]


def test_filters_by_designation(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?designation=Exemplary")) == ["Rolling Meadows High School"]


def test_filters_by_enrollment_range_and_leaves_out_schools_without_a_count(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?enrollment_min=388&enrollment_max=742")) == [
        "Clearmont Elementary School",
        "Grove Junior High School",
    ]
    assert names(client.get("/api/schools?enrollment_min=1722")) == ["Rolling Meadows High School"]


def test_filters_by_low_income_range_and_leaves_out_schools_without_a_share(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?low_income_max=30")) == [
        "Clearmont Elementary School",
        "Rolling Meadows High School",
    ]
    assert names(client.get("/api/schools?low_income_min=35.2&low_income_max=41")) == [
        "Elk Grove High School",
        "Grove Junior High School",
    ]


def test_filters_combine(client, test_db):
    add_schools(test_db)

    response = client.get("/api/schools?city=Elk Grove Village&level=elementary")

    assert names(response) == ["Clearmont Elementary School"]
    assert response.json()["total"] == 1


def test_sorts_by_enrollment_with_missing_counts_last_in_either_order(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?sort=enrollment&order=desc")) == [
        "Rolling Meadows High School",
        "Elk Grove High School",
        "Grove Junior High School",
        "Clearmont Elementary School",
        "Albert Cassens Elementary School",
    ]
    assert names(client.get("/api/schools?sort=enrollment"))[-1] == "Albert Cassens Elementary School"


def test_sorts_one_level_by_score(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?level=high&sort=score&order=desc")) == [
        "Rolling Meadows High School",
        "Elk Grove High School",
    ]
    assert names(client.get("/api/schools?level=elementary&sort=score&order=desc")) == [
        "Clearmont Elementary School",
        "Albert Cassens Elementary School",
    ]


def test_sorting_by_score_needs_a_level_because_levels_take_different_tests(client, test_db):
    add_schools(test_db)

    response = client.get("/api/schools?sort=score")

    assert response.status_code == 422
    assert response.json()["detail"] == "Sorting by score needs a level"


def test_pages_through_the_list(client, test_db):
    add_schools(test_db)

    response = client.get("/api/schools?limit=2&offset=2")

    assert names(response) == ["Elk Grove High School", "Grove Junior High School"]
    assert response.json()["total"] == 5
    assert names(client.get("/api/schools?limit=2&offset=4")) == ["Rolling Meadows High School"]
    assert names(client.get("/api/schools?offset=5")) == []


def test_search_keeps_the_best_matches_first(client, test_db):
    add_schools(test_db)

    response = client.get("/api/schools?q=grove")

    assert sorted(names(response)) == [
        "Clearmont Elementary School",
        "Elk Grove High School",
        "Grove Junior High School",
    ]
    assert response.json()["total"] == 3
    ranked = [school.display_name for school in search_schools(test_db, "grove", limit=50)]
    assert names(response) == ranked


def test_search_matches_a_district_and_combines_with_filters_and_sort(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?q=township hsd 214&sort=name")) == [
        "Elk Grove High School",
        "Rolling Meadows High School",
    ]
    assert names(client.get("/api/schools?q=grove&level=middle")) == ["Grove Junior High School"]


def test_search_with_no_matches_or_only_punctuation_finds_nothing(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?q=zzzz")) == []
    assert names(client.get("/api/schools?q=%2A%2A")) == []


def test_rejects_values_outside_the_allowed_choices(client, test_db):
    add_schools(test_db)

    for query in (
        "level=college",
        "sort=rank",
        "order=sideways",
        "limit=0",
        "limit=101",
        "offset=-1",
        "enrollment_min=-5",
        "low_income_max=101",
    ):
        assert client.get(f"/api/schools?{query}").status_code == 422, query


def test_unknown_place_or_designation_finds_nothing(client, test_db):
    add_schools(test_db)

    assert names(client.get("/api/schools?county=Nowhere")) == []
    assert names(client.get("/api/schools?district=99-999-9999-99")) == []
    assert names(client.get("/api/schools?designation=Splendid")) == []


def test_list_does_not_shadow_school_detail_or_compare(client, test_db):
    add_schools(test_db)

    assert client.get(f"/api/schools/{HSD_214}-0002").json()["school_name"] == "Elk Grove High School"
    compare = client.get(f"/api/schools/compare?rcdts={HSD_214}-0002,{HSD_214}-0007")
    assert len(compare.json()["schools"]) == 2

