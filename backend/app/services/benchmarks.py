# ABOUTME: Benchmarks for a school's metrics: state and district averages, percentile, similar schools
# ABOUTME: Reads every school once and answers from memory, since the database does not change while serving

import math
from dataclasses import dataclass
from functools import cached_property
from statistics import fmean, pstdev, quantiles
from typing import Optional
from weakref import WeakKeyDictionary

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import School, get_db
from app.models import (
    MetricBenchmark,
    SchoolBenchmarks,
    SimilarSchool,
    SimilarSchoolsResponse,
    StateBenchmark,
    StateYearAverage,
)
from app.utils.sync_from_api import CURRENT_YEAR

FIRST_YEAR = 2010
ASSESSMENTS = ("act", "iar")
METRICS = ASSESSMENTS + ("el", "low_income")
LEVELS = ("elementary", "middle", "high", "other")
SIMILAR_SCHOOL_COUNT = 25
SMALLEST_DISTRICT_AVERAGED = 3

CURRENT_COLUMNS = {
    "act": (School.act_ela_avg + School.act_math_avg) / 2,
    "iar": School.iar_overall_proficiency_pct,
    "el": School.el_percentage,
    "low_income": School.low_income_percentage,
}
HISTORY_COLUMN_PREFIXES = {
    "act": "act_hist",
    "iar": "iar_hist",
    "el": "el_hist",
    "low_income": "low_income_hist",
}


def compared_level(metric: str, level: str) -> str:
    """The level of the schools a metric is measured against.

    The ACT is a high school test and the IAR an elementary and middle school test, so a
    school that gives a test outside its own level is compared with the schools that
    normally give it. Schools above the middle grades take the IAR in grades 6 to 8.
    """
    if metric == "act":
        return "high"
    if metric == "iar" and level not in ("elementary", "middle"):
        return "middle"
    return level


def district_code(rcdts: str) -> str:
    """The region-county-district-type prefix of an RCDTS code."""
    return rcdts[:14]


@dataclass(frozen=True)
class _SchoolRow:
    rcdts: str
    school_name: str
    display_name: str
    city: str
    district: Optional[str]
    level: str
    enrollment: Optional[int]
    low_income: Optional[float]
    el: Optional[float]
    values: dict[str, Optional[float]]

    @property
    def matching_values(self) -> Optional[tuple[float, float, float]]:
        """Low-income share, English learner share and log enrollment, if the school can be matched.

        A suppressed English learner share counts as zero.
        """
        if self.low_income is None or not self.enrollment or self.enrollment <= 0:
            return None
        return (self.low_income, self.el or 0.0, math.log(self.enrollment))


class _Group:
    """The schools of one level that report one metric."""

    def __init__(self, metric: str, rows: list[_SchoolRow]):
        self.metric = metric
        self.rows = rows
        self.values = [row.values[metric] for row in rows]

    @cached_property
    def average(self) -> float:
        return fmean(self.values)

    @cached_property
    def band(self) -> tuple[Optional[float], Optional[float]]:
        """10th and 90th percentile of the group's values."""
        if not self.values:
            return (None, None)
        if len(self.values) == 1:
            return (self.values[0], self.values[0])
        deciles = quantiles(self.values, n=10, method="inclusive")
        return (deciles[0], deciles[-1])

    @cached_property
    def matchable(self) -> list[_SchoolRow]:
        return [row for row in self.rows if row.matching_values is not None]

    @cached_property
    def spreads(self) -> tuple[float, ...]:
        """Standard deviation of each matching value; 1 where every school has the same value."""
        columns = zip(*(row.matching_values for row in self.matchable))
        return tuple(pstdev(column) or 1.0 for column in columns)

    def share_below(self, value: float) -> int:
        lower = sum(1 for other in self.values if other < value)
        return round(100 * lower / len(self.values))

    def in_district(self, code: str) -> list[float]:
        return [
            row.values[self.metric] for row in self.rows if district_code(row.rcdts) == code
        ]

    def nearest(self, school: _SchoolRow) -> list[_SchoolRow]:
        """The group's schools most like a school, nearest first."""
        target = school.matching_values
        if target is None:
            return []

        def distance(row: _SchoolRow) -> float:
            return math.sqrt(
                sum(
                    ((value - target_value) / spread) ** 2
                    for value, target_value, spread in zip(
                        row.matching_values, target, self.spreads
                    )
                )
            )

        others = [row for row in self.matchable if row.rcdts != school.rcdts]
        others.sort(key=lambda row: (distance(row), row.rcdts))
        return others[:SIMILAR_SCHOOL_COUNT]


