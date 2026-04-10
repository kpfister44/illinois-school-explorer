# ABOUTME: Syncs school data from the ReportCardAPI into the local SQLite database
# ABOUTME: Replaces the direct Excel import pipeline; run manually when new data is available

from __future__ import annotations

import os
import sys
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.database import School, SessionLocal, init_db
from app.utils.api_client import ReportCardAPIClient

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CURRENT_YEAR = 2025

# All historical years needed for hist_* columns (excludes current year)
DEMOGRAPHIC_YEARS = [
    2024, 2023, 2022, 2021, 2020, 2019,
    2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
]

# SAT years (section scores → compute composite → convert to ACT equivalent)
SAT_YEARS: set[int] = {2024, 2023, 2022, 2021, 2019}

# Direct ACT years (act_composite field present)
ACT_YEARS: set[int] = {2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010}

TREND_WINDOWS = [1, 3, 5, 10, 15]

# ---------------------------------------------------------------------------
# Fields requested from current-year (2025) tables
# ---------------------------------------------------------------------------

GENERAL_FIELDS = [
    "rcdts", "school_name", "district", "city", "county",
    "school_type", "grades_served",
    "student_enrollment",
    "pct_student_enrollment_low_income",
    "pct_student_enrollment_el",
    "pct_student_enrollment_white",
    "pct_student_enrollment_black_or_african_american",
    "pct_student_enrollment_hispanic_or_latino",
    "pct_student_enrollment_asian",
    "pct_student_enrollment_native_hawaiian_or_other_pacific_islander",
    "pct_student_enrollment_american_indian_or_alaska_native",
    "pct_student_enrollment_two_or_more_races",
    "pct_student_enrollment_middle_eastern_or_north_african",
]

ACT_FIELDS = [
    "rcdts",
    "act_ela_average_score_grade_11",
    "act_math_average_score_grade_11",
    "act_science_average_score_grade_11",
]

IAR_FIELDS = [
    "rcdts",
    "iar_ela_proficiency_rate_total",
    "iar_math_proficiency_rate_total",
]

# ---------------------------------------------------------------------------
# Multi-candidate field name lookup for historical years.
# Each key maps to an ordered list of possible column names (most-recent format
# first). The first non-null match is used.
# ---------------------------------------------------------------------------

FIELD_CANDIDATES: dict[str, list[str]] = {
    "enrollment": ["student_enrollment"],
    "low_income": [
        "pct_student_enrollment_low_income",
        "student_enrollment_low_income_pct",
        "pct_low_income",
        "pct_low_income",
    ],
    "el": [
        "pct_student_enrollment_el",
        "student_enrollment_el_pct",
        "pct_el",
        "pct_english_learners",
    ],
    "white": [
        "pct_student_enrollment_white",
        "student_enrollment_white_pct",
        "pct_white",
    ],
    "black": [
        "pct_student_enrollment_black_or_african_american",
        "student_enrollment_black_or_african_american_pct",
        "pct_black",
    ],
    "hispanic": [
        "pct_student_enrollment_hispanic_or_latino",
        "student_enrollment_hispanic_or_latino_pct",
        "pct_hispanic",
    ],
    "asian": [
        "pct_student_enrollment_asian",
        "student_enrollment_asian_pct",
        "pct_asian",
    ],
    "pacific_islander": [
        "pct_student_enrollment_native_hawaiian_or_other_pacific_islander",
        "student_enrollment_native_hawaiian_or_other_pacific_islander_pct",
        "pct_native_hawaiian_or_other_pacific_islander",
    ],
    "native_american": [
        "pct_student_enrollment_american_indian_or_alaska_native",
        "student_enrollment_american_indian_or_alaska_native_pct",
        "pct_native_american",
        "pct_american_indian_or_alaska_native",
    ],
    "two_or_more": [
        "pct_student_enrollment_two_or_more_races",
        "student_enrollment_two_or_more_races_pct",
        "pct_two_or_more_races",
    ],
    "mena": [
        "pct_student_enrollment_middle_eastern_or_north_african",
        "student_enrollment_middle_eastern_or_north_african_pct",
        "pct_mena",
    ],
    # SAT section scores (combine reading + math to get composite)
    "sat_reading": [
        "sat_reading_average_score",
        "sat_ebrw_average_score",
        "ela",
    ],
    "sat_math": [
        "sat_math_average_score",
        "math",
    ],
    # Direct ACT fields
    "act_composite": [
        "act_composite_score_grade_11",
        "act_composite",
        "average_act_composite_score",
        "act_average_composite_score",
    ],
    "act_ela": [
        "act_ela_average_score_grade_11",
        "act_ela",
        "act_reading",
    ],
    "act_math_hist": [
        "act_math_average_score_grade_11",
        "act_math",
    ],
    "act_science": [
        "act_science_average_score_grade_11",
        "act_science",
    ],
}

