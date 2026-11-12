# ABOUTME: Cities endpoint
# ABOUTME: Lists every city and town that has a school, with its number of schools

from fastapi import APIRouter, Depends

from app.models import CityListResponse
from app.services.benchmarks import Benchmarks, get_benchmarks
from app.services.browse import list_cities

router = APIRouter(prefix="/api", tags=["cities"])


@router.get("/cities", response_model=CityListResponse)
def get_cities(benchmarks: Benchmarks = Depends(get_benchmarks)) -> CityListResponse:
    """List every city and town with its number of schools."""
    return CityListResponse(cities=list_cities(benchmarks))
