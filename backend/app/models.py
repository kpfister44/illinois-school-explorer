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


class TrendWindow(BaseModel):
    """Trend deltas over 1/3/5/10/15 year windows."""

    one_year: Optional[float] = None
    three_year: Optional[float] = None
    five_year: Optional[float] = None
    ten_year: Optional[float] = None
    fifteen_year: Optional[float] = None


class TrendMetrics(BaseModel):
    """Collection of per-metric trend windows."""

    enrollment: Optional[TrendWindow] = None
    low_income: Optional[TrendWindow] = None
    el: Optional[TrendWindow] = None
    white: Optional[TrendWindow] = None
    black: Optional[TrendWindow] = None
    hispanic: Optional[TrendWindow] = None
    asian: Optional[TrendWindow] = None
    pacific_islander: Optional[TrendWindow] = None
    native_american: Optional[TrendWindow] = None
    two_or_more: Optional[TrendWindow] = None
    mena: Optional[TrendWindow] = None
    act: Optional[TrendWindow] = None


class HistoricalYearlyData(BaseModel):
    """Historical values by year for a single metric (2010-2025)."""

    yr_2025: Optional[float] = None
    yr_2024: Optional[float] = None
    yr_2023: Optional[float] = None
    yr_2022: Optional[float] = None
    yr_2021: Optional[float] = None
    yr_2020: Optional[float] = None
    yr_2019: Optional[float] = None
    yr_2018: Optional[float] = None
    yr_2017: Optional[float] = None
    yr_2016: Optional[float] = None
    yr_2015: Optional[float] = None
    yr_2014: Optional[float] = None
    yr_2013: Optional[float] = None
    yr_2012: Optional[float] = None
    yr_2011: Optional[float] = None
    yr_2010: Optional[float] = None


class HistoricalMetrics(BaseModel):
    """Historical yearly data for all metrics."""

    enrollment: Optional[HistoricalYearlyData] = None
    act: Optional[HistoricalYearlyData] = None
    act_ela: Optional[HistoricalYearlyData] = None
    act_math: Optional[HistoricalYearlyData] = None
    act_science: Optional[HistoricalYearlyData] = None
    el: Optional[HistoricalYearlyData] = None
    low_income: Optional[HistoricalYearlyData] = None
    white: Optional[HistoricalYearlyData] = None
    black: Optional[HistoricalYearlyData] = None
    hispanic: Optional[HistoricalYearlyData] = None
    asian: Optional[HistoricalYearlyData] = None
    pacific_islander: Optional[HistoricalYearlyData] = None
    native_american: Optional[HistoricalYearlyData] = None
    two_or_more: Optional[HistoricalYearlyData] = None
    mena: Optional[HistoricalYearlyData] = None


class SchoolMetrics(BaseModel):
    """Composite metrics for a school including all categories."""

    enrollment: Optional[int] = None
    act: Optional[ACTScores] = None
    demographics: Optional[Demographics] = None
    diversity: Optional[Diversity] = None
    iar_ela_proficiency_pct: Optional[float] = None
    iar_math_proficiency_pct: Optional[float] = None
    iar_overall_proficiency_pct: Optional[float] = None
    trends: Optional[TrendMetrics] = None
    historical: Optional[HistoricalMetrics] = None


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
    act_ela_avg: Optional[float] = None
    act_math_avg: Optional[float] = None


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
