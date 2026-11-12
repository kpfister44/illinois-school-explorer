# ABOUTME: Lists for browsing: schools by filter, a district's schools by level, every district and city
# ABOUTME: Works on the schools the benchmarks service holds in memory, so nothing here reads the database

from collections import Counter, defaultdict
from dataclasses import dataclass
from statistics import fmean
from typing import Callable, Optional

from app.models import (
    CitySummary,
    DistrictDetail,
    DistrictLevel,
    DistrictSummary,
    SchoolListItem,
    SchoolListResponse,
)
from app.services.benchmarks import (
    SMALLEST_DISTRICT_AVERAGED,
    Benchmarks,
    SchoolRow,
    district_code,
)

DISTRICT_LEVEL_ORDER = ("elementary", "middle", "high", "other")


def headline_assessment(level: str) -> str:
    """The test whose score stands for a school of a level: the ACT for high schools, otherwise the IAR."""
    return "act" if level == "high" else "iar"


def headline_score(school: SchoolRow) -> Optional[float]:
    return school.values[headline_assessment(school.level)]


def _same_text(value: Optional[str], wanted: str) -> bool:
    return value is not None and value.strip().casefold() == wanted.strip().casefold()


def _in_range(value: Optional[float], lowest: Optional[float], highest: Optional[float]) -> bool:
    if lowest is None and highest is None:
        return True
    if value is None:
        return False
    return (lowest is None or value >= lowest) and (highest is None or value <= highest)


@dataclass(frozen=True)
class SchoolFilters:
    level: Optional[str] = None
    county: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    designation: Optional[str] = None
    enrollment_min: Optional[int] = None
    enrollment_max: Optional[int] = None
    low_income_min: Optional[float] = None
    low_income_max: Optional[float] = None

    def match(self, school: SchoolRow) -> bool:
        return (
            (self.level is None or school.level == self.level)
            and (self.county is None or _same_text(school.county, self.county))
            and (self.district is None or district_code(school.rcdts) == self.district)
            and (self.city is None or _same_text(school.city, self.city))
            and (self.designation is None or school.designation == self.designation)
            and _in_range(school.enrollment, self.enrollment_min, self.enrollment_max)
            and _in_range(school.low_income, self.low_income_min, self.low_income_max)
        )


SORT_VALUES: dict[str, Callable[[SchoolRow], Optional[float]]] = {
    "enrollment": lambda school: school.enrollment,
    "score": headline_score,
}


def _by_name(school: SchoolRow) -> tuple[str, str]:
    return (school.display_name.casefold(), school.rcdts)


def _sorted(schools: list[SchoolRow], sort: str, descending: bool) -> list[SchoolRow]:
    """Order schools by a figure or by name. Schools without the figure come last in either order."""
    ordered = sorted(schools, key=_by_name)
    if sort == "name":
        return ordered[::-1] if descending else ordered

    value = SORT_VALUES[sort]
    with_value = [school for school in ordered if value(school) is not None]
    without_value = [school for school in ordered if value(school) is None]
    with_value.sort(key=value, reverse=descending)
    return with_value + without_value


def _list_item(school: SchoolRow) -> SchoolListItem:
    score = headline_score(school)
    return SchoolListItem(
        rcdts=school.rcdts,
        school_name=school.school_name,
        display_name=school.display_name,
        city=school.city,
        county=school.county,
        district=school.district,
        district_id=district_code(school.rcdts),
        level=school.level,
        grades_served=school.grades_served,
        enrollment=school.enrollment,
        low_income_percentage=school.low_income,
        designation=school.designation,
        assessment=headline_assessment(school.level),
        score=None if score is None else round(score, 2),
    )


def list_schools(
    benchmarks: Benchmarks,
    filters: SchoolFilters,
    sort: Optional[str],
    descending: bool,
    limit: int,
    offset: int,
    search_matches: Optional[list[int]] = None,
) -> SchoolListResponse:
    """One page of the schools that pass the filters.

    `search_matches` holds the ids of the schools a search found, best first. When given,
    only those schools are listed, in that order unless a sort is asked for.
    """
    schools = [school for school in benchmarks.schools if filters.match(school)]
    if search_matches is not None:
        position = {school_id: index for index, school_id in enumerate(search_matches)}
        schools = [school for school in schools if school.id in position]
        schools.sort(key=lambda school: position[school.id])

    if sort is not None or search_matches is None:
        schools = _sorted(schools, sort or "name", descending)

    return SchoolListResponse(
        results=[_list_item(school) for school in schools[offset : offset + limit]],
        total=len(schools),
    )


def _district_level(benchmarks: Benchmarks, level: str, schools: list[SchoolRow]) -> DistrictLevel:
    assessment = headline_assessment(level)
    state = benchmarks.group(assessment, level)
    scores = [score for score in map(headline_score, schools) if score is not None]
    has_district_average = len(scores) >= SMALLEST_DISTRICT_AVERAGED

    return DistrictLevel(
        level=level,
        assessment=assessment,
        state_average=round(state.average, 2) if state.rows else None,
        district_average=round(fmean(scores), 2) if has_district_average else None,
        schools=[_list_item(school) for school in _sorted(schools, "score", descending=True)],
    )


def district_detail(benchmarks: Benchmarks, code: str) -> Optional[DistrictDetail]:
    schools = [school for school in benchmarks.schools if district_code(school.rcdts) == code]
    if not schools:
        return None

    by_level: dict[str, list[SchoolRow]] = defaultdict(list)
    for school in schools:
        by_level[school.level].append(school)

    return DistrictDetail(
        id=code,
        name=schools[0].district,
        county=schools[0].county,
        school_count=len(schools),
        enrollment=sum(school.enrollment or 0 for school in schools),
        levels=[
            _district_level(benchmarks, level, by_level[level])
            for level in DISTRICT_LEVEL_ORDER
            if level in by_level
        ],
    )


def list_districts(benchmarks: Benchmarks) -> list[DistrictSummary]:
    """Every district by name. Districts that share a name are told apart by county."""
    by_code: dict[str, list[SchoolRow]] = defaultdict(list)
    for school in benchmarks.schools:
        by_code[district_code(school.rcdts)].append(school)

    districts = [
        DistrictSummary(
            id=code,
            name=schools[0].district,
            county=schools[0].county,
            school_count=len(schools),
        )
        for code, schools in by_code.items()
    ]
    districts.sort(
        key=lambda district: ((district.name or "").casefold(), district.county or "", district.id)
    )
    return districts


def list_cities(benchmarks: Benchmarks) -> list[CitySummary]:
    """Every city by name, each listed once under the spelling most of its schools use."""
    spellings: dict[str, Counter] = defaultdict(Counter)
    for school in benchmarks.schools:
        name = school.city.strip()
        spellings[name.casefold()][name] += 1

    cities = [
        CitySummary(
            name=min(counts, key=lambda spelling: (-counts[spelling], spelling)),
            school_count=sum(counts.values()),
        )
        for counts in spellings.values()
    ]
    cities.sort(key=lambda city: city.name.casefold())
    return cities
