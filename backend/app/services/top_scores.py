# ABOUTME: Service layer utilities for top score rankings
# ABOUTME: Provides database queries for ranked ACT/IAR school lists

from dataclasses import dataclass
from typing import List

from sqlalchemy import select
from sqlalchemy.sql import ColumnElement
from sqlalchemy.orm import Session

from app.database import School


@dataclass
class RankedSchool:
    """Ranked school row exposed by the top scores endpoint."""

    rank: int
    rcdts: str
    school_name: str
    city: str
    district: str | None
    school_type: str | None
    level: str
    enrollment: int | None
    score: float
    act_ela_avg: float | None = None
    act_math_avg: float | None = None


def _act_score_clause() -> ColumnElement[float]:
    return ((School.act_ela_avg + School.act_math_avg) / 2).label("score")


def _iar_score_clause() -> ColumnElement[float]:
    return School.iar_overall_proficiency_pct.label("score")


def fetch_top_scores(db: Session, assessment: str, level: str, limit: int = 100) -> List[RankedSchool]:
    """Return ranked school rows for the requested assessment/level."""
    limit = max(1, min(limit, 100))

    if assessment == "act":
        metric_column = _act_score_clause()
        filters = [School.act_ela_avg.isnot(None), School.act_math_avg.isnot(None)]
    elif assessment == "iar":
        metric_column = _iar_score_clause()
        filters = [School.iar_overall_proficiency_pct.isnot(None)]
    else:
        raise ValueError("Unsupported assessment")

    query = (
        select(
            School.rcdts,
            School.school_name,
            School.city,
            School.district,
            School.school_type,
            School.level,
            School.student_enrollment,
            School.act_ela_avg.label("act_ela_avg"),
            School.act_math_avg.label("act_math_avg"),
            metric_column,
        )
        .where(School.level == level)
    )

    for condition in filters:
        query = query.where(condition)

    query = query.order_by(metric_column.desc(), School.school_name.asc()).limit(limit)

    rows = db.execute(query).all()

    ranked: List[RankedSchool] = []
    for idx, row in enumerate(rows):
        ranked.append(
            RankedSchool(
                rank=idx + 1,
                rcdts=row.rcdts,
                school_name=row.school_name,
                city=row.city,
                district=row.district,
                school_type=row.school_type,
                level=row.level,
                enrollment=row.student_enrollment,
                score=round(float(row.score), 2),
                act_ela_avg=float(row.act_ela_avg)
                if row.act_ela_avg is not None
                else None,
                act_math_avg=float(row.act_math_avg)
                if row.act_math_avg is not None
                else None,
            )
        )

    return ranked
