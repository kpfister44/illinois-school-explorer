# ABOUTME: Service layer utilities for top score rankings
# ABOUTME: Ranks a level's schools on ACT or IAR, statewide or within a county or district

from dataclasses import dataclass, field
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.sql import ColumnElement
from sqlalchemy.orm import Session

from app.database import School
from app.services.benchmarks import district_code


@dataclass
class RankedSchool:
    """Ranked school row exposed by the top scores endpoint."""

    rank: int
    rcdts: str
    school_name: str
    display_name: str
    city: str
    county: str | None
    district: str | None
    district_id: str
    school_type: str | None
    level: str
    enrollment: int | None
    low_income_percentage: float | None
    designation: str | None
    score: float
    act_ela_avg: float | None = None
    act_math_avg: float | None = None


@dataclass
class Ranking:
    """The top of a ranking, how many schools it ranks, and one school looked up in it."""

    results: List[RankedSchool] = field(default_factory=list)
    total: int = 0
    school: Optional[RankedSchool] = None


def _act_score_clause() -> ColumnElement[float]:
    return ((School.act_ela_avg + School.act_math_avg) / 2).label("score")


def _iar_score_clause() -> ColumnElement[float]:
    return School.iar_overall_proficiency_pct.label("score")


def _optional_float(value) -> float | None:
    return float(value) if value is not None else None


def fetch_top_scores(
    db: Session,
    assessment: str,
    level: str,
    limit: int = 100,
    county: str | None = None,
    district: str | None = None,
    school: str | None = None,
) -> Ranking:
    """Rank a level's schools on an assessment, best first.

    A county or district narrows the ranking, so ranks restart at 1 within it. Schools
    with the same score share a rank and are listed by name. `school` looks up one
    school's place, which may lie beyond `limit`.
    """
    limit = max(1, min(limit, 100))

    if assessment == "act":
        metric_column = _act_score_clause()
        filters = [School.act_ela_avg.isnot(None), School.act_math_avg.isnot(None)]
    elif assessment == "iar":
        metric_column = _iar_score_clause()
        filters = [School.iar_overall_proficiency_pct.isnot(None)]
    else:
        raise ValueError("Unsupported assessment")

    if county is not None:
        filters.append(func.lower(func.trim(School.county)) == county.strip().lower())
    if district is not None:
        filters.append(func.substr(School.rcdts, 1, len(district)) == district)

    shown_name = func.coalesce(School.display_name, School.school_name)
    query = (
        select(
            School.rcdts,
            School.school_name,
            shown_name.label("display_name"),
            School.city,
            School.county,
            School.district,
            School.school_type,
            School.level,
            School.student_enrollment,
            School.low_income_percentage,
            School.designation,
            School.act_ela_avg.label("act_ela_avg"),
            School.act_math_avg.label("act_math_avg"),
            metric_column,
        )
        .where(School.level == level)
    )

    for condition in filters:
        query = query.where(condition)

    rows = db.execute(query).all()

    ranked: List[RankedSchool] = []
    for row in rows:
        ranked.append(
            RankedSchool(
                rank=0,
                rcdts=row.rcdts,
                school_name=row.school_name,
                display_name=row.display_name,
                city=row.city,
                county=row.county,
                district=row.district,
                district_id=district_code(row.rcdts),
                school_type=row.school_type,
                level=row.level,
                enrollment=row.student_enrollment,
                low_income_percentage=_optional_float(row.low_income_percentage),
                designation=row.designation,
                score=round(float(row.score), 2),
                act_ela_avg=_optional_float(row.act_ela_avg),
                act_math_avg=_optional_float(row.act_math_avg),
            )
        )

    ranked.sort(key=lambda entry: (-entry.score, entry.display_name.casefold(), entry.rcdts))
    for index, entry in enumerate(ranked):
        tied_with_previous = index > 0 and entry.score == ranked[index - 1].score
        entry.rank = ranked[index - 1].rank if tied_with_previous else index + 1

    return Ranking(
        results=ranked[:limit],
        total=len(ranked),
        school=next((entry for entry in ranked if entry.rcdts == school), None),
    )
