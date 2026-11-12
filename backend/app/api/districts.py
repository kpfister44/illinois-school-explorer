# ABOUTME: District endpoints
# ABOUTME: Lists every district and returns one district's summary with its schools by level

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

from app.models import DistrictDetail, DistrictListResponse
from app.services.benchmarks import Benchmarks, get_benchmarks
from app.services.browse import district_detail, list_districts

router = APIRouter(prefix="/api/districts", tags=["districts"])


@router.get("", response_model=DistrictListResponse)
def get_districts(benchmarks: Benchmarks = Depends(get_benchmarks)) -> DistrictListResponse:
    """List every district with its county and number of schools."""
    return DistrictListResponse(districts=list_districts(benchmarks))


@router.get("/{district_id}", response_model=DistrictDetail)
def get_district(
    district_id: Annotated[str, Path(description="First 14 characters of an RCDTS code")],
    benchmarks: Benchmarks = Depends(get_benchmarks),
) -> DistrictDetail:
    """Get a district's summary and its schools grouped by level."""
    district = district_detail(benchmarks, district_id)
    if district is None:
        raise HTTPException(status_code=404, detail="District not found")

    return district