# Diversity metrics: internal key → ISE database column
DIVERSITY_METRICS: dict[str, str] = {
    "white": "pct_white",
    "black": "pct_black",
    "hispanic": "pct_hispanic",
    "asian": "pct_asian",
    "pacific_islander": "pct_pacific_islander",
    "native_american": "pct_native_american",
    "two_or_more": "pct_two_or_more",
    "mena": "pct_mena",
}

# SAT-to-ACT concordance table (SAT min, SAT max, ACT equivalent)
_SAT_TO_ACT_RANGES = [
    (1570, 1600, 36), (1530, 1560, 35), (1490, 1520, 34), (1450, 1480, 33),
    (1420, 1440, 32), (1390, 1410, 31), (1360, 1380, 30), (1330, 1350, 29),
    (1300, 1320, 28), (1260, 1290, 27), (1230, 1250, 26), (1200, 1220, 25),
    (1160, 1190, 24), (1130, 1150, 23), (1100, 1120, 22), (1060, 1090, 21),
    (1030, 1050, 20), (990, 1020, 19), (960, 980, 18), (920, 950, 17),
    (880, 910, 16), (830, 870, 15), (780, 820, 14), (730, 770, 13),
    (690, 720, 12), (650, 680, 11), (620, 640, 10), (590, 610, 9),
]


# ---------------------------------------------------------------------------
# Pure helper functions
# ---------------------------------------------------------------------------

def normalize_level(school_type: Optional[str]) -> str:
    """Normalize school type string to a level bucket."""
    if not school_type:
        return "other"
    normalized = school_type.lower()
    if "middle" in normalized or "junior" in normalized or "intermediate" in normalized:
        return "middle"
    if "high" in normalized:
        return "high"
    if "elementary" in normalized or "primary" in normalized:
        return "elementary"
    return "other"


def sat_to_act(sat_composite: Any) -> Optional[float]:
    """Convert SAT composite (400-1600) to ACT equivalent with interpolation."""
    if sat_composite is None:
        return None
    try:
        score = float(sat_composite)
    except (TypeError, ValueError):
        return None

    if score >= _SAT_TO_ACT_RANGES[0][1]:
        return float(_SAT_TO_ACT_RANGES[0][2])
    if score <= _SAT_TO_ACT_RANGES[-1][0]:
        return float(_SAT_TO_ACT_RANGES[-1][2])

    # Check for gaps between ranges
    for i in range(len(_SAT_TO_ACT_RANGES) - 1):
        cur_min = _SAT_TO_ACT_RANGES[i][0]
        next_max = _SAT_TO_ACT_RANGES[i + 1][1]
        if next_max < score < cur_min:
            lower_act = _SAT_TO_ACT_RANGES[i + 1][2]
            upper_act = _SAT_TO_ACT_RANGES[i][2]
            progress = (score - next_max) / (cur_min - next_max)
            return round(lower_act + progress * (upper_act - lower_act), 1)

    for i, (lo, hi, act) in enumerate(_SAT_TO_ACT_RANGES):
        if lo <= score <= hi:
            if i == 0 or i == len(_SAT_TO_ACT_RANGES) - 1:
                return float(act)
            upper_act = _SAT_TO_ACT_RANGES[i - 1][2]
            progress = (score - lo) / (hi - lo)
            return round(act + progress * (upper_act - act), 1)

    return None


