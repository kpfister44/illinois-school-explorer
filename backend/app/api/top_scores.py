# ABOUTME: FastAPI router for top scores endpoints
# ABOUTME: Provides ranked school lists filtered by assessment and level

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TopScoreEntry, TopScoresResponse
from app.services.top_scores import fetch_top_scores

router = APIRouter(prefix="/api/top-scores", tags=["top-scores"])

VALID_ASSESSMENTS = {"act", "iar"}
VALID_LEVELS = {"high", "middle", "elementary"}


@router.get("", response_model=TopScoresResponse)
def get_top_scores(
    assessment: Annotated[str, Query(description="act or iar")],
    level: Annotated[str, Query(description="high, middle, elementary")],
    limit: Annotated[int, Query(le=100, ge=1, description="Max results")]=100,
    db: Session = Depends(get_db),
) -> TopScoresResponse:
    """Return ranked list of top schools for the requested assessment/level."""
    if assessment not in VALID_ASSESSMENTS:
        raise HTTPException(status_code=422, detail="Invalid assessment")
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail="Invalid level")

    ranked = fetch_top_scores(db, assessment=assessment, level=level, limit=limit)
    return TopScoresResponse(
        results=[TopScoreEntry(**rank.__dict__) for rank in ranked]
    )
