# ABOUTME: Tests for Pydantic models used in API request/response validation
# ABOUTME: Validates serialization and field validation for all schema models

from app.models import (
    ACTScores,
    CompareResponse,
    Demographics,
    Diversity,
    SchoolDetail,
    SchoolMetrics,
    SchoolSearchResult,
    SearchResponse,
)


def test_school_search_result_serialization():
    """SchoolSearchResult serializes all fields correctly."""
    data = {
        "id": 123,
        "rcdts": "05-016-2140-17-0002",
        "school_name": "Elk Grove High School",
        "city": "Elk Grove Village",
        "district": "Township HSD 214",
        "school_type": "High School",
    }

    result = SchoolSearchResult(**data)

    assert result.id == 123
    assert result.rcdts == "05-016-2140-17-0002"
    assert result.school_name == "Elk Grove High School"
    assert result.city == "Elk Grove Village"
    assert result.district == "Township HSD 214"
    assert result.school_type == "High School"


def test_act_scores_with_overall_avg():
    """ACTScores calculates overall_avg from ela and math."""
    scores = ACTScores(
        ela_avg=17.7,
        math_avg=18.2,
        science_avg=18.9
    )

    assert scores.ela_avg == 17.7
    assert scores.math_avg == 18.2
    assert scores.science_avg == 18.9
    assert scores.overall_avg == 17.95  # (17.7 + 18.2) / 2


def test_act_scores_with_none_values():
    """ACTScores handles None values for suppressed data."""
    scores = ACTScores(
        ela_avg=None,
        math_avg=None,
        science_avg=None
    )

    assert scores.ela_avg is None
    assert scores.math_avg is None
    assert scores.science_avg is None
    assert scores.overall_avg is None


def test_demographics_model():
    """Demographics model holds EL and low income percentages."""
    demo = Demographics(el_percentage=29.0, low_income_percentage=38.4)

    assert demo.el_percentage == 29.0
    assert demo.low_income_percentage == 38.4


def test_diversity_model():
    """Diversity model holds all racial/ethnic percentages."""
    diversity = Diversity(
        white=36.8,
        black=1.9,
        hispanic=48.3,
        asian=8.7,
        pacific_islander=None,
        native_american=None,
        two_or_more=3.0,
        mena=None
    )

    assert diversity.white == 36.8
    assert diversity.black == 1.9
    assert diversity.hispanic == 48.3
    assert diversity.asian == 8.7
    assert diversity.pacific_islander is None
    assert diversity.native_american is None
    assert diversity.two_or_more == 3.0
    assert diversity.mena is None


def test_school_metrics_composition():
    """SchoolMetrics composes enrollment, ACT, demographics, and diversity."""
    metrics = SchoolMetrics(
        enrollment=1775,
        act=ACTScores(ela_avg=17.7, math_avg=18.2, science_avg=18.9),
        demographics=Demographics(el_percentage=29.0, low_income_percentage=38.4),
        diversity=Diversity(white=36.8, hispanic=48.3, asian=8.7)
    )

    assert metrics.enrollment == 1775
    assert metrics.act.overall_avg == 17.95
    assert metrics.demographics.el_percentage == 29.0
    assert metrics.diversity.white == 36.8


def test_school_detail_full_model():
    """SchoolDetail includes all school information and metrics."""
    detail = SchoolDetail(
        id=123,
        rcdts="05-016-2140-17-0002",
        school_name="Elk Grove High School",
        city="Elk Grove Village",
        district="Township HSD 214",
        county="Cook",
        school_type="High School",
        grades_served="9-12",
        metrics=SchoolMetrics(
            enrollment=1775,
            act=ACTScores(ela_avg=17.7, math_avg=18.2, science_avg=18.9),
            demographics=Demographics(el_percentage=29.0, low_income_percentage=38.4),
            diversity=Diversity(white=36.8, hispanic=48.3)
        )
    )

    assert detail.school_name == "Elk Grove High School"
    assert detail.grades_served == "9-12"
    assert detail.metrics.enrollment == 1775
    assert detail.metrics.act.overall_avg == 17.95


def test_school_detail_includes_iar_metrics():
    """SchoolDetail metrics should expose IAR proficiency values."""
    detail = SchoolDetail(
        id=1,
        rcdts="11",
        school_name="Sample",
        city="Normal",
        metrics=SchoolMetrics(
            enrollment=400,
            act=None,
            demographics=None,
            diversity=None,
            iar_overall_proficiency_pct=51.75,
        ),
    )

    assert detail.metrics.iar_overall_proficiency_pct == 51.75


def test_search_response_wrapper():
    """SearchResponse wraps results list and total count."""
    response = SearchResponse(
        results=[
            SchoolSearchResult(
                id=1,
                rcdts="05-016-2140-17-0002",
                school_name="Test School",
                city="Chicago",
                district="Test District",
                school_type="High School"
            )
        ],
        total=1
    )

    assert len(response.results) == 1
    assert response.total == 1
    assert response.results[0].school_name == "Test School"


def test_compare_response_wrapper():
    """CompareResponse wraps list of school details."""
    response = CompareResponse(
        schools=[
            SchoolDetail(
                id=1,
                rcdts="05-016-2140-17-0002",
                school_name="School A",
                city="Chicago",
                metrics=SchoolMetrics(enrollment=1000)
            ),
            SchoolDetail(
                id=2,
                rcdts="05-016-2140-17-0003",
                school_name="School B",
                city="Springfield",
                metrics=SchoolMetrics(enrollment=500)
            )
        ]
    )

    assert len(response.schools) == 2
    assert response.schools[0].school_name == "School A"
    assert response.schools[1].metrics.enrollment == 500
