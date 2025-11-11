# ABOUTME: Pydantic models for API request/response validation
# ABOUTME: Defines schemas for search results, school details, and comparison responses

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, computed_field


class SchoolSearchResult(BaseModel):
    """Search result item with basic school information."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    school_type: Optional[str] = None


class ACTScores(BaseModel):
    """ACT score averages with computed overall average."""

    ela_avg: Optional[float] = None
    math_avg: Optional[float] = None
    science_avg: Optional[float] = None

    @computed_field
    @property
    def overall_avg(self) -> Optional[float]:
        """Compute average of ELA and Math scores."""
        if self.ela_avg is not None and self.math_avg is not None:
            return round((self.ela_avg + self.math_avg) / 2, 2)
        return None


class Demographics(BaseModel):
    """Demographic statistics for a school."""

    el_percentage: Optional[float] = None
    low_income_percentage: Optional[float] = None


class Diversity(BaseModel):
    """Racial and ethnic diversity percentages."""

    white: Optional[float] = None
    black: Optional[float] = None
    hispanic: Optional[float] = None
    asian: Optional[float] = None
    pacific_islander: Optional[float] = None
    native_american: Optional[float] = None
    two_or_more: Optional[float] = None
    mena: Optional[float] = None


class SchoolMetrics(BaseModel):
    """Composite metrics for a school including all categories."""

    enrollment: Optional[int] = None
    act: Optional[ACTScores] = None
    demographics: Optional[Demographics] = None
    diversity: Optional[Diversity] = None
    iar_ela_proficiency_pct: Optional[float] = None
    iar_math_proficiency_pct: Optional[float] = None
    iar_overall_proficiency_pct: Optional[float] = None


class SchoolDetail(BaseModel):
    """Complete school information with all metrics."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    county: Optional[str] = None
    school_type: Optional[str] = None
    grades_served: Optional[str] = None
    metrics: SchoolMetrics


class TopScoreEntry(BaseModel):
    """Single ranked school entry for the top scores endpoint."""

    rank: int
    rcdts: str
    school_name: str
    city: str
    district: Optional[str] = None
    school_type: Optional[str] = None
    level: str
    enrollment: Optional[int] = None
    score: float


class TopScoresResponse(BaseModel):
    """Response wrapper for top scores endpoint."""

    results: List[TopScoreEntry]


class SearchResponse(BaseModel):
    """Response wrapper for search endpoint."""

    results: List[SchoolSearchResult]
    total: int


class CompareResponse(BaseModel):
    """Response wrapper for compare endpoint."""

    schools: List[SchoolDetail]
