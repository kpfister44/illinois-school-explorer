# ABOUTME: Statewide benchmark endpoint
# ABOUTME: Returns a metric's average by year and the band where most schools of a level fall

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models import StateBenchmark
from app.services.benchmarks import LEVELS, METRICS, Benchmarks, get_benchmarks

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])


@router.get("/state", response_model=StateBenchmark)
def get_state_benchmark(
    metric: Annotated[str, Query(description="act, iar, el or low_income")],
    level: Annotated[str, Query(description="elementary, middle, high or other")],
    benchmarks: Benchmarks = Depends(get_benchmarks),
) -> StateBenchmark:
    """Return the state average by year and the 10th to 90th percentile band."""
    if metric not in METRICS:
        raise HTTPException(status_code=422, detail="Invalid metric")
    if level not in LEVELS:
        raise HTTPException(status_code=422, detail="Invalid level")

    return benchmarks.state(metric, level)
