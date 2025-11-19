# ABOUTME: School detail and comparison endpoints
# ABOUTME: Retrieves individual school data and multi-school comparisons

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db, get_school_by_rcdts
from app.models import (
    ACTScores,
    CompareResponse,
    Demographics,
    Diversity,
    HistoricalMetrics,
    HistoricalYearlyData,
    SchoolDetail,
    SchoolMetrics,
    TrendMetrics,
    TrendWindow,
)

router = APIRouter(prefix="/api/schools", tags=["schools"])

TREND_FIELD_MAP = {
    "enrollment": (
        "enrollment_trend_1yr",
        "enrollment_trend_3yr",
        "enrollment_trend_5yr",
    ),
    "low_income": (
        "low_income_trend_1yr",
        "low_income_trend_3yr",
        "low_income_trend_5yr",
    ),
    "el": ("el_trend_1yr", "el_trend_3yr", "el_trend_5yr"),
    "white": ("white_trend_1yr", "white_trend_3yr", "white_trend_5yr"),
    "black": ("black_trend_1yr", "black_trend_3yr", "black_trend_5yr"),
    "hispanic": (
        "hispanic_trend_1yr",
        "hispanic_trend_3yr",
        "hispanic_trend_5yr",
    ),
    "asian": ("asian_trend_1yr", "asian_trend_3yr", "asian_trend_5yr"),
    "pacific_islander": (
        "pacific_islander_trend_1yr",
        "pacific_islander_trend_3yr",
        "pacific_islander_trend_5yr",
    ),
    "native_american": (
        "native_american_trend_1yr",
        "native_american_trend_3yr",
        "native_american_trend_5yr",
    ),
    "two_or_more": (
        "two_or_more_trend_1yr",
        "two_or_more_trend_3yr",
        "two_or_more_trend_5yr",
    ),
    "mena": ("mena_trend_1yr", "mena_trend_3yr", "mena_trend_5yr"),
    "act": ("act_trend_1yr", "act_trend_3yr", "act_trend_5yr"),
}

HISTORICAL_FIELD_MAP = {
    "enrollment": "enrollment_hist",
    "act": "act_hist",
    "act_ela": "act_ela_hist",
    "act_math": "act_math_hist",
    "act_science": "act_science_hist",
    "el": "el_hist",
    "low_income": "low_income_hist",
    "white": "white_hist",
    "black": "black_hist",
    "hispanic": "hispanic_hist",
    "asian": "asian_hist",
    "pacific_islander": "pacific_islander_hist",
    "native_american": "native_american_hist",
    "two_or_more": "two_or_more_hist",
    "mena": "mena_hist",
}


@router.get("/compare", response_model=CompareResponse)
def compare_schools(
    rcdts: Annotated[str, Query(description="Comma-separated RCDTS codes (2-5)")],
    db: Session = Depends(get_db),
) -> CompareResponse:
    """Compare multiple schools side-by-side."""
    rcdts_list = [code.strip() for code in rcdts.split(",") if code.strip()]

    if len(rcdts_list) < 2 or len(rcdts_list) > 5:
        raise HTTPException(
            status_code=400,
            detail="Must provide 2-5 school RCDTS codes",
        )

    schools: List[SchoolDetail] = []
    for rcdts_code in rcdts_list:
        school = get_school_by_rcdts(db, rcdts_code)
        if school:
            schools.append(build_school_detail(school))

    return CompareResponse(schools=schools)


def build_school_detail(school) -> SchoolDetail:
    """Convert School ORM model to SchoolDetail schema."""
    act_scores: Optional[ACTScores] = None
    if any([school.act_ela_avg, school.act_math_avg, school.act_science_avg]):
        act_scores = ACTScores(
            ela_avg=school.act_ela_avg,
            math_avg=school.act_math_avg,
            science_avg=school.act_science_avg,
        )

    metrics = SchoolMetrics(
        enrollment=school.student_enrollment,
        act=act_scores,
        demographics=Demographics(
            el_percentage=school.el_percentage,
            low_income_percentage=school.low_income_percentage,
        ),
        diversity=Diversity(
            white=school.pct_white,
            black=school.pct_black,
            hispanic=school.pct_hispanic,
            asian=school.pct_asian,
            pacific_islander=school.pct_pacific_islander,
            native_american=school.pct_native_american,
            two_or_more=school.pct_two_or_more,
            mena=school.pct_mena,
        ),
        iar_ela_proficiency_pct=school.iar_ela_proficiency_pct,
        iar_math_proficiency_pct=school.iar_math_proficiency_pct,
        iar_overall_proficiency_pct=school.iar_overall_proficiency_pct,
        trends=_build_trend_metrics(school),
        historical=_build_historical_metrics(school),
    )

    return SchoolDetail(
        id=school.id,
        rcdts=school.rcdts,
        school_name=school.school_name,
        city=school.city,
        district=school.district,
        county=school.county,
        school_type=school.school_type,
        grades_served=school.grades_served,
        metrics=metrics,
    )


@router.get("/{rcdts}", response_model=SchoolDetail)
def get_school_detail(
    rcdts: Annotated[str, Path(description="School RCDTS identifier")],
    db: Session = Depends(get_db),
) -> SchoolDetail:
    """Get detailed information for a specific school by RCDTS."""
    school = get_school_by_rcdts(db, rcdts)

    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    return build_school_detail(school)


def _build_trend_metrics(school) -> Optional[TrendMetrics]:
    trend_payload = {}
    for metric, fields in TREND_FIELD_MAP.items():
        one_year = getattr(school, fields[0], None)
        three_year = getattr(school, fields[1], None)
        five_year = getattr(school, fields[2], None)
        window = _build_trend_window(one_year, three_year, five_year)
        if window is not None:
            trend_payload[metric] = window

    if not trend_payload:
        return None
    return TrendMetrics(**trend_payload)


def _build_trend_window(
    one_year: Optional[float], three_year: Optional[float], five_year: Optional[float]
) -> Optional[TrendWindow]:
    if all(value is None for value in (one_year, three_year, five_year)):
        return None
    return TrendWindow(one_year=one_year, three_year=three_year, five_year=five_year)


def _build_historical_metrics(school) -> Optional[HistoricalMetrics]:
    """Build historical yearly data from school database columns."""
    historical_payload = {}

    for metric, field_prefix in HISTORICAL_FIELD_MAP.items():
        yearly_data = _build_historical_yearly_data(school, field_prefix)
        if yearly_data is not None:
            historical_payload[metric] = yearly_data

    if not historical_payload:
        return None
    return HistoricalMetrics(**historical_payload)


def _build_historical_yearly_data(school, field_prefix: str) -> Optional[HistoricalYearlyData]:
    """Extract historical yearly values for a metric from database columns."""
    years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]
    year_values = {}

    for year in years:
        field_name = f"{field_prefix}_{year}"
        value = getattr(school, field_name, None)
        if value is not None:
            year_values[f"yr_{year}"] = value

    if not year_values:
        return None
    return HistoricalYearlyData(**year_values)
