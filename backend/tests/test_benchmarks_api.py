# ABOUTME: Tests for benchmarks on school detail and the similar-schools and state benchmark endpoints
# ABOUTME: Validates response shapes, parameter checks and that benchmarks follow the request's database

from app.database import School


def add_high_schools(test_db, count: int = 4) -> None:
    test_db.add_all(
        [
            School(
                rcdts=f"11-111-1111-11-{idx:04d}",
                school_name=f"School {idx} HS",
                display_name=f"School {idx} High School",
                city="Normal",
                district="District 1",
                level="high",
                student_enrollment=1000 + idx,
                low_income_percentage=40.0 + idx,
                el_percentage=10.0,
                act_ela_avg=18.0 + idx,
                act_math_avg=18.0 + idx,
                act_hist_2025=17.0 + idx,
            )
            for idx in range(count)
        ]
    )
    test_db.commit()


def test_school_detail_includes_benchmarks(client, test_db):
    add_high_schools(test_db)

    response = client.get("/api/schools/11-111-1111-11-0001")

    assert response.status_code == 200
    benchmarks = response.json()["benchmarks"]
    assert benchmarks["act"] == {
        "level": "high",
        "state_average": 19.5,
        "state_schools": 4,
        "district_average": 19.5,
        "district_schools": 4,
        "percentile": 25,
        "similar_average": 19.67,
    }
    assert benchmarks["iar"] is None
    assert benchmarks["low_income"]["state_average"] == 41.5
    assert benchmarks["el"]["state_average"] == 10.0


def test_compare_includes_benchmarks_for_each_school(client, test_db):
    add_high_schools(test_db)

    response = client.get(
        "/api/schools/compare?rcdts=11-111-1111-11-0000,11-111-1111-11-0003"
    )

    assert response.status_code == 200
    percentiles = [
        school["benchmarks"]["act"]["percentile"] for school in response.json()["schools"]
    ]
    assert percentiles == [0, 75]


def test_similar_schools_lists_the_nearest_schools_first(client, test_db):
    add_high_schools(test_db)

    response = client.get("/api/schools/11-111-1111-11-0000/similar?assessment=act")

    assert response.status_code == 200
    data = response.json()
    assert data["assessment"] == "act"
    assert data["level"] == "high"
    assert data["average"] == 20.0
    assert data["schools"][0] == {
        "rcdts": "11-111-1111-11-0001",
        "school_name": "School 1 HS",
        "display_name": "School 1 High School",
        "city": "Normal",
        "district": "District 1",
        "enrollment": 1001,
        "low_income_percentage": 41.0,
        "el_percentage": 10.0,
        "score": 19.0,
    }
    assert [school["score"] for school in data["schools"]] == [19.0, 20.0, 21.0]


def test_similar_schools_returns_404_for_an_unknown_school(client):
    response = client.get("/api/schools/99-999-9999-99-9999/similar?assessment=act")

    assert response.status_code == 404
    assert response.json()["detail"] == "School not found"


def test_similar_schools_rejects_an_unknown_assessment(client, test_db):
    add_high_schools(test_db)

    response = client.get("/api/schools/11-111-1111-11-0000/similar?assessment=sat")

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid assessment"


def test_similar_schools_requires_an_assessment(client, test_db):
    add_high_schools(test_db)

    response = client.get("/api/schools/11-111-1111-11-0000/similar")

    assert response.status_code == 422


def test_state_benchmark_returns_yearly_averages_and_the_band(client, test_db):
    add_high_schools(test_db)

    response = client.get("/api/benchmarks/state?metric=act&level=high")

    assert response.status_code == 200
    assert response.json() == {
        "metric": "act",
        "level": "high",
        "schools": 4,
        "band_low": 18.3,
        "band_high": 20.7,
        "years": [
            {"year": 2025, "average": 18.5, "schools": 4},
            {"year": 2026, "average": 19.5, "schools": 4},
        ],
    }


def test_state_benchmark_with_no_schools(client):
    response = client.get("/api/benchmarks/state?metric=iar&level=middle")

    assert response.status_code == 200
    assert response.json() == {
        "metric": "iar",
        "level": "middle",
        "schools": 0,
        "band_low": None,
        "band_high": None,
        "years": [],
    }


def test_state_benchmark_rejects_an_unknown_metric(client):
    response = client.get("/api/benchmarks/state?metric=enrollment&level=high")

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid metric"


def test_state_benchmark_rejects_an_unknown_level(client):
    response = client.get("/api/benchmarks/state?metric=act&level=college")

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid level"