def _safe_float(value: Any) -> Optional[float]:
    """Cast to float, return None on failure or None input."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_field(row: dict, *candidates: str) -> Optional[float]:
    """Try each candidate field name; return the first non-null float found."""
    for name in candidates:
        val = row.get(name)
        if val is not None:
            result = _safe_float(val)
            if result is not None:
                return result
    return None


def _normalize_rcdts(rcdts: str) -> str:
    """Strip hyphens for consistent cross-year RCDTS matching."""
    return rcdts.replace("-", "")


# ---------------------------------------------------------------------------
# DataSync
# ---------------------------------------------------------------------------

class DataSync:
    """Pulls all needed data from ReportCardAPI and writes to local SQLite."""

    def __init__(self, client: ReportCardAPIClient) -> None:
        self.client = client

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def sync(self, db: Session) -> int:
        """Full sync pipeline. Returns the number of schools inserted."""
        print("Fetching current year school data...")
        current_rows = self._fetch_current_year()

        print("Fetching historical data for trends and yearly columns...")
        historical = self._fetch_all_historical()

        print(f"Building {len(current_rows)} school records...")
        records = [self._build_record(row, historical) for row in current_rows]

        print("Clearing existing data and inserting...")
        db.query(School).delete()
        db.commit()
        db.bulk_insert_mappings(School, records)
        db.commit()

        print(f"Synced {len(records)} schools.")
        return len(records)

    # ------------------------------------------------------------------
    # Data fetching
    # ------------------------------------------------------------------

    def _fetch_current_year(self) -> list[dict]:
        """Fetch and merge General + ACT + IAR rows for CURRENT_YEAR."""
        # Keyed by RCDTS for fast merge
        by_rcdts: dict[str, dict] = {}
        for row in self.client.query_all(CURRENT_YEAR, "school", GENERAL_FIELDS):
            by_rcdts[row["rcdts"]] = dict(row)

        for row in self.client.query_all(CURRENT_YEAR, "school", ACT_FIELDS, table_suffix="act"):
            rcdts = row["rcdts"]
            if rcdts in by_rcdts:
                by_rcdts[rcdts].update(row)

        for row in self.client.query_all(CURRENT_YEAR, "school", IAR_FIELDS, table_suffix="iar"):
            rcdts = row["rcdts"]
            if rcdts in by_rcdts:
                by_rcdts[rcdts].update(row)

        return list(by_rcdts.values())

    def _fetch_all_historical(self) -> dict[int, dict[str, dict]]:
        """Fetch all schools for each historical year. Returns {year: {rcdts_no_hyphens: row}}."""
        historical: dict[int, dict[str, dict]] = {}
        for year in DEMOGRAPHIC_YEARS:
            rows = self.client.query_all(year, "school")
            historical[year] = {_normalize_rcdts(r["rcdts"]): r for r in rows if r.get("rcdts")}
        return historical

    # ------------------------------------------------------------------
    # Record assembly
    # ------------------------------------------------------------------

    def _build_record(self, raw: dict, historical: dict[int, dict[str, dict]]) -> dict:
        """Assemble a full School DB record from current API data and historical series."""
        record = self._build_current_record(raw)
        rcdts_key = _normalize_rcdts(record["rcdts"])

        # Trend fields
        record.update(self._build_trend_fields(record, rcdts_key, historical))

        # Historical yearly columns
        record.update(self._build_historical_columns(record, rcdts_key, historical))

        return record

    def _build_current_record(self, raw: dict) -> dict:
        """Map current-year API fields to ISE database column names."""
        iar_ela = _safe_float(raw.get("iar_ela_proficiency_rate_total"))
        iar_math = _safe_float(raw.get("iar_math_proficiency_rate_total"))
        iar_overall = (iar_ela + iar_math) / 2.0 if (iar_ela is not None and iar_math is not None) else None

        return {
            "rcdts": raw["rcdts"],
            "school_name": raw.get("school_name"),
            "district": raw.get("district"),
            "city": raw.get("city"),
            "county": raw.get("county"),
            "school_type": raw.get("school_type"),
            "level": normalize_level(raw.get("school_type")),
            "grades_served": raw.get("grades_served"),
            "student_enrollment": raw.get("student_enrollment"),
            "low_income_percentage": _safe_float(raw.get("pct_student_enrollment_low_income")),
            "el_percentage": _safe_float(raw.get("pct_student_enrollment_el")),
            "act_ela_avg": _safe_float(raw.get("act_ela_average_score_grade_11")),
            "act_math_avg": _safe_float(raw.get("act_math_average_score_grade_11")),
            "act_science_avg": _safe_float(raw.get("act_science_average_score_grade_11")),
            "iar_ela_proficiency_pct": iar_ela,
            "iar_math_proficiency_pct": iar_math,
            "iar_overall_proficiency_pct": round(iar_overall, 2) if iar_overall is not None else None,
            "pct_white": _safe_float(raw.get("pct_student_enrollment_white")),
            "pct_black": _safe_float(raw.get("pct_student_enrollment_black_or_african_american")),
            "pct_hispanic": _safe_float(raw.get("pct_student_enrollment_hispanic_or_latino")),
            "pct_asian": _safe_float(raw.get("pct_student_enrollment_asian")),
            "pct_pacific_islander": _safe_float(
                raw.get("pct_student_enrollment_native_hawaiian_or_other_pacific_islander")
            ),
            "pct_native_american": _safe_float(
                raw.get("pct_student_enrollment_american_indian_or_alaska_native")
            ),
            "pct_two_or_more": _safe_float(raw.get("pct_student_enrollment_two_or_more_races")),
            "pct_mena": _safe_float(raw.get("pct_student_enrollment_middle_eastern_or_north_african")),
        }

    # ------------------------------------------------------------------
    # Trend calculations
    # ------------------------------------------------------------------

    def _build_trend_fields(
        self, record: dict, rcdts_key: str, historical: dict[int, dict[str, dict]]
    ) -> dict[str, Any]:
        """Calculate 1/3/5/10/15-year deltas for enrollment, demographics, diversity, and ACT."""
        trends: dict[str, Any] = {}

        # Enrollment
        enrollment_series = self._build_series(rcdts_key, historical, "enrollment")
        current_enrollment = _safe_float(record.get("student_enrollment"))
        if current_enrollment is not None:
            for w in TREND_WINDOWS:
                d = self._calculate_trend(current_enrollment, enrollment_series, CURRENT_YEAR, w)
                if d is not None:
                    trends[f"enrollment_trend_{w}yr"] = round(d, 2)

        # Demographics
        for metric, field in [("low_income", "low_income_percentage"), ("el", "el_percentage")]:
            series = self._build_series(rcdts_key, historical, metric)
            current = _safe_float(record.get(field))
            if current is not None:
                for w in TREND_WINDOWS:
                    d = self._calculate_trend(current, series, CURRENT_YEAR, w)
                    if d is not None:
                        trends[f"{metric}_trend_{w}yr"] = round(d, 2)

        # Diversity
        for metric in DIVERSITY_METRICS:
            field = DIVERSITY_METRICS[metric]
            series = self._build_series(rcdts_key, historical, metric)
            current = _safe_float(record.get(field))
            if current is not None:
                for w in TREND_WINDOWS:
                    d = self._calculate_trend(current, series, CURRENT_YEAR, w)
                    if d is not None:
                        trends[f"{metric}_trend_{w}yr"] = round(d, 2)

        # ACT composite (current = ELA+Math average)
        ela = record.get("act_ela_avg")
        math = record.get("act_math_avg")
        if ela is not None and math is not None:
            current_act = (_safe_float(ela) + _safe_float(math)) / 2.0
            act_series = self._build_act_series(rcdts_key, historical)
            for w in TREND_WINDOWS:
                d = self._calculate_trend(current_act, act_series, CURRENT_YEAR, w)
                if d is not None:
                    trends[f"act_trend_{w}yr"] = round(d, 2)

        return trends

    def _build_series(
        self, rcdts_key: str, historical: dict[int, dict[str, dict]], metric: str
    ) -> dict[int, float]:
        """Build {year: value} series for a demographic or diversity metric."""
        series: dict[int, float] = {}
        for year, year_data in historical.items():
            row = year_data.get(rcdts_key, {})
            val = self._extract_historical_value(row, metric)
            if val is not None:
                series[year] = val
        return series

    def _build_act_series(
        self, rcdts_key: str, historical: dict[int, dict[str, dict]]
    ) -> dict[int, float]:
        """Build ACT composite series using direct ACT for 2010-2017 and SAT→ACT for 2017-2024."""
        series: dict[int, float] = {}

        for year, year_data in historical.items():
            row = year_data.get(rcdts_key, {})

            if year in SAT_YEARS:
                reading = _get_field(row, *FIELD_CANDIDATES["sat_reading"])
                math_score = _get_field(row, *FIELD_CANDIDATES["sat_math"])
                if reading is not None and math_score is not None:
                    act_val = sat_to_act(reading + math_score)
                    if act_val is not None:
                        series[year] = act_val

            elif year in ACT_YEARS:
                composite = _get_field(row, *FIELD_CANDIDATES["act_composite"])
                if composite is not None:
                    series[year] = composite

        return series

    def _calculate_trend(
        self,
        current: float,
        series: dict[int, float],
        current_year: int,
        window: int,
    ) -> Optional[float]:
        """Compute delta between current value and the historical value at (current_year - window)."""
        target = current_year - window
        if target in series:
            return current - series[target]
        # 5-year window falls back to 2019 if 2020 is missing
        if window == 5 and (target - 1) in series:
            return current - series[target - 1]
        return None

    # ------------------------------------------------------------------
    # Historical yearly columns (hist_*)
    # ------------------------------------------------------------------

    def _build_historical_columns(
        self, record: dict, rcdts_key: str, historical: dict[int, dict[str, dict]]
    ) -> dict[str, Any]:
        """Build all enrollment_hist_YYYY, act_hist_YYYY, etc. columns."""
        hist: dict[str, Any] = {}

        # Current year (2025) from record
        if record.get("student_enrollment") is not None:
            hist["enrollment_hist_2025"] = record["student_enrollment"]
        for metric in DIVERSITY_METRICS:
            val = record.get(DIVERSITY_METRICS[metric])
            if val is not None:
                hist[f"{metric}_hist_2025"] = round(val, 1)
        for field, col in [("el_percentage", "el_hist_2025"), ("low_income_percentage", "low_income_hist_2025")]:
            val = record.get(field)
            if val is not None:
                hist[col] = round(val, 1)
        for act_field, hist_key in [
            ("act_ela_avg", "act_ela_hist_2025"),
            ("act_math_avg", "act_math_hist_2025"),
            ("act_science_avg", "act_science_hist_2025"),
        ]:
            val = _safe_float(record.get(act_field))
            if val is not None:
                hist[hist_key] = round(val, 1)
        ela = _safe_float(record.get("act_ela_avg"))
        math = _safe_float(record.get("act_math_avg"))
        if ela is not None and math is not None:
            hist["act_hist_2025"] = round((ela + math) / 2.0, 1)

        # Historical years
        for year in DEMOGRAPHIC_YEARS:
            row = historical.get(year, {}).get(rcdts_key, {})
            if not row:
                continue

            enrollment = self._extract_historical_value(row, "enrollment")
            if enrollment is not None:
                hist[f"enrollment_hist_{year}"] = int(enrollment)

            for metric in DIVERSITY_METRICS:
                val = self._extract_historical_value(row, metric)
                if val is not None:
                    hist[f"{metric}_hist_{year}"] = round(val, 1)

            el = self._extract_historical_value(row, "el")
            low_income = self._extract_historical_value(row, "low_income")
            if el is not None:
                hist[f"el_hist_{year}"] = round(el, 1)
            if low_income is not None:
                hist[f"low_income_hist_{year}"] = round(low_income, 1)

            # ACT/SAT historical columns
            if year in SAT_YEARS:
                reading = _get_field(row, *FIELD_CANDIDATES["sat_reading"])
                math_score = _get_field(row, *FIELD_CANDIDATES["sat_math"])
                if reading is not None and math_score is not None:
                    act_val = sat_to_act(reading + math_score)
                    if act_val is not None:
                        hist[f"act_hist_{year}"] = round(act_val, 1)
            elif year in ACT_YEARS:
                composite = _get_field(row, *FIELD_CANDIDATES["act_composite"])
                act_ela = _get_field(row, *FIELD_CANDIDATES["act_ela"])
                act_math = _get_field(row, *FIELD_CANDIDATES["act_math_hist"])
                act_science = _get_field(row, *FIELD_CANDIDATES["act_science"])
                if composite is not None:
                    hist[f"act_hist_{year}"] = round(composite, 1)
                if act_ela is not None:
                    hist[f"act_ela_hist_{year}"] = round(act_ela, 1)
                if act_math is not None:
                    hist[f"act_math_hist_{year}"] = round(act_math, 1)
                if act_science is not None:
                    hist[f"act_science_hist_{year}"] = round(act_science, 1)

        return hist

    # ------------------------------------------------------------------
    # Field extraction helper
    # ------------------------------------------------------------------

    def _extract_historical_value(self, row: dict, metric: str) -> Optional[float]:
        """Return a float for the given metric from a historical row, trying all known field names."""
        candidates = FIELD_CANDIDATES.get(metric, [metric])
        return _get_field(row, *candidates)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:  # pragma: no cover
    api_key = os.getenv("REPORT_CARD_API_KEY", "")
    api_url = os.getenv(
        "REPORT_CARD_API_URL",
        "https://reportcard-api-production.up.railway.app",
    )

    if not api_key:
        print("Error: REPORT_CARD_API_KEY environment variable is not set.")
        sys.exit(1)

    init_db()
    db = SessionLocal()
    try:
        with ReportCardAPIClient(api_key, api_url) as client:
            sync = DataSync(client)
            count = sync.sync(db)
        print(f"Done. Synced {count} schools.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