class Benchmarks:
    """Benchmarks for every school, computed from one read of the database."""

    def __init__(self, db: Session):
        self._schools = {row.rcdts: row for row in self._read_schools(db)}
        self._groups = {
            (metric, level): _Group(
                metric,
                [
                    row
                    for row in self._schools.values()
                    if row.level == level and row.values[metric] is not None
                ],
            )
            for metric in METRICS
            for level in LEVELS
        }
        self._history = {metric: self._read_history(db, metric) for metric in METRICS}

    @staticmethod
    def _read_schools(db: Session) -> list[_SchoolRow]:
        rows = db.execute(
            select(
                School.rcdts,
                School.school_name,
                School.display_name,
                School.city,
                School.district,
                School.level,
                School.student_enrollment,
                School.low_income_percentage,
                School.el_percentage,
                *(column.label(metric) for metric, column in CURRENT_COLUMNS.items()),
            )
        ).all()
        return [
            _SchoolRow(
                rcdts=row.rcdts,
                school_name=row.school_name,
                display_name=row.display_name or row.school_name,
                city=row.city,
                district=row.district,
                level=row.level,
                enrollment=row.student_enrollment,
                low_income=row.low_income_percentage,
                el=row.el_percentage,
                values={metric: getattr(row, metric) for metric in METRICS},
            )
            for row in rows
        ]

    @staticmethod
    def _read_history(db: Session, metric: str) -> dict[str, list[StateYearAverage]]:
        """Average of a metric by level for each earlier year that has a history column."""
        prefix = HISTORY_COLUMN_PREFIXES[metric]
        years = [year for year in range(FIRST_YEAR, CURRENT_YEAR) if hasattr(School, f"{prefix}_{year}")]
        history: dict[str, list[StateYearAverage]] = {level: [] for level in LEVELS}
        if not years:
            return history

        columns = []
        for year in years:
            column = getattr(School, f"{prefix}_{year}")
            columns += [func.avg(column), func.count(column)]

        for level, *figures in db.execute(select(School.level, *columns).group_by(School.level)):
            if level not in history:
                continue
            for index, year in enumerate(years):
                average, schools = figures[2 * index], figures[2 * index + 1]
                if schools:
                    history[level].append(
                        StateYearAverage(year=year, average=round(average, 2), schools=schools)
                    )
        return history

    def for_school(self, rcdts: str) -> Optional[SchoolBenchmarks]:
        school = self._schools.get(rcdts)
        if school is None:
            return None
        return SchoolBenchmarks(
            **{metric: self._metric_benchmark(school, metric) for metric in METRICS}
        )

    def _metric_benchmark(self, school: _SchoolRow, metric: str) -> Optional[MetricBenchmark]:
        value = school.values[metric]
        is_assessment = metric in ASSESSMENTS
        if is_assessment and value is None:
            return None

        level = compared_level(metric, school.level)
        group = self._groups.get((metric, level))
        if group is None or not group.rows:
            return None

        district_values = group.in_district(district_code(school.rcdts))
        benchmark = MetricBenchmark(
            level=level,
            state_average=round(group.average, 2),
            state_schools=len(group.rows),
            district_schools=len(district_values),
        )
        if len(district_values) >= SMALLEST_DISTRICT_AVERAGED:
            benchmark.district_average = round(fmean(district_values), 2)
        if is_assessment:
            benchmark.percentile = group.share_below(value)
            benchmark.similar_average = self._similar_average(group.nearest(school), metric)
        return benchmark

    @staticmethod
    def _similar_average(similar: list[_SchoolRow], metric: str) -> Optional[float]:
        if not similar:
            return None
        return round(fmean(row.values[metric] for row in similar), 2)

    def similar(self, rcdts: str, assessment: str) -> Optional[SimilarSchoolsResponse]:
        school = self._schools.get(rcdts)
        if school is None:
            return None

        level = compared_level(assessment, school.level)
        nearest = self._groups[(assessment, level)].nearest(school)
        return SimilarSchoolsResponse(
            assessment=assessment,
            level=level,
            average=self._similar_average(nearest, assessment),
            schools=[
                SimilarSchool(
                    rcdts=row.rcdts,
                    school_name=row.school_name,
                    display_name=row.display_name,
                    city=row.city,
                    district=row.district,
                    enrollment=row.enrollment,
                    low_income_percentage=row.low_income,
                    el_percentage=row.el,
                    score=round(row.values[assessment], 2),
                )
                for row in nearest
            ],
        )

    def state(self, metric: str, level: str) -> StateBenchmark:
        group = self._groups[(metric, level)]
        years = list(self._history[metric][level])
        if group.rows:
            years.append(
                StateYearAverage(
                    year=CURRENT_YEAR, average=round(group.average, 2), schools=len(group.rows)
                )
            )
        band_low, band_high = group.band
        return StateBenchmark(
            metric=metric,
            level=level,
            schools=len(group.rows),
            band_low=None if band_low is None else round(band_low, 2),
            band_high=None if band_high is None else round(band_high, 2),
            years=years,
        )


_benchmarks_by_engine: WeakKeyDictionary = WeakKeyDictionary()


def get_benchmarks(db: Session = Depends(get_db)) -> Benchmarks:
    """Dependency for FastAPI routes: the benchmarks for the session's database, built once."""
    engine = db.get_bind()
    benchmarks = _benchmarks_by_engine.get(engine)
    if benchmarks is None:
        benchmarks = Benchmarks(db)
        _benchmarks_by_engine[engine] = benchmarks
    return benchmarks
