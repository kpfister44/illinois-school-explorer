# ABOUTME: Statistics endpoint for the size of the data set
# ABOUTME: Returns how many schools, districts and cities the database covers

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import count_schools_districts_cities, get_db
from app.models import StatsResponse

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)) -> StatsResponse:
    """Count the schools, districts and cities in the database."""
    return StatsResponse(**count_schools_districts_cities(db))
