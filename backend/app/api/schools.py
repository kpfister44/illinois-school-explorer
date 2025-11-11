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
    SchoolDetail,
    SchoolMetrics,
)

router = APIRouter(prefix="/api/schools", tags=["schools"])


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
