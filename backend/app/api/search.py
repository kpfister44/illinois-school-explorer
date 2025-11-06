# ABOUTME: Search endpoint implementation using FTS5 full-text search
# ABOUTME: Handles query validation, pagination, and result formatting

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db, search_schools
from app.models import SearchResponse, SchoolSearchResult

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search_schools_endpoint(
    q: Annotated[str, Query(min_length=1, description="Search query")],
    limit: Annotated[int, Query(ge=1, le=50, description="Max results")] = 10,
    db: Session = Depends(get_db),
) -> SearchResponse:
    """Search schools by name, city, or district using full-text search."""
    schools = search_schools(db, q, limit)

    results = [
        SchoolSearchResult(
            id=school.id,
            rcdts=school.rcdts,
            school_name=school.school_name,
            city=school.city,
            district=school.district,
            school_type=school.school_type,
        )
        for school in schools
    ]

    return SearchResponse(results=results, total=len(results))
